import React from "react";
import "../../styles/CustomDiscountDetail.css";

export default function DiscountAmountSection({
  discountType,
  discountValue,
  onChangeDiscountValue,
  discountMessage,
  onChangeDiscountMessage,
}) {
  const isFixed = discountType === "fixed_amount";

  return (
    <s-section heading="Discount Amount">
      <s-stack gap="base">
        <s-grid gridTemplateColumns="1fr 1fr" gap="base">
          <s-text-field
            label="Discount Value"
            type="number"
            placeholder={isFixed ? "0.00" : "0"}
            prefix={isFixed ? "$" : undefined}
            suffix={!isFixed ? "%" : undefined}
            value={discountValue}
            onInput={(e) => onChangeDiscountValue(e.target.value)}
          />
          <s-text-field
            label="Discount Message"
            placeholder="e.g. Special Discount"
            value={discountMessage}
            onInput={(e) => onChangeDiscountMessage(e.target.value)}
          />
        </s-grid>
      </s-stack>
    </s-section>
  );
}
