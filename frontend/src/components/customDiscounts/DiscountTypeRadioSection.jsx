import React from "react";
import { useChoiceList } from "../../hooks/useChoiceList";
import "../../styles/CustomDiscountDetail.css";

export default function DiscountTypeRadioSection({
  discountType,
  onChangeDiscountType,
  applyToEachEntitledItem = false,
  onChangeApplyToEach,
}) {
  const choiceListRef = useChoiceList(discountType, onChangeDiscountType);

  return (
    <s-section heading="Discount Type">
      <s-stack gap="base">
        <s-choice-list
          ref={choiceListRef}
          name="discountValueType"
          values={[discountType]}
        >
          <s-choice value="percentage">Percentage</s-choice>
          <s-choice value="fixed_amount">Fixed Amount</s-choice>
        </s-choice-list>

        {discountType === "fixed_amount" && (
          <s-checkbox
            label="Apply the discount to each entitled item"
            checked={applyToEachEntitledItem || undefined}
            onClick={() =>
              onChangeApplyToEach && onChangeApplyToEach(!applyToEachEntitledItem)
            }
          />
        )}
      </s-stack>
    </s-section>
  );
}
