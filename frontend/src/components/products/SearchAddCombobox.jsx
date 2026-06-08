import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../../styles/ProductCategoryPicker.css";

/**
 * Shopify-style "search or add" combobox used for free-text fields like
 * product Type and Vendor. Lists existing values, filters as you type, and lets
 * you commit a brand-new value.
 *
 * Pass either a static `options` array or an async `loadOptions` function
 * (fetched once on first open) for live values from Shopify.
 */
export default function SearchAddCombobox({
  label,
  placeholder,
  value,
  options,
  loadOptions,
  onChange,
}) {
  const wrapperRef = useRef(null);
  const menuRef = useRef(null);
  const loadedRef = useRef(false);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value || "");
  // Tracks whether the user has typed since opening. Until they do, we show the
  // full list (instead of filtering by the already-selected value).
  const [typed, setTyped] = useState(false);
  const [menuPosition, setMenuPosition] = useState(null);
  const [loadedOptions, setLoadedOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSearch(value || "");
  }, [value]);

  const commit = useCallback(
    (next) => {
      const trimmed = String(next ?? "").trim();
      setSearch(trimmed);
      if (trimmed !== (value || "")) onChange(trimmed);
    },
    [value, onChange],
  );

  const close = useCallback(
    (next) => {
      setOpen(false);
      commit(next ?? search);
    },
    [commit, search],
  );

  const updateMenuPosition = useCallback(() => {
    const trigger = wrapperRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const viewportPadding = 12;
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const maxHeight = Math.min(320, Math.max(180, spaceBelow));
    setMenuPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      maxHeight,
    });
  }, []);

  const ensureLoaded = useCallback(() => {
    if (!loadOptions || loadedRef.current) return;
    loadedRef.current = true;
    setLoading(true);
    Promise.resolve(loadOptions())
      .then((values) => setLoadedOptions(Array.isArray(values) ? values : []))
      .catch(() => setLoadedOptions([]))
      .finally(() => setLoading(false));
  }, [loadOptions]);

  useEffect(() => {
    if (!open) return undefined;

    updateMenuPosition();

    const onScrollOrResize = () => updateMenuPosition();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);

    const onPointerDown = (event) => {
      const target = event.target;
      if (wrapperRef.current?.contains(target)) return;
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

  const allOptions = loadOptions ? loadedOptions : options || [];
  // Only filter once the user starts typing; on open we show every value.
  const query = (typed ? search.trim() : "").toLowerCase();
  const filtered = query
    ? allOptions.filter((option) => option.toLowerCase().includes(query))
    : allOptions;
  const exactMatch = allOptions.some(
    (option) => option.toLowerCase() === query && query.length > 0,
  );
  const canAdd = query.length > 0 && !exactMatch;

  const openMenu = () => {
    setTyped(false);
    ensureLoaded();
    updateMenuPosition();
    setOpen(true);
  };

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
            <div className="category-picker__list">
              {canAdd ? (
                <button
                  type="button"
                  className="category-picker__item"
                  onClick={() => close(search)}
                >
                  <span>Add &ldquo;{search.trim()}&rdquo;</span>
                </button>
              ) : null}

              {loading ? (
                <p className="category-picker__empty">Loading…</p>
              ) : null}

              {!loading
                ? filtered.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`category-picker__item${
                        option === value ? " is-selected" : ""
                      }`}
                      onClick={() => close(option)}
                    >
                      <span>{option}</span>
                    </button>
                  ))
                : null}

              {!loading && filtered.length === 0 && !canAdd ? (
                <p className="category-picker__empty">No matches found</p>
              ) : null}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="category-picker" ref={wrapperRef}>
      {label ? <span className="product-type-field__label">{label}</span> : null}
      <div className="category-picker__search product-type-field__control">
        <input
          type="text"
          className="category-picker__search-input"
          placeholder={placeholder}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setTyped(true);
            if (!open) {
              ensureLoaded();
              updateMenuPosition();
              setOpen(true);
            }
          }}
          onFocus={(event) => {
            openMenu();
            event.target.select();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              close(search);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />
      </div>

      {menu}
    </div>
  );
}
