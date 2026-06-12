import { getInputEventValue } from "../../utils/fieldEvent";

export default function MinimumRequirementsSection({ form, updateField }) {
  return (
    <s-section heading="Minimum purchase requirements">
      <div className="radio-group">
        <label className="radio-label">
          <input
            type="radio"
            name="minimumRequirementType"
            value="none"
            checked={form.minimumRequirementType === "none"}
            onChange={() => {
              updateField("minimumRequirementType", "none");
              updateField("minimumRequirementValue", "");
            }}
          />
          <span>No minimum requirements</span>
        </label>

        <label className="radio-label">
          <input
            type="radio"
            name="minimumRequirementType"
            value="amount"
            checked={form.minimumRequirementType === "amount"}
            onChange={() => updateField("minimumRequirementType", "amount")}
          />
          <span>Minimum purchase amount ($)</span>
        </label>
        {form.minimumRequirementType === "amount" && (
          <div className="radio-conditional-field">
            <s-number-field
              label="Minimum purchase amount"
              labelAccessibilityVisibility="exclusive"
              placeholder="0.00"
              min="0"
              value={form.minimumRequirementValue}
              onInput={(event) => updateField("minimumRequirementValue", getInputEventValue(event))}
            />
            <div style={{ fontSize: "12px", color: "#6d7175", marginTop: "4px" }}>
              Applies to all products.
            </div>
          </div>
        )}

        <label className="radio-label">
          <input
            type="radio"
            name="minimumRequirementType"
            value="quantity"
            checked={form.minimumRequirementType === "quantity"}
            onChange={() => updateField("minimumRequirementType", "quantity")}
          />
          <span>Minimum quantity of items</span>
        </label>
        {form.minimumRequirementType === "quantity" && (
          <div className="radio-conditional-field">
            <s-number-field
              label="Minimum quantity"
              labelAccessibilityVisibility="exclusive"
              placeholder="0"
              min="0"
              value={form.minimumRequirementValue}
              onInput={(event) => updateField("minimumRequirementValue", getInputEventValue(event))}
            />
            <div style={{ fontSize: "12px", color: "#6d7175", marginTop: "4px" }}>
              Applies to all products.
            </div>
          </div>
        )}
      </div>
    </s-section>
  );
}
