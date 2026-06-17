import "../../styles/CustomDiscountDetail.css";

export default function ShippingDiscountTypeSection({
  shippingDiscountType = "discount",
  onChange,
}) {
  return (
    <s-section heading="Discount Type">
      <s-stack gap="base">
        <div className="radio-options-stack">
          <label className="radio-option-label">
            <input
              type="radio"
              name="shippingDiscountType"
              checked={shippingDiscountType === "free_shipping"}
              onChange={() => onChange("free_shipping")}
            />
            <span>Free Shipping</span>
          </label>
          <label className="radio-option-label">
            <input
              type="radio"
              name="shippingDiscountType"
              checked={shippingDiscountType === "discount"}
              onChange={() => onChange("discount")}
            />
            <span>Discount</span>
          </label>
        </div>
      </s-stack>
    </s-section>
  );
}
