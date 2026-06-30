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
        const { customization: customizationData } = await getCheckoutCustomization(id);
        if (customizationData) {
          setForm({
            internalName: customizationData.internalName || "",
            blockVisibility: customizationData.blockVisibility || "Dynamic",
            displayRule: customizationData.displayRule || "all",
            displayConditions: parseDisplayConditions(customizationData.displayConditions),
            orderFieldSetting: customizationData.orderFieldSetting || "order_metafield",
            heading: customizationData.heading || "",
            subheading: customizationData.subheading || "",
            fields: parseJson(customizationData.fields).map((field) => ({
              ...makeField(field.type),
              ...field,
              _id: generateId(),
            })),
            isActive: Boolean(customizationData.isActive),
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

  const setF = (key, val) => setForm((prevForm) => ({ ...prevForm, [key]: val }));


  const addField = (type) =>
    setForm((prevForm) => ({ ...prevForm, fields: [...prevForm.fields, makeField(type)] }));
  const updateField = (index, updated) =>
    setForm((prevForm) => {
      const fieldsCopy = [...prevForm.fields];
      fieldsCopy[index] = updated;
      return { ...prevForm, fields: fieldsCopy };
    });
  const removeField = (index) =>
    setForm((prevForm) => ({ ...prevForm, fields: prevForm.fields.filter((_, idx) => idx !== index) }));
  const toggleCollapse = (index) =>
    setCollapsed((prev) => ({ ...prev, [index]: !prev[index] }));

  const handleSave = useCallback(async () => {
    if (!form.internalName.trim()) {
      shopify.toast.show("Please enter an internal name", { isError: true });
      return;
    }
    for (let index = 0; index < form.fields.length; index++) {
      const field = form.fields[index];
      if (!field.label.trim()) {
        shopify.toast.show(`Field ${index + 1}: label is required`, {
          isError: true,
        });
        return;
      }
      if (!field.key.trim()) {
        shopify.toast.show(`Field ${index + 1}: key is required`, {
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
        fields: form.fields.map(({ _id, ...restField }) => restField),
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

  return (
    <s-page heading={isEdit ? "Edit Custom Field" : "Create Custom Field"}>
      <s-link
        slot="breadcrumb-actions"
        href="/checkout-customization"
        onClick={(event) => {
          event.preventDefault();
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
          onInternalNameChange={(val) => setF("internalName", val)}
          blockVisibility={form.blockVisibility}
          onBlockVisibilityChange={(val) => setF("blockVisibility", val)}
          displayRule={form.displayRule}
          onDisplayRuleChange={(val) => setF("displayRule", val)}
          displayConditions={form.displayConditions}
          onDisplayConditionsChange={(val) => setF("displayConditions", val)}
          radioName="cf-displayRule"
        />

        <s-section heading="Order Field Setting">
          <s-stack gap="base">
            <div>
              <s-box padding-block-end="tight">
                <s-text tone="subdued">Save order fields as</s-text>
              </s-box>
              <s-choice-list
                ref={orderFieldRef}
                name="cf-orderField"
                values={[form.orderFieldSetting]}
              >
                <s-choice value="order_metafield">Order metafield</s-choice>
                <s-choice value="cart_attribute">Cart attribute</s-choice>
                <s-choice value="cart_note">Cart note</s-choice>
              </s-choice-list>
              <s-box padding-block-start="tight">
                <s-text tone="subdued">
                  We suggest saving custom field data under the Meta field
                  namespace of AddUpCheckoutCustomization.
                </s-text>
              </s-box>
            </div>
          </s-stack>
        </s-section>

        <s-section heading="Block Heading &amp; Subheading">
          <s-stack gap="base">
            <s-box padding-block-end="tight">
              <s-text tone="subdued">
                Adding a heading and subheading is highly recommended
              </s-text>
            </s-box>
            <s-text-field
              label="Heading (optional)"
              value={form.heading}
              onInput={(event) => setF("heading", event.target.value)}
            />
            <s-text-field
              label="Subheading (optional)"
              value={form.subheading}
              onInput={(event) => setF("subheading", event.target.value)}
            />
          </s-stack>
        </s-section>

        <s-section heading="Add Field">
          <s-stack gap="base">
            <s-box padding-block-end="tight">
              <s-text tone="subdued">
                We recommend adding these fields only when they serve as a new
                section in the checkout process.
              </s-text>
            </s-box>
            {form.fields.length > 0 && (
              <div className="ccf-fields-list">
                {form.fields.map((field, index) => {
                  const typeDef =
                    FIELD_TYPES.find((typeItem) => typeItem.id === field.type) ||
                    FIELD_TYPES[0];
                  return (
                    <EditorShell
                      key={field._id}
                      icon={typeDef.icon}
                      label={typeDef.label}
                      collapsed={!!collapsed[index]}
                      onToggle={() => toggleCollapse(index)}
                      onRemove={() => removeField(index)}
                    >
                      <FieldBody
                        field={field}
                        upd={(key, val) => updateField(index, { ...field, [key]: val })}
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
              <s-box padding-block-start="tight">
                <s-text tone="subdued">
                  Create and add fields based on your specific requirements.
                </s-text>
              </s-box>
            </div>
          </s-stack>
        </s-section>
      </s-stack>
    </s-page>
  );
}
