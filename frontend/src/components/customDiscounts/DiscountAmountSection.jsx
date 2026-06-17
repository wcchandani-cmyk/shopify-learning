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
        <div className="side-by-side-row">
          <div>
            <label className="form-group-label" htmlFor="discount-value-input">
              Discount Value
            </label>
            <div className={`discount-value-input-wrapper ${isFixed ? "has-prefix" : "has-suffix"}`}>
              {isFixed && <span className="discount-value-icon prefix">$</span>}
              <input
                id="discount-value-input"
                type="number"
                className="discount-input-field"
                placeholder={isFixed ? "0.00" : "0"}
                value={discountValue}
                onChange={(e) => onChangeDiscountValue(e.target.value)}
              />
              {!isFixed && <span className="discount-value-icon suffix">%</span>}
            </div>
          </div>

          <div>
            <label className="form-group-label" htmlFor="discount-message-input">
              Discount Message
            </label>
            <input
              id="discount-message-input"
              type="text"
              className="discount-input-field"
              placeholder="e.g. Special Discount"
              value={discountMessage}
              onChange={(e) => onChangeDiscountMessage(e.target.value)}
            />
          </div>
        </div>
      </s-stack>
    </s-section>
  );
}
