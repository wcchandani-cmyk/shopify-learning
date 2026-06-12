import { getInputEventValue, getCheckboxChecked } from "../../utils/fieldEvent";

export default function MaximumUsesSection({ form, updateField }) {
  return (
    <s-section heading="Maximum discount uses">
      <div className="checkbox-group tight-gap">
        <s-checkbox
          label="Limit number of times each code can be used in total"
          checked={form.limitTotalUses}
          onChange={(event) => {
            const checked = getCheckboxChecked(event);
            updateField("limitTotalUses", checked);
            if (!checked) updateField("limitTotalUsesValue", "");
          }}
        />
        {form.limitTotalUses && (
          <div className="checkbox-conditional-field" style={{ marginTop: "8px" }}>
            <s-number-field
              label="Total usage limit"
              labelAccessibilityVisibility="exclusive"
              placeholder="e.g. 100"
              min="1"
              value={form.limitTotalUsesValue}
              onInput={(event) => updateField("limitTotalUsesValue", getInputEventValue(event))}
            />
          </div>
        )}

        <s-checkbox
          label="Limit to one use per customer"
          checked={form.limitOnePerCustomer}
          onChange={(event) => updateField("limitOnePerCustomer", getCheckboxChecked(event))}
        />
      </div>
    </s-section>
  );
}
