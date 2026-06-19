import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";
import { listCheckoutUpsells, deleteCheckoutUpsell } from "../../services/checkoutUpsellService";
import PageLoader from "../PageLoader";
import "../../styles/CheckoutUpsell.css";

const parseJsonField = (val) => {
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val || "[]"); } catch { return []; }
};

const getTriggerLabel = (rule) => {
  const type = rule.triggerType || "products";
  if (type === "collections") {
    const cols = parseJsonField(rule.triggerCollections);
    if (cols.length > 0) return cols.map((c) => c.title).join(", ");
    return rule.triggerProductTitle || "—";
  }
  const prods = parseJsonField(rule.triggerProducts);
  if (prods.length > 0) return prods.map((p) => p.title).join(", ");
  return rule.triggerProductTitle || "—";
};

export default function CheckoutUpsellList() {
  const navigate = useNavigate();
  const shopify = useAppBridge();

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [rules, setRules] = useState([]);
  const [search, setSearch] = useState("");

  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await shopify.idToken();
      const res = await listCheckoutUpsells(token);
      setRules(res.upsells || []);
    } catch (err) {
      setError(err.message || "Failed to load checkout upsells");
    } finally {
      setLoading(false);
    }
  }, [shopify]);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const filteredRules = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rules;
    return rules.filter((r) => {
      const label = getTriggerLabel(r).toLowerCase();
      return (
        String(r.title || "").toLowerCase().includes(q) ||
        label.includes(q) ||
        String(r.upsellProductTitle || "").toLowerCase().includes(q)
      );
    });
  }, [rules, search]);

  const handleDelete = useCallback(async (id) => {
    if (deleting) return;
    if (!window.confirm("Delete this upsell rule?")) return;
    setDeleting(true);
    try {
      const token = await shopify.idToken();
      await deleteCheckoutUpsell(id, token);
      shopify.toast.show("Upsell rule deleted");
      fetchRules();
    } catch (err) {
      shopify.toast.show(err.message || "Could not delete upsell rule", { isError: true });
    } finally {
      setDeleting(false);
    }
  }, [deleting, shopify, fetchRules]);

  return (
    <s-page heading="Checkout Upsell">
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={() => navigate("/checkout-upsells/new")}
      >
        Add upsell rule
      </s-button>

      {error && (
        <s-section>
          <s-banner tone="critical" heading="Could not load upsell rules">
            <p>{error}</p>
          </s-banner>
        </s-section>
      )}

      {loading ? (
        <PageLoader />
      ) : rules.length === 0 ? (
        <s-section>
          <div className="cu-empty-state">
            <s-icon type="gift-card" color="subdued" size="large" />
            <p className="cu-empty-text">
              Increase your average order value by offering complimentary products at checkout.
            </p>
            <s-button variant="primary" onClick={() => navigate("/checkout-upsells/new")}>
              Create your first rule
            </s-button>
          </div>
        </s-section>
      ) : (
        <s-section>
          <s-card>
            <div className="cu-search-wrapper">
              <input
                type="text"
                placeholder="Search campaigns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="discount-input-field"
                style={{ width: "100%" }}
              />
            </div>
            <div className="cu-list">
              {filteredRules.map((rule) => (
                <div key={rule.id} className="cu-card">
                  <div className="cu-card-info">
                    <div className="cu-card-title-row">
                      <span className="cu-card-title">{rule.title}</span>
                      <s-badge tone={rule.isActive ? "success" : "warning"}>
                        {rule.isActive ? "Active" : "Draft"}
                      </s-badge>
                    </div>
                    <div className="cu-card-details">
                      <div className="cu-detail-col">
                        <span className="cu-detail-label">Trigger</span>
                        <span className="cu-detail-value">
                          {rule.triggerType === "collections" ? "Collections: " : "Products: "}
                          <strong>{getTriggerLabel(rule)}</strong>
                        </span>
                      </div>
                      <div className="cu-detail-arrow">→</div>
                      <div className="cu-detail-col">
                        <span className="cu-detail-label">Offer</span>
                        <span className="cu-detail-value">
                          <strong>{rule.upsellProductTitle || "—"}</strong>
                        </span>
                      </div>
                      <div className="cu-detail-col">
                        <span className="cu-detail-label">Discount</span>
                        <span className="cu-discount-badge">{rule.discountPercentage}% off</span>
                      </div>
                    </div>
                  </div>
                  <div className="cu-card-actions">
                    <s-button variant="secondary" onClick={() => navigate(`/checkout-upsells/${rule.id}`)}>
                      Edit
                    </s-button>
                    <s-button variant="critical" onClick={() => handleDelete(rule.id)}>
                      Delete
                    </s-button>
                  </div>
                </div>
              ))}
            </div>
          </s-card>
        </s-section>
      )}
    </s-page>
  );
}
