import { useEffect, useRef } from "react";
import { getCheckboxChecked } from "../../utils/fieldEvent";

function useCheckedRef(checked) {
  const ref = useRef(null);

  useEffect(() => {
    const apply = () => {
      if (ref.current) ref.current.checked = Boolean(checked);
    };

    if (window.customElements?.get?.("s-checkbox")) {
      apply();
      return undefined;
    }

    if (window.customElements?.whenDefined) {
      let active = true;
      window.customElements.whenDefined("s-checkbox").then(() => {
        if (active) apply();
      });
      return () => {
        active = false;
      };
    }

    apply();
    return undefined;
  }, [checked]);

  return ref;
}

export default function CombinationsSection({ form, updateField, displayType }) {
  const productRef = useCheckedRef(form.combinesWithProduct);
  const orderRef = useCheckedRef(form.combinesWithOrder);

  const shippingChecked = (form.functionType === "2") ? false : form.combinesWithShipping;
  const shippingRef = useCheckedRef(shippingChecked);

  const useOtherPrefix = form.functionType === "1" || form.functionType === "2";

  const productLabel = useOtherPrefix ? "Other product discounts" : "Product discounts";
  const orderLabel = useOtherPrefix ? "Other order discounts" : "Order discounts";
  const shippingLabel = useOtherPrefix ? "Other shipping discounts" : "Shipping discounts";

  const productSummaryText = useOtherPrefix ? "other product discounts" : "product discounts";
  const orderSummaryText = useOtherPrefix ? "other order discounts" : "order discounts";
  const shippingSummaryText = useOtherPrefix ? "other shipping discounts" : "shipping discounts";

  const orderChecked = form.combinesWithOrder;
  const wonCombine = !form.combinesWithProduct && !orderChecked && !shippingChecked;

  return (
    <s-section heading="Combinations">
      <s-stack gap="small-200">
        <s-paragraph color="subdued">
          Select which other discount classes this discount can be combined with.
        </s-paragraph>
        <s-stack gap="tight">
          <s-checkbox
            ref={productRef}
            label={productLabel}
            checked={form.combinesWithProduct}
            onChange={(event) => updateField("combinesWithProduct", getCheckboxChecked(event))}
          />
          <s-checkbox
            ref={orderRef}
            label={orderLabel}
            checked={orderChecked}
            onChange={(event) => updateField("combinesWithOrder", getCheckboxChecked(event))}
          />
          {form.functionType !== "2" && (
            <s-checkbox
              ref={shippingRef}
              label={shippingLabel}
              checked={shippingChecked}
              onChange={(event) => updateField("combinesWithShipping", getCheckboxChecked(event))}
            />
          )}
        </s-stack>

        <s-box padding="tight" background="bg-surface-secondary" borderRadius="base">
          <s-text>
            <s-text type="strong">{form.title || displayType}</s-text>{" "}
            {wonCombine
              ? "won't combine with any other discount at checkout"
              : `will combine with ${[
                  form.combinesWithProduct && productSummaryText,
                  orderChecked && orderSummaryText,
                  shippingChecked && shippingSummaryText
                ].filter(Boolean).join(", ")} at checkout.`}
          </s-text>
        </s-box>
      </s-stack>
    </s-section>
  );
}
