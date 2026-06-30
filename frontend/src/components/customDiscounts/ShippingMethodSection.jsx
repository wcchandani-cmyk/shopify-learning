import { useState } from "react";
import "../../styles/CustomDiscountDetail.css";
import { SHIPPING_METHOD_OPTIONS } from "../../constants/customDiscounts";
import { useChoiceList } from "../../hooks/useChoiceList";

export default function ShippingMethodSection({
  scope = "all",
  onChangeScope,
  methods = [],
  onChangeMethods,
}) {
  const [selected, setSelected] = useState("");
  const choiceListRef = useChoiceList(scope, onChangeScope);

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
        <s-choice-list
          ref={choiceListRef}
          name="shippingMethodScope"
          values={[scope]}
        >
          <s-choice value="all">All Shipping Methods</s-choice>
          <s-choice value="specific">Specific Shipping Method</s-choice>
        </s-choice-list>

        {scope === "specific" && (
          <s-stack gap="base">
            <s-select
              label="Select Shipping Method"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <s-option value="">Select</s-option>
              {available.map((option) => (
                <s-option key={option} value={option}>
                  {option}
                </s-option>
              ))}
            </s-select>

            <div>
              <s-button variant="primary" onClick={handleAdd}>
                Add Shipping Method
              </s-button>
            </div>

            {methods.length > 0 && (
              <s-stack direction="inline" gap="tight" wrap>
                {methods.map((name) => (
                  <s-clickable-chip
                    key={name}
                    removable
                    accessibilityLabel={name}
                    onRemove={() => handleRemove(name)}
                  >
                    {name}
                  </s-clickable-chip>
                ))}
              </s-stack>
            )}

            <s-text tone="subdued">
              The shipping method you want to apply the discount to must be
              selected, and a new one can be added.
            </s-text>
          </s-stack>
        )}
      </s-stack>
    </s-section>
  );
}
