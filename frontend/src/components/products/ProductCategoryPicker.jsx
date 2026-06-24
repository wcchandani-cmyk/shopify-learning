import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { searchTaxonomy } from "../../services/productService";
import "../../styles/ProductCategoryPicker.css";

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Live category picker backed by Shopify's standardized product taxonomy.
 * Results are fetched on demand from GET /api/product/taxonomy (no hardcoding).
 */
export default function ProductCategoryPicker({
  categoryId,
  categoryName,
  onChange,
}) {
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const requestIdRef = useRef(0);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);

  const isSearching = search.trim().length > 0;

  const close = useCallback(() => {
    setOpen(false);
    setSearch("");
    setBreadcrumb([]);
    setError(null);
  }, []);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const viewportPadding = 12;
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const maxHeight = Math.min(360, Math.max(200, spaceBelow));
    const maxWidth = window.innerWidth - viewportPadding * 2;
    const width = Math.min(rect.width, maxWidth);
    let left = rect.left;
    if (left + width > window.innerWidth - viewportPadding) {
      left = window.innerWidth - viewportPadding - width;
    }
    if (left < viewportPadding) {
      left = viewportPadding;
    }

    setMenuPosition({ top: rect.bottom + 4, left, width, maxHeight });
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    updateMenuPosition();

    const onScrollOrResize = () => updateMenuPosition();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);

    const onPointerDown = (event) => {
      const target = event.target;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      close();
    };

    const timer = window.setTimeout(() => {
      document.addEventListener("mousedown", onPointerDown);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, close, updateMenuPosition]);

  const currentParentId = breadcrumb.length
    ? breadcrumb[breadcrumb.length - 1].id
    : null;

  useEffect(() => {
    if (!open) return undefined;

    const query = search.trim();
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    const args = query ? { search: query } : { childrenOf: currentParentId };

    const timer = window.setTimeout(() => {
      searchTaxonomy(args)
        .then((categories) => {
          if (requestIdRef.current !== requestId) return;
          setResults(categories);
        })
        .catch((err) => {
          if (requestIdRef.current !== requestId) return;
          setResults([]);
          setError(err.message || "Failed to load categories");
        })
        .finally(() => {
          if (requestIdRef.current !== requestId) return;
          setLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [open, search, currentParentId]);

  const handleItemClick = (item) => {
    // While searching we show global matches; pick them directly.
    // While browsing, step into parents and only select leaf categories.
    if (isSearching || item.isLeaf) {
      onChange({ id: item.id, fullName: item.fullName });
      close();
      return;
    }
    setBreadcrumb((prev) => [...prev, { id: item.id, name: item.name }]);
  };

  const handleBack = () => {
    setBreadcrumb((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    onChange(null);
    close();
  };

  const hasValue = Boolean(categoryName?.trim() || categoryId);
  const label = hasValue ? categoryName : "Choose a product category";

  const menu =
    open && menuPosition
      ? createPortal(
          <div
            ref={menuRef}
            className="category-picker__menu category-picker__menu--portal"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
              maxHeight: menuPosition.maxHeight,
            }}
            role="listbox"
          >
            <div className="category-picker__search">
              <input
                type="text"
                className="category-picker__search-input"
                placeholder="Search categories"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            {!isSearching && breadcrumb.length > 0 ? (
              <button
                type="button"
                className="category-picker__back"
                onClick={handleBack}
              >
                ← {breadcrumb[breadcrumb.length - 1].name}
              </button>
            ) : null}

            <div className="category-picker__list">
              {hasValue ? (
                <button
                  type="button"
                  className="category-picker__back"
                  onClick={handleClear}
                >
                  Clear category
                </button>
              ) : null}

              {loading ? (
                <p className="category-picker__empty">Searching…</p>
              ) : null}

              {!loading && error ? (
                <p className="category-picker__empty">{error}</p>
              ) : null}

              {!loading && !error
                ? results.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`category-picker__item${
                        item.id === categoryId ? " is-selected" : ""
                      }`}
                      onClick={() => handleItemClick(item)}
                    >
                      <span className="category-picker__item-full">
                        {isSearching ? item.fullName : item.name}
                      </span>
                      {!isSearching && !item.isLeaf ? (
                        <span className="category-picker__item-chevron">›</span>
                      ) : null}
                    </button>
                  ))
                : null}

              {!loading && !error && results.length === 0 ? (
                <p className="category-picker__empty">No categories found</p>
              ) : null}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="category-picker">
      <button
        ref={triggerRef}
        type="button"
        className={`category-picker__trigger${open ? " is-open" : ""}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => {
          setOpen((wasOpen) => {
            if (!wasOpen) updateMenuPosition();
            return !wasOpen;
          });
        }}
      >
        <span className={hasValue ? undefined : "category-picker__placeholder"}>
          {label}
        </span>
        <span className="category-picker__chevron">▾</span>
      </button>

      <p className="category-picker__details">
        Determines tax rates and improves search, filters, and cross-channel
        sales.
      </p>

      {menu}
    </div>
  );
}
