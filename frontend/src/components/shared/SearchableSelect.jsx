import { useCallback, useId, useMemo, useRef, useState } from "react";

export default function SearchableSelect({
  label,
  details,
  value,
  onChange,
  options = [],
  placeholder = "Search…",
  triggerPlaceholder = "Select…",
  variant = "select",
  optionClassName,
  renderOption,
  onActionClick,
  actionLabel,
  actionIcon,
  actionPosition = "bottom",
  loading,
}) {
  const isSearch = variant === "search";
  const [search, setSearch] = useState("");
  const popoverRef = useRef(null);
  const searchInputRef = useRef(null);
  const popoverId = `ss-${useId().replace(/:/g, "")}`;

  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label || "",
    [options, value]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.email && o.email.toLowerCase().includes(q))
    );
  }, [options, search]);

  const handleSelect = useCallback(
    (val) => {
      onChange(val);
      setSearch("");
    },
    [onChange]
  );

  const activeOptionClass = optionClassName || "searchable-select__option";

  return (
    <div className="searchable-select">
      {label && <label className="searchable-select__label">{label}</label>}
      {details && <span className="searchable-select__details">{details}</span>}

      <button
        type="button"
        className={`searchable-select__trigger${
          isSearch ? " searchable-select__trigger--search" : ""
        }`}
        commandFor={popoverId}
        command="--toggle"
        onClick={() => {
          setSearch("");
          setTimeout(() => searchInputRef.current?.focus(), 50);
        }}
      >
        {isSearch && (
          <span className="searchable-select__lead-icon">
            <s-icon type="search" />
          </span>
        )}
        <span className="searchable-select__value">
          {selectedLabel || (
            <span className="searchable-select__placeholder">{triggerPlaceholder}</span>
          )}
        </span>
        {!isSearch && <span className="searchable-select__arrow">▾</span>}
      </button>

      <s-popover id={popoverId} ref={popoverRef} maxBlockSize="320px">
        <div className="searchable-select__search-wrap">
          <input
            ref={searchInputRef}
            className="searchable-select__search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            aria-label={`Search ${label || "options"}`}
          />
        </div>
        <div className="searchable-select__list" role="listbox">
          {onActionClick && actionPosition === "top" && (
            <>
              <button
                type="button"
                className="customer-select-add-new-btn"
                command="--hide"
                commandFor={popoverId}
                onClick={() => {
                  onActionClick();
                  setSearch("");
                }}
              >
                {actionIcon && <s-icon type={actionIcon} />} {actionLabel}
              </button>
              <s-divider />
            </>
          )}
          {loading && (
            <div className="searchable-select__empty">Loading...</div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="searchable-select__empty">No results</div>
          )}
          {!loading && filtered.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                type="button"
                key={opt.value}
                className={`${activeOptionClass} ${isSelected ? `${activeOptionClass}--selected` : ""
                  }`}
                role="option"
                aria-selected={isSelected}
                command="--hide"
                commandFor={popoverId}
                onClick={() => handleSelect(opt.value)}
              >
                {renderOption ? renderOption(opt) : opt.label}
                {isSelected && (
                  <span className="searchable-select__check">✓</span>
                )}
              </button>
            );
          })}
          {onActionClick && actionPosition !== "top" && (
            <>
              <s-divider />
              <button
                type="button"
                className="customer-select-add-new-btn"
                command="--hide"
                commandFor={popoverId}
                onClick={() => {
                  onActionClick();
                  setSearch("");
                }}
              >
                {actionIcon && <s-icon type={actionIcon} />} {actionLabel}
              </button>
            </>
          )}
        </div>
      </s-popover>
    </div>
  );
}
