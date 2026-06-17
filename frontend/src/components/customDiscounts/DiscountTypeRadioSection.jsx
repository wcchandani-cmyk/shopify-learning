import React from "react";
import "../../styles/CustomDiscountDetail.css";

export default function DiscountTypeRadioSection({
  discountType,
  onChangeDiscountType,
  applyToEachEntitledItem = false,
  onChangeApplyToEach,
}) {
  return (
    <s-section heading="Discount Type">
      <s-stack gap="base">
        <div className="radio-options-stack">
          <label className="radio-option-label">
            <input
              type="radio"
              name="discountValueType"
              checked={discountType === "percentage"}
              onChange={() => onChangeDiscountType("percentage")}
            />
            <span>Percentage</span>
          </label>
          <label className="radio-option-label">
            <input
              type="radio"
              name="discountValueType"
              checked={discountType === "fixed_amount"}
              onChange={() => onChangeDiscountType("fixed_amount")}
            />
            <span>Fixed Amount</span>
          </label>
        </div>

        {discountType === "fixed_amount" && (
          <div className="entitled-item-checkbox-container">
            <label className="checkbox-option-label">
              <input
                type="checkbox"
                checked={applyToEachEntitledItem}
                onChange={(e) => onChangeApplyToEach && onChangeApplyToEach(e.target.checked)}
              />
              <span>Apply the discount to each entitled item</span>
            </label>
          </div>
        )}
      </s-stack>
    </s-section>
  );
}
