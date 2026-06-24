import { useCallback, useEffect, useRef, useState } from "react";
import { removeCompanyContact } from "../../services/companyService";

export default function RemoveCustomerModal({
  open,
  shopify,
  company,
  onClose,
  onSaved,
}) {
  const modalRef = useRef(null);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    if (open) modal.showOverlay?.();
    else modal.hideOverlay?.();
  }, [open]);

  const handleRemove = async (contact) => {
    if (removingId) return;
    setRemovingId(contact.id);
    try {
      await removeCompanyContact(contact.id);
      shopify.toast.show(
        `${contact.customer?.displayName || "Customer"} removed from ${company.name}`
      );
      onSaved();
      onClose();
    } catch (err) {
      shopify.toast.show(err.message || "Failed to remove customer", {
        isError: true,
      });
    } finally {
      setRemovingId(null);
    }
  };

  const handleAfterHide = useCallback(
    (event) => {
      if (event.target === event.currentTarget) onClose();
    },
    [onClose]
  );

  const contacts = company.contacts || [];

  return (
    <s-modal
      id="remove-customer-modal"
      ref={modalRef}
      heading="Remove customer"
      onAfterHide={handleAfterHide}
    >
      <s-stack gap="base" stretch>
        <s-paragraph>
          Removing a customer revokes their access to order on behalf of{" "}
          <strong>{company.name}</strong>.
        </s-paragraph>

        {contacts.length === 0 ? (
          <s-text color="subdued">No customers to remove.</s-text>
        ) : (
          <div style={{ border: "1px solid #e3e3e3", borderRadius: "8px" }}>
            {contacts.map((contact) => (
              <div
                key={contact.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  padding: "10px 12px",
                  borderBottom: "1px solid #f1f2f4",
                }}
              >
                <span style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "#303030" }}>
                    {contact.customer?.displayName ||
                      contact.customer?.email ||
                      "Customer"}
                  </span>
                  {contact.customer?.email ? (
                    <span style={{ fontSize: "13px", color: "#616161" }}>
                      {contact.customer.email}
                    </span>
                  ) : null}
                </span>
                <s-button
                  tone="critical"
                  variant="secondary"
                  onClick={() => handleRemove(contact)}
                  loading={removingId === contact.id || undefined}
                  disabled={(removingId && removingId !== contact.id) || undefined}
                >
                  Remove
                </s-button>
              </div>
            ))}
          </div>
        )}
      </s-stack>

      <s-button slot="secondary-actions" onClick={onClose}>
        Cancel
      </s-button>
    </s-modal>
  );
}
