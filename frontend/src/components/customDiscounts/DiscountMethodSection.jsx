import React from "react";
import { useChoiceList } from "../../hooks/useChoiceList";
import "../../styles/CustomDiscountDetail.css";

export default function DiscountMethodSection({ method, onChangeMethod }) {
  const choiceListRef = useChoiceList(method, onChangeMethod);

  return (
    <s-section heading="Discount Method">
      <s-stack gap="base">
        <s-choice-list
          ref={choiceListRef}
          name="discountMethod"
          values={[method]}
        >
          <s-choice value="Automatic">Automatic Discount</s-choice>
          <s-choice value="Code">Discount Code</s-choice>
        </s-choice-list>
      </s-stack>
    </s-section>
  );
}
