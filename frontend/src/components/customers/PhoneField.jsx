import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  CALLING_CODES,
  composePhone,
  findCallingCode,
  parsePhone,
} from "../../utils/countryCallingCodes";
import { getInputEventValue } from "../../utils/fieldEvent";

const flagUrl = (iso) => `https://flagcdn.com/w40/${iso.toLowerCase()}.png`;

function Flag({ iso }) {
  return (
    <img
      className="phone-field__flag"
      src={flagUrl(iso)}
      alt={iso}
      loading="lazy"
      width="20"
      height="15"
    />
  );
}

export default function PhoneField({
  label = "Phone number",
  value,
  onChange,
}) {
  const { iso: parsedIso, national } = useMemo(
    () => parsePhone(value),
    [value]
  );
  const [localIso, setLocalIso] = useState(parsedIso);
  const [ccSearch, setCcSearch] = useState("");
  const popoverRef = useRef(null);
  const searchInputRef = useRef(null);
  const popoverId = `phone-cc-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    if (value) {
      setLocalIso(parsedIso);
    }
  }, [value, parsedIso]);

  const filteredCodes = useMemo(() => {
    if (!ccSearch.trim()) return CALLING_CODES;
    const q = ccSearch.toLowerCase();
    return CALLING_CODES.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.dial.includes(q) ||
        item.code.toLowerCase().includes(q)
    );
  }, [ccSearch]);

  const selectCountry = (nextIso) => {
    setLocalIso(nextIso);
    onChange(composePhone(nextIso, national));
    setCcSearch("");
  };

  const handleNumberInput = (event) => {
    onChange(composePhone(localIso, getInputEventValue(event)));
  };

  const country = findCallingCode(localIso);

  return (
    <div className="phone-field">
      <label className="phone-field__label">{label}</label>
      <div className="phone-field__row">
        <s-button
          variant="tertiary"
          commandFor={popoverId}
          command="--toggle"
          accessibilityLabel="Select country calling code"
          onClick={() => {
            setCcSearch("");
            setTimeout(() => searchInputRef.current?.focus(), 50);
          }}
        >
          <Flag iso={country.code} />
        </s-button>

        <input
          className="phone-field__input"
          type="tel"
          inputMode="tel"
          value={national}
          onInput={handleNumberInput}
          aria-label={label}
        />
      </div>

      <s-popover id={popoverId} ref={popoverRef} maxBlockSize="320px">
        <div className="phone-field__search-wrap">
          <input
            ref={searchInputRef}
            className="phone-field__search"
            type="text"
            value={ccSearch}
            onChange={(e) => setCcSearch(e.target.value)}
            placeholder="Search country…"
            aria-label="Search country calling code"
          />
        </div>
        <div className="phone-field__list" role="listbox">
          {filteredCodes.length === 0 && (
            <div className="phone-field__no-results">No results</div>
          )}
          {filteredCodes.map((item) => (
            <button
              type="button"
              key={item.code}
              className="phone-field__option"
              command="--hide"
              commandFor={popoverId}
              onClick={() => selectCountry(item.code)}
            >
              <Flag iso={item.code} />
              <span className="phone-field__option-name">
                {item.name} (+{item.dial})
              </span>
            </button>
          ))}
        </div>
      </s-popover>
    </div>
  );
}
