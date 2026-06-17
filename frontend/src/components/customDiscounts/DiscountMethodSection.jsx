import React from "react";
import "../../styles/CustomDiscountDetail.css";

export default function DiscountMethodSection({ method, onChangeMethod }) {
  return (
    <s-section heading="Discount Method">
      <s-stack gap="base">
        <div className="radio-options-stack">
          <label className="radio-option-label">
            <input
              type="radio"
              name="discountMethod"
              checked={method === "Automatic"}
              onChange={() => onChangeMethod("Automatic")}
            />
            <span>Automatic Discount</span>
          </label>
          <label className="radio-option-label">
            <input
              type="radio"
              name="discountMethod"
              checked={method === "Code"}
              onChange={() => onChangeMethod("Code")}
            />
            <span>Discount Code</span>
          </label>
        </div>
      </s-stack>
    </s-section>
  );
}
