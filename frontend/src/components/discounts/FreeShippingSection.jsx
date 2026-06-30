import { useChoiceList } from "../../hooks/useChoiceList";
import { getInputEventValue, getCheckboxChecked } from "../../utils/fieldEvent";
import { Flag, PillFlag, getCountryName } from "../shared/CountryFlag";

export default function FreeShippingSection({
  form,
  updateField,
  countrySearchQuery,
  setCountrySearchQuery,
  autocompleteCountries,
  onOpenCountryModal,
}) {
  const handleCountriesChange = (nextValue) => {
    updateField("shippingCountries", nextValue);
    if (nextValue === "all") {
      updateField("selectedCountries", []);
    }
  };

  const countriesRef = useChoiceList(form.shippingCountries, handleCountriesChange);

  const handlePurchaseTypeChange = (nextValue) => {
    updateField("purchaseType", nextValue);
  };

  const purchaseTypeRef = useChoiceList(form.purchaseType, handlePurchaseTypeChange);

  return (
    <s-stack gap="base">
      <s-section heading="Countries">
        <s-stack gap="base">
          <s-choice-list
            ref={countriesRef}
            name="shippingCountries"
            values={[form.shippingCountries]}
          >
            <s-choice value="all">All countries</s-choice>
            <s-choice value="selected">Selected countries</s-choice>
          </s-choice-list>

          {form.shippingCountries === "selected" && (
            <s-stack gap="tight">
              <div className="search-browse-row" style={{ marginTop: "4px" }}>
                <div className="search-input-wrapper">
                  <s-text-field
                    label="Search countries"
                    labelAccessibilityVisibility="exclusive"
                    icon="search"
                    placeholder="Search countries"
                    value={countrySearchQuery}
                    onInput={(event) => setCountrySearchQuery(getInputEventValue(event))}
                  />
                </div>
                <s-button onClick={onOpenCountryModal}>Browse</s-button>
              </div>

              {autocompleteCountries.length > 0 && (
                <div className="autocomplete-dropdown">
                  {autocompleteCountries.map((country) => (
                    <div
                      key={country.code}
                      className="channel-list-item flex-align-center"
                      onClick={() => {
                        const next = [...(form.selectedCountries || [])];
                        if (!next.includes(country.code)) {
                          next.push(country.code);
                          updateField("selectedCountries", next);
                        }
                        setCountrySearchQuery("");
                      }}
                    >
                      <Flag iso={country.code} />
                      <span>{country.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {form.selectedCountries && form.selectedCountries.length > 0 && (
                <div className="selected-tags-container">
                  {form.selectedCountries.map((countryCode) => {
                    const name = getCountryName(countryCode);
                    return (
                      <span key={countryCode} className="tag-pill">
                        <PillFlag iso={countryCode} />
                        {name}
                        <button
                          type="button"
                          className="tag-pill__remove"
                          onClick={() => {
                            const next = form.selectedCountries.filter((code) => code !== countryCode);
                            updateField("selectedCountries", next);
                          }}
                        >
                          &times;
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </s-stack>
          )}

          <div style={{ marginTop: "16px" }}>
            <label className="field-label" style={{ marginBottom: "8px", display: "block", fontWeight: 600 }}>Purchase type</label>
            <s-choice-list
              ref={purchaseTypeRef}
              name="freeShippingPurchaseType"
              values={[form.purchaseType]}
            >
              <s-choice value="one_time">One-time purchase</s-choice>
              <s-choice value="subscription">Subscription</s-choice>
              <s-choice value="both">Both</s-choice>
            </s-choice-list>
          </div>

          <div style={{ marginTop: "16px" }}>
            <label className="field-label" style={{ marginBottom: "8px", display: "block", fontWeight: 600 }}>Shipping rates</label>
            <s-checkbox
              label="Exclude shipping rates over a certain amount"
              checked={form.excludeShippingRates}
              onChange={(event) => updateField("excludeShippingRates", getCheckboxChecked(event))}
            />
            {form.excludeShippingRates && (
              <div className="checkbox-conditional-field" style={{ marginTop: "8px" }}>
                <div style={{ width: "200px" }}>
                  <s-money-field
                    label="Exclude shipping rates amount"
                    labelAccessibilityVisibility="exclusive"
                    placeholder="0.00"
                    value={form.excludeShippingRatesValue || "1,000.00"}
                    onInput={(event) => updateField("excludeShippingRatesValue", getInputEventValue(event))}
                  />
                </div>
              </div>
            )}
          </div>
        </s-stack>
      </s-section>
    </s-stack>
  );
}
