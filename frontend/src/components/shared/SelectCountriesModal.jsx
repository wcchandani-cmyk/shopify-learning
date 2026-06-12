import { getInputEventValue, getCheckboxChecked } from "../../utils/fieldEvent";
import { Flag } from "./CountryFlag";

export default function SelectCountriesModal({
  modalRef,
  countrySearch,
  setCountrySearch,
  showOnlySelectedCountries,
  setShowOnlySelectedCountries,
  tempSelectedCountries,
  filteredCountries,
  isAllFilteredCountriesSelected,
  onToggleSelectAll,
  onToggleCountry,
  onSave,
  onClose,
  onAfterHide,
}) {
  return (
    <s-modal
      id="select-countries-modal"
      ref={modalRef}
      heading="Select countries"
      onAfterHide={onAfterHide}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px 0" }}>
        <s-text-field
          label="Search"
          labelAccessibilityVisibility="exclusive"
          icon="search"
          placeholder="Search"
          value={countrySearch}
          onInput={(event) => setCountrySearch(getInputEventValue(event))}
        />

        <div className="channel-modal-controls">
          <div className="channel-modal-controls__left">
            <span className="product-list-checkbox" onClick={(e) => e.stopPropagation()}>
              <s-checkbox
                checked={isAllFilteredCountriesSelected}
                onChange={onToggleSelectAll}
              />
            </span>
            <span style={{ fontSize: "14px", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "4px" }}>
              {tempSelectedCountries.length} selected <s-icon type="chevron-down" />
            </span>
          </div>
          <div className="channel-modal-controls__right" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <s-switch
              checked={showOnlySelectedCountries || undefined}
              onChange={(event) => setShowOnlySelectedCountries(getCheckboxChecked(event))}
            />
            <span style={{ fontSize: "14px" }}>Show all selected</span>
          </div>
        </div>

        <div className="channel-list-container">
          {filteredCountries.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#6d7175" }}>
              No countries found.
            </div>
          ) : (
            filteredCountries.map((country) => (
              <div key={country.code} className="channel-list-item" onClick={() => onToggleCountry(country.code)}>
                <span className="product-list-checkbox" onClick={(e) => e.stopPropagation()}>
                  <s-checkbox
                    checked={tempSelectedCountries.includes(country.code)}
                    onChange={() => onToggleCountry(country.code)}
                  />
                </span>
                <div className="channel-list-item__content flex-align-center">
                  <Flag iso={country.code} />
                  <span>{country.name}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <s-button
        slot="primary-action"
        variant="primary"
        onClick={onSave}
      >
        Done
      </s-button>
      <s-button slot="secondary-actions" onClick={onClose}>
        Cancel
      </s-button>
    </s-modal>
  );
}
