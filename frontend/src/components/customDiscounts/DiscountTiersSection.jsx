import React from "react";
import "../../styles/CustomDiscountDetail.css";

export default function DiscountTiersSection({
  tiers = [],
  onChangeTiers,
  discountType,
}) {
  const isFixed = discountType === "fixed_amount";

  const handleAddTier = () => {
    const newTier = {
      id: Date.now() + Math.random(),
      message: "",
      quantity: "",
      discountValue: "",
    };
    onChangeTiers([...tiers, newTier]);
  };

  const handleRemoveTier = (id) => {
    onChangeTiers(tiers.filter((t) => t.id !== id));
  };

  const handleUpdateTierField = (id, field, val) => {
    onChangeTiers(
      tiers.map((t) => {
        if (t.id === id) {
          return { ...t, [field]: val };
        }
        return t;
      })
    );
  };

  return (
    <s-section heading="Discount Tiers">
      <div className="discount-tiers-list">
        {tiers.map((tier, index) => (
          <div className="tier-item-container" key={tier.id}>
            <div className="tier-header-row">
              <span className="tier-number-label">Tier {index + 1}</span>
              {tiers.length > 1 && (
                <button
                  type="button"
                  className="condition-builder-delete-btn"
                  onClick={() => handleRemoveTier(tier.id)}
                  aria-label="Remove tier"
                >
                  <s-icon type="delete" tone="critical" />
                </button>
              )}
            </div>

            <s-stack gap="small-200">
              <div>
                <label className="form-group-label" htmlFor={`tier-message-${tier.id}`}>
                  Message
                </label>
                <input
                  id={`tier-message-${tier.id}`}
                  type="text"
                  className="discount-input-field"
                  placeholder="e.g. Buy more, save more"
                  value={tier.message}
                  onChange={(e) => handleUpdateTierField(tier.id, "message", e.target.value)}
                />
              </div>

              <div className="side-by-side-row">
                <div>
                  <label className="form-group-label" htmlFor={`tier-quantity-${tier.id}`}>
                    Quantity
                  </label>
                  <div className="discount-value-input-wrapper">
                    <input
                      id={`tier-quantity-${tier.id}`}
                      type="number"
                      className="discount-input-field"
                      placeholder="0"
                      value={tier.quantity}
                      onChange={(e) => handleUpdateTierField(tier.id, "quantity", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-group-label" htmlFor={`tier-value-${tier.id}`}>
                    Discount Value
                  </label>
                  <div className={`discount-value-input-wrapper ${isFixed ? "has-prefix" : "has-suffix"}`}>
                    {isFixed && <span className="discount-value-icon prefix">$</span>}
                    <input
                      id={`tier-value-${tier.id}`}
                      type="number"
                      className="discount-input-field"
                      placeholder={isFixed ? "0.00" : "0"}
                      value={tier.discountValue}
                      onChange={(e) => handleUpdateTierField(tier.id, "discountValue", e.target.value)}
                    />
                    {!isFixed && <span className="discount-value-icon suffix">%</span>}
                  </div>
                </div>
              </div>
            </s-stack>
          </div>
        ))}
      </div>

      <div className="discount-tiers-footer">
        <s-button
          variant="primary"
          onClick={handleAddTier}
          style={{ width: "fit-content", backgroundColor: "#202223", color: "#ffffff" }}
        >
          Add a tier
        </s-button>
      </div>
    </s-section>
  );
}
