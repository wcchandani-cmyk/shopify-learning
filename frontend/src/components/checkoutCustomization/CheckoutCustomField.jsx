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
import EditorShell from "./EditorShell";
import FieldBody from "./FieldBody";
import AddItemDropdown from "./AddItemDropdown";
import {
  FIELD_TYPES,
  EMPTY_FIELD_FORM,
} from "../../constants/checkoutConstants";
import {
  parseJson,
  makeField,
  generateId,
  parseDisplayConditions,
} from "../../utils/checkoutCustomization";
import { useChoiceList } from "../../hooks/useChoiceList";
import "../../styles/CheckoutCustomField.css";
import "../../styles/CustomDiscountDetail.css";

export default function CheckoutCustomFieldForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const shopify = useAppBridge();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FIELD_FORM);
  const [collapsed, setCollapsed] = useState({});
  const orderFieldRef = useChoiceList(form.orderFieldSetting, (val) => setF("orderFieldSetting", val));

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const { customization: cf } = await getCheckoutCustomization(id);
        if (cf) {
          setForm({
            internalName: cf.internalName || "",
            blockVisibility: cf.blockVisibility || "Dynamic",
            displayRule: cf.displayRule || "all",
            displayConditions: parseDisplayConditions(cf.displayConditions),
            orderFieldSetting: cf.orderFieldSetting || "order_metafield",
            heading: cf.heading || "",
            subheading: cf.subheading || "",
            fields: parseJson(cf.fields).map((f) => ({
              ...makeField(f.type),
              ...f,
              _id: generateId(),
            })),
            isActive: Boolean(cf.isActive),
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


  const addField = (type) =>
    setForm((p) => ({ ...p, fields: [...p.fields, makeField(type)] }));
  const updateField = (i, updated) =>
    setForm((p) => {
      const f = [...p.fields];
      f[i] = updated;
      return { ...p, fields: f };
    });
  const removeField = (i) =>
    setForm((p) => ({ ...p, fields: p.fields.filter((_, idx) => idx !== i) }));
  const toggleCollapse = (i) =>
    setCollapsed((prev) => ({ ...prev, [i]: !prev[i] }));

  const handleSave = useCallback(async () => {
    if (!form.internalName.trim()) {
      shopify.toast.show("Please enter an internal name", { isError: true });
      return;
    }
    for (let i = 0; i < form.fields.length; i++) {
      const f = form.fields[i];
      if (!f.label.trim()) {
        shopify.toast.show(`Field ${i + 1}: label is required`, {
          isError: true,
        });
        return;
      }
      if (!f.key.trim()) {
        shopify.toast.show(`Field ${i + 1}: key is required`, {
          isError: true,
        });
        return;
      }
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        type: "custom_field",
        internalName: form.internalName.trim(),
        fields: form.fields.map(({ _id, ...r }) => r),
      };
      if (isEdit) {
        await updateCheckoutCustomization(id, payload);
        shopify.toast.show("Custom field updated");
      } else {
        await createCheckoutCustomization(payload);
        shopify.toast.show("Custom field created");
      }
      navigate("/checkout-customization");
    } catch (err) {
      shopify.toast.show(err.message || "Failed to save", { isError: true });
    } finally {
      setSubmitting(false);
    }
  }, [form, isEdit, id, shopify, navigate]);

  if (loading) return <PageLoader />;

  console.log("CheckoutCustomFieldForm render - form:", form);

  return (
    <s-page heading={isEdit ? "Edit Custom Field" : "Create Custom Field"}>
      <s-link
        slot="breadcrumb-actions"
        href="/checkout-customization"
        onClick={(e) => {
          e.preventDefault();
          navigate("/checkout-customization");
        }}
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
          onInternalNameChange={(v) => setF("internalName", v)}
          blockVisibility={form.blockVisibility}
          onBlockVisibilityChange={(v) => setF("blockVisibility", v)}
          displayRule={form.displayRule}
          onDisplayRuleChange={(v) => setF("displayRule", v)}
          displayConditions={form.displayConditions}
          onDisplayConditionsChange={(v) => setF("displayConditions", v)}
          radioName="cf-displayRule"
        />

        <s-section heading="Order Field Setting">
          <s-stack gap="base">
            <div>
              <div className="form-group-subtext" style={{ marginBottom: 12 }}>
                Save order fields as
              </div>
              <s-choice-list
                ref={orderFieldRef}
                name="cf-orderField"
                values={[form.orderFieldSetting]}
              >
                <s-choice value="order_metafield">Order metafield</s-choice>
                <s-choice value="cart_attribute">Cart attribute</s-choice>
                <s-choice value="cart_note">Cart note</s-choice>
              </s-choice-list>
              <div className="form-group-subtext" style={{ marginTop: 12 }}>
                We suggest saving custom field data under the Meta field
                namespace of AddUpCheckoutCustomization.
              </div>
            </div>
          </s-stack>
        </s-section>

        <s-section heading="Block Heading &amp; Subheading">
          <s-stack gap="base">
            <div className="form-group-subtext">
              Adding a heading and subheading is highly recommended
            </div>
            <s-text-field
              label="Heading (optional)"
              value={form.heading}
              onInput={(e) => setF("heading", e.target.value)}
            />
            <s-text-field
              label="Subheading (optional)"
              value={form.subheading}
              onInput={(e) => setF("subheading", e.target.value)}
            />
          </s-stack>
        </s-section>

        <s-section heading="Add Field">
          <s-stack gap="base">
            <div className="form-group-subtext">
              We recommend adding these fields only when they serve as a new
              section in the checkout process.
            </div>
            {form.fields.length > 0 && (
              <div className="ccf-fields-list">
                {form.fields.map((field, i) => {
                  const typeDef =
                    FIELD_TYPES.find((t) => t.id === field.type) ||
                    FIELD_TYPES[0];
                  return (
                    <EditorShell
                      key={field._id}
                      icon={typeDef.icon}
                      label={typeDef.label}
                      collapsed={!!collapsed[i]}
                      onToggle={() => toggleCollapse(i)}
                      onRemove={() => removeField(i)}
                    >
                      <FieldBody
                        field={field}
                        upd={(k, v) => updateField(i, { ...field, [k]: v })}
                        orderFieldSetting={form.orderFieldSetting}
                      />
                    </EditorShell>
                  );
                })}
              </div>
            )}
            <div>
              <AddItemDropdown
                items={FIELD_TYPES}
                onAdd={addField}
                label="Add Field"
                groupLabel="Fields"
              />
              <div className="form-group-subtext" style={{ marginTop: 8 }}>
                Create and add fields based on your specific requirements.
              </div>
            </div>
          </s-stack>
        </s-section>
      </s-stack>
    </s-page>
  );
}
