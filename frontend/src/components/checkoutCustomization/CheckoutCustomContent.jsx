import { useState, useEffect, useCallback } from "react";
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
import ContentBody from "./ContentBody";
import AddItemDropdown from "./AddItemDropdown";
import {
  CONTENT_TYPES,
  EMPTY_CONTENT_FORM,
} from "../../constants/checkoutConstants";
import {
  parseJson,
  makeContent,
  generateId,
  parseDisplayConditions,
} from "../../utils/checkoutCustomization";
import "../../styles/CheckoutCustomField.css";
import "../../styles/CustomDiscountDetail.css";

export default function CheckoutCustomContentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const shopify = useAppBridge();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_CONTENT_FORM);
  const [collapsed, setCollapsed] = useState({});

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
            heading: customizationData.heading || "",
            contents: parseJson(customizationData.contents).map((contentItem) => ({
              ...makeContent(contentItem.type),
              ...contentItem,
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
  const addContent = (type) =>
    setForm((prevForm) => ({ ...prevForm, contents: [...prevForm.contents, makeContent(type)] }));
  const updateContent = (index, updated) =>
    setForm((prevForm) => {
      const contentsCopy = [...prevForm.contents];
      contentsCopy[index] = updated;
      return { ...prevForm, contents: contentsCopy };
    });
  const removeContent = (index) =>
    setForm((prevForm) => ({
      ...prevForm,
      contents: prevForm.contents.filter((_, idx) => idx !== index),
    }));
  const toggleCollapse = (index) =>
    setCollapsed((prev) => ({ ...prev, [index]: !prev[index] }));

  const handleSave = useCallback(async () => {
    if (!form.internalName.trim()) {
      shopify.toast.show("Please enter an internal name", { isError: true });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        type: "custom_content",
        internalName: form.internalName.trim(),
        contents: form.contents.map(({ _id, ...restItem }) => restItem),
      };
      if (isEdit) {
        await updateCheckoutCustomization(id, payload);
        shopify.toast.show("Custom content updated");
      } else {
        await createCheckoutCustomization(payload);
        shopify.toast.show("Custom content created");
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
    <s-page heading={isEdit ? "Edit Custom Content" : "Create Custom Content"}>
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
          radioName="cc-displayRule"
        />

        <s-section heading="Contents">
          <s-stack gap="base">
            <s-text-field
              label="Heading (optional)"
              value={form.heading}
              onInput={(event) => setF("heading", event.target.value)}
            />

            {form.contents.length > 0 && (
              <div className="ccf-fields-list">
                {form.contents.map((item, index) => {
                  const typeDef =
                    CONTENT_TYPES.find((typeItem) => typeItem.id === item.type) ||
                    CONTENT_TYPES[0];
                  return (
                    <EditorShell
                      key={item._id}
                      icon={typeDef.icon}
                      label={typeDef.label}
                      collapsed={!!collapsed[index]}
                      onToggle={() => toggleCollapse(index)}
                      onRemove={() => removeContent(index)}
                    >
                      <ContentBody
                        item={item}
                        upd={(key, val) => updateContent(index, { ...item, [key]: val })}
                      />
                    </EditorShell>
                  );
                })}
              </div>
            )}

            <div>
              <AddItemDropdown
                items={CONTENT_TYPES}
                onAdd={addContent}
                label="Add Content"
                groupLabel="Contents"
              />
              <div className="form-group-subtext" style={{ marginTop: 8 }}>
                Create and add content based on your specific requirements.
              </div>
            </div>
          </s-stack>
        </s-section>
      </s-stack>
    </s-page>
  );
}
