import { useChoiceList } from "../../hooks/useChoiceList";
import { getInputEventValue } from "../../utils/fieldEvent";

export default function MinimumRequirementsSection({ form, updateField }) {
  const handleChoiceChange = (nextValue) => {
    updateField("minimumRequirementType", nextValue);
    if (nextValue === "none") {
      updateField("minimumRequirementValue", "");
    }
  };

  const choiceListRef = useChoiceList(form.minimumRequirementType, handleChoiceChange);

  return (
    <s-section heading="Minimum purchase requirements">
      <s-stack gap="base">
        <s-choice-list
          ref={choiceListRef}
          name="minimumRequirementType"
          values={[form.minimumRequirementType]}
        >
          <s-choice value="none">No minimum requirements</s-choice>
          <s-choice value="amount">Minimum purchase amount ($)</s-choice>
          <s-choice value="quantity">Minimum quantity of items</s-choice>
        </s-choice-list>

        {form.minimumRequirementType === "amount" && (
          <div className="radio-conditional-field" style={{ marginTop: "4px" }}>
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

        {form.minimumRequirementType === "quantity" && (
          <div className="radio-conditional-field" style={{ marginTop: "4px" }}>
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
      </s-stack>
    </s-section>
  );
}
