import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  createCheckoutCustomization,
  getCheckoutCustomization,
  updateCheckoutCustomization,
} from "../../services/checkoutCustomizationService";
import PageLoader from "../shared/PageLoader";
import CheckoutCommonHeader from "./CheckoutCommon";
import { EMPTY_LINE_ITEM_FORM } from "../../constants/checkoutConstants";
import "../../styles/CheckoutCustomField.css";
import "../../styles/CustomDiscountDetail.css";

export default function CheckoutLineItemActionsForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const shopify = useAppBridge();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_LINE_ITEM_FORM);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const data = await getCheckoutCustomization(id);
        const r = data.customization;
        if (r) {
          setForm({
            internalName: r.internalName || "",
            displayRule: r.displayRule || "all",
            displayConditions: r.displayConditions ? (typeof r.displayConditions === "string" ? JSON.parse(r.displayConditions) : r.displayConditions) : { combination: "all", conditions: [] },
            showActionsExpanded: Boolean(r.showActionsExpanded),
            subscriptionSelector: Boolean(r.subscriptionSelector),
            variantSelector: Boolean(r.variantSelector),
            quantity: Boolean(r.quantity),
            removeButton: Boolean(r.removeButton),
            isActive: Boolean(r.isActive),
          });
        }
      } catch (err) {
        shopify.toast.show(err.message || "Failed to load", { isError: true });
        navigate("/checkout-customization");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit, shopify, navigate]);

  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = useCallback(async () => {
    if (!form.internalName.trim()) {
      shopify.toast.show("Please enter an internal name", { isError: true });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        type: "line_item_actions",
        internalName: form.internalName.trim(),
        displayRule: form.displayRule,
        displayConditions: form.displayConditions,
        showActionsExpanded: form.showActionsExpanded,
        subscriptionSelector: form.subscriptionSelector,
        variantSelector: form.variantSelector,
        quantity: form.quantity,
        removeButton: form.removeButton,
        isActive: form.isActive,
      };
      if (isEdit) {
        await updateCheckoutCustomization(id, payload);
        shopify.toast.show("Line item actions updated");
      } else {
        await createCheckoutCustomization(payload);
        shopify.toast.show("Line item actions created");
      }
      navigate("/checkout-customization");
    } catch (err) {
      shopify.toast.show(err.message || "Failed to save", { isError: true });
    } finally {
      setSubmitting(false);
    }
  }, [form, isEdit, id, shopify, navigate]);

  if (loading) return <PageLoader />;

  return (
    <s-page
      heading={isEdit ? "Edit Line Item Actions" : "Create Line Item Actions"}
    >
      <s-link
        slot="breadcrumb-actions"
        onClick={(e) => {
          e.preventDefault();
          navigate("/checkout-customization");
        }}
        href="/checkout-customization"
      >
        Checkout Customization
      </s-link>
      <s-button
        slot="primary-action"
        variant="primary"
        loading={submitting || undefined}
        onClick={handleSave}
      >
        {isEdit ? "Save changes" : "Create"}
      </s-button>

      <s-stack gap="base">
        <CheckoutCommonHeader
          internalName={form.internalName}
          onInternalNameChange={(val) => setF("internalName", val)}
          displayRule={form.displayRule}
          onDisplayRuleChange={(v) => setF("displayRule", v)}
          displayConditions={form.displayConditions}
          onDisplayConditionsChange={(v) => setF("displayConditions", v)}
          radioName="lia-displayRule"
          subtext="Choose the visibility of your line item block based on your specific requirements."
        />

        <s-section heading="Additional Configuration">
          <s-stack gap="base">
            <s-stack gap="none">
              <s-checkbox
                label="Show actions expanded by default"
                checked={form.showActionsExpanded || undefined}
                onClick={() => setF("showActionsExpanded", !form.showActionsExpanded)}
              />
              <s-box padding-inline-start="700" padding-block-start="100">
                <s-text tone="subdued">
                  For most usage circumstances, we recommend leaving this disabled.
                </s-text>
              </s-box>
            </s-stack>

            <s-stack gap="none">
              <s-checkbox
                label="Subscription (selling plan) selector"
                checked={form.subscriptionSelector || undefined}
                onClick={() => setF("subscriptionSelector", !form.subscriptionSelector)}
              />
              <s-box padding-inline-start="700" padding-block-start="100">
                <s-text tone="subdued">
                  Customers have the flexibility to modify their subscription
                  frequency, which includes the option to downgrade to a one-time
                  purchase if applicable. This feature is only displayed when the
                  product offers a subscription.
                </s-text>
              </s-box>
            </s-stack>

            <s-stack gap="none">
              <s-checkbox
                label="Variant selector"
                checked={form.variantSelector || undefined}
                onClick={() => setF("variantSelector", !form.variantSelector)}
              />
              <s-box padding-inline-start="700" padding-block-start="100">
                <s-text tone="subdued">
                  Customers can easily switch to another available variant of the
                  product that is currently in stock.
                </s-text>
              </s-box>
            </s-stack>

            <s-stack gap="none">
              <s-checkbox
                label="Quantity"
                checked={form.quantity || undefined}
                onClick={() => setF("quantity", !form.quantity)}
              />
              <s-box padding-inline-start="700" padding-block-start="100">
                <s-text tone="subdued">
                  Customers have the flexibility to adjust the quantity of the
                  product according to their preferences.
                </s-text>
              </s-box>
            </s-stack>

            <s-stack gap="none">
              <s-checkbox
                label="Remove button"
                checked={form.removeButton || undefined}
                onClick={() => setF("removeButton", !form.removeButton)}
              />
              <s-box padding-inline-start="700" padding-block-start="100">
                <s-text tone="subdued">
                  Customers have the option to remove the product from their
                  shopping cart.
                </s-text>
              </s-box>
            </s-stack>
          </s-stack>
        </s-section>
      </s-stack>
    </s-page>
  );
}
