import { useState } from "react";
import { getInputEventValue, getCheckboxChecked } from "../../utils/fieldEvent";

export default function EligibilitySection({
  form,
  updateField,
  type,
  openMarketsModal,
  openSegmentsModal,
  openCustomersModal,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleRemoveMarket = (market) => {
    const next = (form.selectedMarkets || []).filter((marketItem) => marketItem.id !== market.id);
    updateField("selectedMarkets", next);
  };

  const handleRemoveSegment = (segment) => {
    const next = (form.selectedSegments || []).filter((segmentItem) => segmentItem.id !== segment.id);
    updateField("selectedSegments", next);
  };

  const handleRemoveCustomer = (customer) => {
    const next = (form.selectedCustomers || []).filter((customerItem) => customerItem.id !== customer.id);
    updateField("selectedCustomers", next);
  };

  const selectedMarkets = form.selectedMarkets || [];
  const selectedSegments = form.selectedSegments || [];
  const selectedCustomers = form.selectedCustomers || [];

  return (
    <s-section heading="Customer eligibility">
      <s-stack gap="base">
        <s-select
          label="Customer eligibility"
          labelAccessibilityVisibility="exclusive"
          value={form.eligibility}
          onChange={(event) => {
            const val = getInputEventValue(event);
            updateField("eligibility", val);
            setSearchQuery("");
          }}
        >
          <s-option value="All customers">All customers</s-option>
          <s-option value="Markets">Markets</s-option>
          <s-option value="Customer segments">Customer segments</s-option>
          <s-option value="Specific customers">Specific customers</s-option>
        </s-select>

        {form.eligibility === "Markets" && (
          <s-stack gap="tight">
            {selectedMarkets.length > 0 ? (
              <div className="eligibility-pills-container">
                <div className="eligibility-pills-list">
                  {selectedMarkets.map((market) => (
                    <span key={market.id} className="eligibility-pill">
                      <s-icon source="globe" />
                      <span className="eligibility-pill-text">{market.title}</span>
                      <button
                        type="button"
                        className="eligibility-pill-remove"
                        onClick={() => handleRemoveMarket(market)}
                        title="Remove"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  className="eligibility-edit-btn"
                  onClick={openMarketsModal}
                  title="Edit markets"
                >
                  <s-icon type="edit" />
                </button>
              </div>
            ) : (
              <div className="search-browse-row">
                <div className="search-input-wrapper">
                  <s-text-field
                    label="Search markets"
                    labelAccessibilityVisibility="exclusive"
                    icon="search"
                    placeholder="Search markets"
                    value={searchQuery}
                    onInput={(event) => setSearchQuery(getInputEventValue(event))}
                  />
                </div>
                <s-button onClick={openMarketsModal}>Browse</s-button>
              </div>
            )}
          </s-stack>
        )}

        {form.eligibility === "Customer segments" && (
          <s-stack gap="tight">
            {selectedSegments.length > 0 ? (
              <div className="eligibility-pills-container">
                <div className="eligibility-pills-list">
                  {selectedSegments.map((segment) => (
                    <span key={segment.id} className="eligibility-pill">
                      <s-icon source="customers" />
                      <span className="eligibility-pill-text">{segment.title}</span>
                      <button
                        type="button"
                        className="eligibility-pill-remove"
                        onClick={() => handleRemoveSegment(segment)}
                        title="Remove"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  className="eligibility-edit-btn"
                  onClick={openSegmentsModal}
                  title="Edit customer segments"
                >
                  <s-icon type="edit" />
                </button>
              </div>
            ) : (
              <div className="search-browse-row">
                <div className="search-input-wrapper">
                  <s-text-field
                    label="Search segments"
                    labelAccessibilityVisibility="exclusive"
                    icon="search"
                    placeholder="Search segments"
                    value={searchQuery}
                    onInput={(event) => setSearchQuery(getInputEventValue(event))}
                  />
                </div>
                <s-button onClick={openSegmentsModal}>Browse</s-button>
              </div>
            )}
          </s-stack>
        )}

        {form.eligibility === "Specific customers" && (
          <s-stack gap="tight">
            {selectedCustomers.length > 0 ? (
              <div className="eligibility-pills-container">
                <div className="eligibility-pills-list">
                  {selectedCustomers.map((customer) => (
                    <span key={customer.id} className="eligibility-pill">
                      <s-icon source="customer" />
                      <span className="eligibility-pill-text">{customer.title}</span>
                      <button
                        type="button"
                        className="eligibility-pill-remove"
                        onClick={() => handleRemoveCustomer(customer)}
                        title="Remove"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  className="eligibility-edit-btn"
                  onClick={openCustomersModal}
                  title="Edit customers"
                >
                  <s-icon type="edit" />
                </button>
              </div>
            ) : (
              <div className="search-browse-row">
                <div className="search-input-wrapper">
                  <s-text-field
                    label="Search customers"
                    labelAccessibilityVisibility="exclusive"
                    icon="search"
                    placeholder="Search customers"
                    value={searchQuery}
                    onInput={(event) => setSearchQuery(getInputEventValue(event))}
                  />
                </div>
                <s-button onClick={openCustomersModal}>Browse</s-button>
              </div>
            )}
          </s-stack>
        )}

        {type === "Free shipping" && (
          <s-checkbox
            label="Apply on POS Pro locations"
            checked={form.applyOnPosProLocations ?? true}
            onChange={(event) => updateField("applyOnPosProLocations", getCheckboxChecked(event))}
          />
        )}
      </s-stack>
    </s-section>
  );
}
