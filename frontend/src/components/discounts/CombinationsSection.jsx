import { useEffect, useRef } from "react";
import { getCheckboxChecked } from "../../utils/fieldEvent";

/**
 * Polaris `s-checkbox` treats `checked` as an HTML-style property: the attribute
 * maps to `defaultChecked`, and React may set the value before the web component
 * is upgraded, which silently drops it. Imperatively set the `checked` property
 * once the element is defined so saved values reliably render as checked.
 */
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
        <div className="checkbox-group tight-gap">
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
        </div>

        <div style={{ backgroundColor: "#f6f6f7", padding: "12px", borderRadius: "8px", border: "1px solid #e1e3e5", marginTop: "12px", fontSize: "13px" }}>
          <span style={{ fontWeight: 600 }}>{form.title || displayType}</span>{" "}
          {wonCombine
            ? "won't combine with any other discount at checkout"
            : `will combine with ${[
                form.combinesWithProduct && productSummaryText,
                orderChecked && orderSummaryText,
                shippingChecked && shippingSummaryText
              ].filter(Boolean).join(", ")} at checkout.`}
        </div>
      </s-stack>
    </s-section>
  );
}
