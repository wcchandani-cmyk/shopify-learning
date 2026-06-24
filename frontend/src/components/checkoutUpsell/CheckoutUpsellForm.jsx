import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  createCheckoutUpsell,
  getCheckoutUpsell,
  updateCheckoutUpsell,
} from "../../services/checkoutUpsellService";
import PageLoader from "../shared/PageLoader";
import "../../styles/CheckoutUpsell.css";

const parseJsonField = (val) => {
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val || "[]"); } catch { return []; }
};

export default function CheckoutUpsellForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const shopify = useAppBridge();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    triggerType: "products",
    triggerProducts: [],
    triggerCollections: [],
    upsellProductId: "",
    upsellProductTitle: "",
    upsellProductImage: "",
    offerTitle: "",
    discountPercentage: 10,
    isActive: true,
  });

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const data = await getCheckoutUpsell(id);
        const u = data.upsell;
        if (u) {
          setForm({
            title: u.title || "",
            triggerType: u.triggerType || "products",
            triggerProducts: parseJsonField(u.triggerProducts),
            triggerCollections: parseJsonField(u.triggerCollections),
            upsellProductId: u.upsellProductId || "",
            upsellProductTitle: u.upsellProductTitle || "",
            upsellProductImage: u.upsellProductImage || "",
            offerTitle: u.offerTitle || "",
            discountPercentage: Number(u.discountPercentage) || 10,
            isActive: Boolean(u.isActive),
          });
        }
      } catch (err) {
        shopify.toast.show(err.message || "Failed to load campaign", { isError: true });
        navigate("/checkout-upsells");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit, shopify, navigate]);

  const pickTriggerItems = useCallback(async () => {
    const isProducts = form.triggerType === "products";
    try {
      const selection = await shopify.resourcePicker({
        type: isProducts ? "product" : "collection",
        multiple: true,
        selection: (isProducts ? form.triggerProducts : form.triggerCollections).map((x) => ({ id: x.id })),
      });
      if (selection) {
        const items = selection.map((x) => ({
          id: x.id,
          title: x.title,
          image: x.image?.src || x.image?.originalSrc || x.images?.[0]?.src || x.images?.[0]?.originalSrc || "",
        }));
        setForm((prev) => ({
          ...prev,
          [isProducts ? "triggerProducts" : "triggerCollections"]: items,
        }));
      }
    } catch (err) {
      console.error("Picker error:", err);
    }
  }, [shopify, form.triggerType, form.triggerProducts, form.triggerCollections]);

  const pickUpsellProduct = useCallback(async () => {
    try {
      const selection = await shopify.resourcePicker({ type: "product", multiple: false });
      if (selection && selection.length > 0) {
        const p = selection[0];
        setForm((prev) => ({
          ...prev,
          upsellProductId: p.id,
          upsellProductTitle: p.title,
          upsellProductImage: p.image?.src || p.image?.originalSrc || p.images?.[0]?.src || p.images?.[0]?.originalSrc || "",
        }));
      }
    } catch (err) {
      console.error("Upsell picker error:", err);
    }
  }, [shopify]);

  const removeItem = (key, itemId) => {
    setForm((prev) => ({ ...prev, [key]: prev[key].filter((x) => x.id !== itemId) }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      shopify.toast.show("Please enter a campaign name", { isError: true });
      return;
    }
    const triggerItems = form.triggerType === "products" ? form.triggerProducts : form.triggerCollections;
    if (triggerItems.length === 0) {
      shopify.toast.show(`Please select at least one ${form.triggerType === "products" ? "product" : "collection"}`, { isError: true });
      return;
    }
    if (!form.upsellProductId) {
      shopify.toast.show("Please select a complimentary product", { isError: true });
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit) {
        await updateCheckoutUpsell(id, form);
        shopify.toast.show("Campaign updated");
      } else {
        await createCheckoutUpsell(form);
        shopify.toast.show("Campaign created");
      }
      navigate("/checkout-upsells");
    } catch (err) {
      shopify.toast.show(err.message || "Failed to save campaign", { isError: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;

  const triggerItems = form.triggerType === "products" ? form.triggerProducts : form.triggerCollections;
  const triggerKey = form.triggerType === "products" ? "triggerProducts" : "triggerCollections";

  return (
    <s-page heading={isEdit ? "Edit Upsell Campaign" : "New Upsell Campaign"}>
      <s-link
        slot="breadcrumb-actions"
        onClick={(e) => { e.preventDefault(); navigate("/checkout-upsells"); }}
        href="/checkout-upsells"
      >
        Checkout Upsell
      </s-link>

      <s-button
        slot="primary-action"
        variant="primary"
        loading={submitting || undefined}
        onClick={handleSave}
      >
        {isEdit ? "Save changes" : "Create campaign"}
      </s-button>

      <div className="cu-form-layout">
        {/* ── Main column — single card ── */}
        <div className="cu-form-main">
          <s-section>
            {/* Campaign Name */}
            <div className="cu-form-row">
              <p className="cu-row-heading">Campaign Name</p>
              <s-text-field
                label="Campaign Name"
                label-hidden
                placeholder="e.g. Socks promo for Shoes buyers"
                value={form.title}
                onInput={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
              <p className="cu-help-text">For internal reference only. Customers won't see this.</p>
            </div>

            <div className="cu-divider" />

            {/* Trigger */}
            <div className="cu-form-row">
              <div className="cu-field-group">
                <label className="cu-label" htmlFor="trigger-type-select">Trigger by</label>
                <select
                  id="trigger-type-select"
                  className="custom-select-field"
                  value={form.triggerType}
                  onChange={(e) => setForm((p) => ({ ...p, triggerType: e.target.value }))}
                >
                  <option value="products">Specific Products</option>
                  <option value="collections">Specific Collections</option>
                </select>
                <p className="cu-help-text">
                  {form.triggerType === "products"
                    ? "Show the offer when any of these products are in the cart."
                    : "Show the offer when any product from these collections is in the cart."}
                </p>
              </div>
              <div className="cu-item-list" style={{ marginTop: 12 }}>
                {triggerItems.length > 0 ? (
                  triggerItems.map((item) => (
                    <div key={item.id} className="cu-item-row">
                      <div className="cu-item-thumb">
                        {item.image
                          ? <img src={item.image} alt={item.title} className="cu-thumb-img" />
                          : <span className="cu-thumb-fallback">{item.title.charAt(0).toUpperCase()}</span>
                        }
                      </div>
                      <span className="cu-item-name">{item.title}</span>
                      <button
                        type="button"
                        className="cu-tag-remove"
                        aria-label={`Remove ${item.title}`}
                        onClick={() => removeItem(triggerKey, item.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="cu-no-items">
                    No {form.triggerType === "products" ? "products" : "collections"} selected yet
                  </p>
                )}
                <div style={{ marginTop: triggerItems.length > 0 ? 8 : 0 }}>
                  <s-button variant="secondary" onClick={pickTriggerItems}>
                    Browse {form.triggerType === "products" ? "products" : "collections"}
                  </s-button>
                </div>
              </div>
            </div>

            <div className="cu-divider" />

            {/* Complimentary Product */}
            <div className="cu-form-row">
              <p className="cu-row-heading">Complimentary Product</p>
              <div className="cu-picker-row">
                {form.upsellProductId ? (
                  <div className="cu-item-row" style={{ flex: 1 }}>
                    <div className="cu-item-thumb">
                      {form.upsellProductImage
                        ? <img src={form.upsellProductImage} alt={form.upsellProductTitle} className="cu-thumb-img" />
                        : <span className="cu-thumb-fallback">{form.upsellProductTitle.charAt(0).toUpperCase()}</span>
                      }
                    </div>
                    <span className="cu-item-name">{form.upsellProductTitle}</span>
                  </div>
                ) : (
                  <span className="cu-picker-label">No product selected</span>
                )}
                <s-button variant="secondary" onClick={pickUpsellProduct}>
                  {form.upsellProductId ? "Change product" : "Browse products"}
                </s-button>
              </div>
              <p className="cu-help-text">The product offered at a discount at checkout.</p>
            </div>

            <div className="cu-divider" />

            {/* Offer Settings — headline + discount side by side */}
            <div className="cu-form-row">
              <p className="cu-row-heading">Offer Settings</p>
              <div className="cu-offer-row">
                <div className="cu-offer-headline">
                  <label className="cu-label" htmlFor="offer-title-input">Headline</label>
                  <input
                    id="offer-title-input"
                    type="text"
                    className="discount-input-field"
                    placeholder="e.g. Special offer — add matching socks!"
                    value={form.offerTitle}
                    onChange={(e) => setForm((p) => ({ ...p, offerTitle: e.target.value }))}
                  />
                  <p className="cu-help-text">Shown above the upsell widget at checkout.</p>
                </div>
                <div className="cu-offer-discount">
                  <label className="cu-label" htmlFor="discount-pct-input">Discount</label>
                  <div className="discount-value-input-wrapper has-suffix">
                    <input
                      id="discount-pct-input"
                      type="number"
                      className="discount-input-field"
                      min="0"
                      max="100"
                      value={form.discountPercentage}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          discountPercentage: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                        }))
                      }
                    />
                    <span className="discount-value-icon suffix">%</span>
                  </div>
                  <p className="cu-help-text">Applied to the complimentary product.</p>
                </div>
              </div>
            </div>
          </s-section>
        </div>

        {/* ── Sidebar ── */}
        <div className="cu-form-sidebar">
          <s-section heading="Status">
            <label className="checkbox-option-label">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              />
              <span>Campaign is active</span>
            </label>
            <p className="cu-help-text" style={{ marginTop: 8 }}>
              Inactive campaigns won't show at checkout.
            </p>
          </s-section>
        </div>
      </div>
    </s-page>
  );
}
