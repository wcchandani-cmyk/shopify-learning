import { useCallback, useId, useMemo, useRef, useState } from "react";

export default function SearchableSelect({
  label,
  details,
  value,
  onChange,
  options = [],
  placeholder = "Search…",
}) {
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
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const handleSelect = useCallback(
    (val) => {
      onChange(val);
      setSearch("");
    },
    [onChange]
  );

  return (
    <div className="searchable-select">
      {label && <label className="searchable-select__label">{label}</label>}
      {details && <span className="searchable-select__details">{details}</span>}

      <button
        type="button"
        className="searchable-select__trigger"
        commandFor={popoverId}
        command="--toggle"
        onClick={() => {
          setSearch("");
          setTimeout(() => searchInputRef.current?.focus(), 50);
        }}
      >
        <span className="searchable-select__value">
          {selectedLabel || (
            <span className="searchable-select__placeholder">Select…</span>
          )}
        </span>
        <span className="searchable-select__arrow">▾</span>
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
          {filtered.length === 0 && (
            <div className="searchable-select__empty">No results</div>
          )}
          {filtered.map((opt) => (
            <button
              type="button"
              key={opt.value}
              className={`searchable-select__option ${
                opt.value === value ? "searchable-select__option--selected" : ""
              }`}
              role="option"
              aria-selected={opt.value === value}
              command="--hide"
              commandFor={popoverId}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
              {opt.value === value && (
                <span className="searchable-select__check">✓</span>
              )}
            </button>
          ))}
        </div>
      </s-popover>
    </div>
  );
}
