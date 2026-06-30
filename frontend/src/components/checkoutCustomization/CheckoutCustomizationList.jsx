import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  listCheckoutCustomizations,
  deleteCheckoutCustomization,
} from "../../services/checkoutCustomizationService";
import PageLoader from "../shared/PageLoader";
import "../../styles/CheckoutCustomization.css";
import {
  TYPE_META,
  CREATION_CARDS,
} from "../../constants/checkoutConstants";

export default function CheckoutCustomizationList() {
  const navigate = useNavigate();
  const shopify = useAppBridge();

  const activeTab = "All";
  const [showCreationStep, setShowCreationStep] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listCheckoutCustomizations();
      setRecords(res.customizations || []);
    } catch (err) {
      setError(err.message || "Failed to load checkout customizations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleDelete = useCallback(
    async (id) => {
      if (deleting) return;
      if (!window.confirm("Delete this element?")) return;
      setDeleting(true);
      try {
        await deleteCheckoutCustomization(id);
        shopify.toast.show("Element deleted");
        fetchRecords();
      } catch (err) {
        shopify.toast.show(err.message || "Could not delete element", {
          isError: true,
        });
      } finally {
        setDeleting(false);
      }
    },
    [deleting, shopify, fetchRecords]
  );

  const visibleRecords = records.filter((record) => {
    if (activeTab === "All") return true;
    const meta = TYPE_META[record.type];
    return meta && meta.tab === activeTab;
  });

  return (
    <s-page heading="Checkout Customization">
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={() => setShowCreationStep((prevVal) => !prevVal)}
      >
        Create Element
      </s-button>

      {showCreationStep && (
        <s-section>
          <s-stack gap="base">
            <s-stack direction="inline" alignItems="start" gap="base">
              <s-box grow="1">
                <s-stack gap="tight">
                  <s-heading>Custom Field And Content</s-heading>
                  <s-paragraph>
                    Showcase personalized fields and content to enhance the
                    customer experience during checkout.
                  </s-paragraph>
                </s-stack>
              </s-box>
              <s-button
                variant="tertiary"
                icon="x"
                accessibilityLabel="Close"
                onClick={() => setShowCreationStep(false)}
              />
            </s-stack>

            <div className="cc-cards-grid">
              {CREATION_CARDS.map((card) => (
                <div key={card.id} className="cc-card">
                  <div className="cc-card-image-wrapper">
                    <s-image
                      src={card.image}
                      alt={card.title}
                      objectFit="cover"
                    />
                  </div>
                  <div className="cc-card-body">
                    <s-text type="strong">{card.title}</s-text>
                    <s-paragraph>{card.description}</s-paragraph>
                    <s-button
                      variant="primary"
                      disabled={!card.path || undefined}
                      onClick={() => card.path && navigate(card.path)}
                    >
                      Create
                    </s-button>
                  </div>
                </div>
              ))}
            </div>
          </s-stack>
        </s-section>
      )}

      {!showCreationStep && (
        <s-section>
          {error && (
            <s-banner tone="critical" heading="Could not load elements">
              <s-text>{error}</s-text>
            </s-banner>
          )}

          {loading ? (
            <PageLoader />
          ) : (
            <s-card>
              <s-table variant="auto">
                <s-table-header-row>
                  <s-table-header style={{ padding: "16px 20px" }}>Element Name</s-table-header>
                  <s-table-header style={{ padding: "16px 20px" }}>Block Type</s-table-header>
                  <s-table-header style={{ padding: "16px 20px" }}>Status</s-table-header>
                  <s-table-header style={{ padding: "16px 20px" }}>Action</s-table-header>
                </s-table-header-row>
                <s-table-body>
                  {visibleRecords.length === 0 ? (
                    <s-table-row>
                      <s-table-cell colSpan={4} style={{ padding: "32px 20px" }}>
                        <s-stack alignItems="center" gap="tight">
                          <s-text>No elements created yet.</s-text>
                          <s-text tone="subdued">
                            Click "Create Element" to get started.
                          </s-text>
                        </s-stack>
                      </s-table-cell>
                    </s-table-row>
                  ) : (
                    visibleRecords.map((record) => {
                      const meta = TYPE_META[record.type] || {
                        label: record.type,
                        editPath: "/checkout-customization",
                      };
                      return (
                        <s-table-row key={record.id}>
                          <s-table-cell style={{ padding: "16px 20px", verticalAlign: "middle" }}>
                            <s-text type="strong">{record.internalName}</s-text>
                          </s-table-cell>
                          <s-table-cell style={{ padding: "16px 20px", verticalAlign: "middle" }}>
                            <s-badge>{meta.label}</s-badge>
                          </s-table-cell>
                          <s-table-cell style={{ padding: "16px 20px", verticalAlign: "middle" }}>
                            <s-badge
                              tone={record.isActive ? "success" : "warning"}
                            >
                              {record.isActive ? "Active" : "Inactive"}
                            </s-badge>
                          </s-table-cell>
                          <s-table-cell style={{ padding: "16px 20px", verticalAlign: "middle" }}>
                            <div className="cc-row-actions">
                              <s-button
                                variant="secondary"
                                onClick={() =>
                                  navigate(`${meta.editPath}/${record.id}`)
                                }
                              >
                                Edit
                              </s-button>
                              <s-button
                                variant="critical"
                                onClick={() => handleDelete(record.id)}
                              >
                                Delete
                              </s-button>
                            </div>
                          </s-table-cell>
                        </s-table-row>
                      );
                    })
                  )}
                </s-table-body>
              </s-table>
            </s-card>
          )}
        </s-section>
      )}
    </s-page>
  );
}
