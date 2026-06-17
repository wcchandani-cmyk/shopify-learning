import { useState } from "react";
import "../../styles/CustomDiscountDetail.css";
import { SHIPPING_METHOD_OPTIONS } from "../../constants/customDiscounts";

export default function ShippingMethodSection({
  scope = "all",
  onChangeScope,
  methods = [],
  onChangeMethods,
}) {
  const [selected, setSelected] = useState("");

  const available = SHIPPING_METHOD_OPTIONS.filter(
    (option) => !methods.includes(option)
  );

  const handleAdd = () => {
    const value = selected.trim();
    if (!value || methods.includes(value)) return;
    onChangeMethods([...methods, value]);
    setSelected("");
  };

  const handleRemove = (name) => {
    onChangeMethods(methods.filter((item) => item !== name));
  };

  return (
    <s-section heading="Select Shipping Method">
      <s-stack gap="base">
        <div className="radio-options-stack">
          <label className="radio-option-label">
            <input
              type="radio"
              name="shippingMethodScope"
              checked={scope === "all"}
              onChange={() => onChangeScope("all")}
            />
            <span>All Shipping Methods</span>
          </label>
          <label className="radio-option-label">
            <input
              type="radio"
              name="shippingMethodScope"
              checked={scope === "specific"}
              onChange={() => onChangeScope("specific")}
            />
            <span>Specific Shipping Method</span>
          </label>
        </div>

        {scope === "specific" && (
          <s-stack gap="base">
            <div>
              <label className="form-group-label">Select Shipping Method</label>
              <select
                className="custom-select-field"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="">Select</option>
                {available.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <s-button
              variant="primary"
              onClick={handleAdd}
              className="custom-action-btn"
            >
              Add Shipping Method
            </s-button>

            {methods.length > 0 && (
              <div className="shipping-method-list">
                {methods.map((name) => (
                  <div key={name} className="shipping-method-chip">
                    <span>{name}</span>
                    <button
                      type="button"
                      className="shipping-method-chip__remove"
                      onClick={() => handleRemove(name)}
                      aria-label={`Remove ${name}`}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="form-group-subtext">
              The shipping method you want to apply the discount to must be
              selected, and a new one can be added.
            </p>
          </s-stack>
        )}
      </s-stack>
    </s-section>
  );
}
