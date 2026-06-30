import { useChoiceList } from "../../hooks/useChoiceList";
import "../../styles/CustomDiscountDetail.css";

export default function ShippingDiscountTypeSection({
  shippingDiscountType = "discount",
  onChange,
}) {
  const choiceListRef = useChoiceList(shippingDiscountType, onChange);

  return (
    <s-section heading="Discount Type">
      <s-stack gap="base">
        <s-choice-list
          ref={choiceListRef}
          name="shippingDiscountType"
          values={[shippingDiscountType]}
        >
          <s-choice value="free_shipping">Free Shipping</s-choice>
          <s-choice value="discount">Discount</s-choice>
        </s-choice-list>
      </s-stack>
    </s-section>
  );
}
