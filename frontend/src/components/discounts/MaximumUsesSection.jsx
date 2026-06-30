import { getInputEventValue, getCheckboxChecked } from "../../utils/fieldEvent";

export default function MaximumUsesSection({
  form,
  updateField,
  plain = false,
  title = "Maximum discount uses",
  limitTotalLabel = "Limit number of times each code can be used in total",
}) {
  const content = (
    <s-stack gap="tight">
      <s-checkbox
        label={limitTotalLabel}
        checked={form.limitTotalUses}
        onChange={(event) => {
          const checked = getCheckboxChecked(event);
          updateField("limitTotalUses", checked);
          if (!checked) updateField("limitTotalUsesValue", "");
        }}
      />
      {form.limitTotalUses && (
        <s-box padding-inline-start="700">
          <s-number-field
            label="Total usage limit"
            labelAccessibilityVisibility="exclusive"
            placeholder="e.g. 100"
            min="1"
            value={form.limitTotalUsesValue}
            onInput={(event) => updateField("limitTotalUsesValue", getInputEventValue(event))}
          />
        </s-box>
      )}

      <s-checkbox
        label="Limit to one use per customer"
        checked={form.limitOnePerCustomer}
        onChange={(event) => updateField("limitOnePerCustomer", getCheckboxChecked(event))}
      />
    </s-stack>
  );

  if (plain) {
    return (
      <s-stack gap="tight">
        <s-heading>{title}</s-heading>
        {content}
      </s-stack>
    );
  }

  return (
    <s-section heading={title}>
      {content}
    </s-section>
  );
}
