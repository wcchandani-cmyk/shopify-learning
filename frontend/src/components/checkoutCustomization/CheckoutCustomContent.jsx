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
        const { customization: cc } = await getCheckoutCustomization(id);
        if (cc) {
          setForm({
            internalName: cc.internalName || "",
            blockVisibility: cc.blockVisibility || "Dynamic",
            displayRule: cc.displayRule || "all",
            displayConditions: parseDisplayConditions(cc.displayConditions),
            heading: cc.heading || "",
            contents: parseJson(cc.contents).map((c) => ({
              ...makeContent(c.type),
              ...c,
              _id: generateId(),
            })),
            isActive: Boolean(cc.isActive),
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
  const addContent = (type) =>
    setForm((p) => ({ ...p, contents: [...p.contents, makeContent(type)] }));
  const updateContent = (i, updated) =>
    setForm((p) => {
      const c = [...p.contents];
      c[i] = updated;
      return { ...p, contents: c };
    });
  const removeContent = (i) =>
    setForm((p) => ({
      ...p,
      contents: p.contents.filter((_, idx) => idx !== i),
    }));
  const toggleCollapse = (i) =>
    setCollapsed((prev) => ({ ...prev, [i]: !prev[i] }));

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
        contents: form.contents.map(({ _id, ...r }) => r),
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
          radioName="cc-displayRule"
        />

        <s-section heading="Contents">
          <s-stack gap="base">
            <s-text-field
              label="Heading (optional)"
              value={form.heading}
              onInput={(e) => setF("heading", e.target.value)}
            />

            {form.contents.length > 0 && (
              <div className="ccf-fields-list">
                {form.contents.map((item, i) => {
                  const typeDef =
                    CONTENT_TYPES.find((t) => t.id === item.type) ||
                    CONTENT_TYPES[0];
                  return (
                    <EditorShell
                      key={item._id}
                      icon={typeDef.icon}
                      label={typeDef.label}
                      collapsed={!!collapsed[i]}
                      onToggle={() => toggleCollapse(i)}
                      onRemove={() => removeContent(i)}
                    >
                      <ContentBody
                        item={item}
                        upd={(k, v) => updateContent(i, { ...item, [k]: v })}
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
