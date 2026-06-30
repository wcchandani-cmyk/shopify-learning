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

  // Filter records by active tab using the type field
  const visibleRecords = records.filter((r) => {
    if (activeTab === "All") return true;
    const meta = TYPE_META[r.type];
    return meta && meta.tab === activeTab;
  });

  return (
    <s-page heading="Checkout Customization">
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={() => setShowCreationStep((v) => !v)}
      >
        Create Element
      </s-button>

      {showCreationStep && (
        <s-section>
          <div className="cc-creation-header">
            <div>
              <h2 className="cc-creation-title">Custom Field And Content</h2>
              <p className="cc-creation-subtitle">
                Showcase personalized fields and content to enhance the customer
                experience during checkout.
              </p>
            </div>
            <button
              className="cc-close-btn"
              onClick={() => setShowCreationStep(false)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="cc-cards-grid">
            {CREATION_CARDS.map((card) => (
              <div key={card.id} className="cc-card">
                <div className="cc-card-image-wrapper">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="cc-card-image"
                  />
                </div>
                <div className="cc-card-body">
                  <h3 className="cc-card-title">{card.title}</h3>
                  <p className="cc-card-desc">{card.description}</p>
                  <button
                    className="cc-create-btn"
                    onClick={() => card.path && navigate(card.path)}
                    disabled={!card.path}
                    title={!card.path ? "Coming soon" : undefined}
                  >
                    Create
                  </button>
                </div>
              </div>
            ))}
          </div>
        </s-section>
      )}

      {!showCreationStep && (
        <s-section>
          {error && (
            <s-banner tone="critical" heading="Could not load elements">
              <p>{error}</p>
            </s-banner>
          )}

          {loading ? (
            <PageLoader />
          ) : (
            <s-card>
              <div className="cc-table-wrapper">
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th>Element Name</th>
                      <th>Block Type</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRecords.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="cc-empty-row">
                          <span className="cc-empty-text">
                            No elements created yet.
                          </span>
                          <br />
                          <span className="cc-empty-subtext">
                            Click "Create Element" to get started.
                          </span>
                        </td>
                      </tr>
                    ) : (
                      visibleRecords.map((record) => {
                        const meta = TYPE_META[record.type] || {
                          label: record.type,
                          editPath: "/checkout-customization",
                        };
                        return (
                          <tr key={record.id}>
                            <td>
                              <strong>{record.internalName}</strong>
                            </td>
                            <td>
                              <span className="cc-block-type-badge">
                                {meta.label}
                              </span>
                            </td>
                            <td>
                              <s-badge
                                tone={record.isActive ? "success" : "warning"}
                              >
                                {record.isActive ? "Active" : "Inactive"}
                              </s-badge>
                            </td>
                            <td>
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
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </s-card>
          )}
        </s-section>
      )}
    </s-page>
  );
}
