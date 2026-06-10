import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { setMainContact } from "../../services/companyService";
import { getInputEventValue } from "../../utils/fieldEvent";

export default function ChangeMainContactModal({
  open,
  shopify,
  company,
  token,
  onClose,
  onSaved,
}) {
  const modalRef = useRef(null);
  const currentId = company.mainContactId || "";
  const [selectedId, setSelectedId] = useState(currentId);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    if (open) modal.showOverlay?.();
    else modal.hideOverlay?.();
  }, [open]);

  useEffect(() => {
    if (open) {
      setSelectedId(currentId);
      setSearch("");
    }
  }, [open, currentId]);

  const filteredContacts = useMemo(() => {
    const term = search.trim().toLowerCase();
    const contacts = company.contacts || [];
    if (!term) return contacts;
    return contacts.filter((contact) => {
      const name = (contact.customer?.displayName || "").toLowerCase();
      const email = (contact.customer?.email || "").toLowerCase();
      return name.includes(term) || email.includes(term);
    });
  }, [company.contacts, search]);

  const handleConfirm = async () => {
    if (saving || selectedId === currentId) return;
    setSaving(true);
    try {
      await setMainContact(company.id, selectedId || null, token);
      shopify.toast.show("Main contact updated");
      onSaved();
      onClose();
    } catch (err) {
      shopify.toast.show(err.message || "Failed to update main contact", {
        isError: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAfterHide = useCallback(
    (event) => {
      if (event.target === event.currentTarget) onClose();
    },
    [onClose]
  );

  const row = (id, label, sublabel) => (
    <label
      key={id || "none"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 4px",
        borderBottom: "1px solid #f1f2f4",
        cursor: "pointer",
      }}
    >
      <input
        type="radio"
        name="main-contact"
        value={id}
        checked={selectedId === id}
        onChange={() => setSelectedId(id)}
      />
      <span style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: "14px", fontWeight: 500, color: "#303030" }}>
          {label}
        </span>
        {sublabel ? (
          <span style={{ fontSize: "13px", color: "#616161" }}>{sublabel}</span>
        ) : null}
      </span>
    </label>
  );

  return (
    <s-modal
      id="change-main-contact-modal"
      ref={modalRef}
      heading="Change main contact"
      onAfterHide={handleAfterHide}
    >
      <s-stack gap="base" stretch>
        <s-text-field
          label="Search customers"
          labelAccessibilityVisibility="exclusive"
          icon="search"
          placeholder="Search customers"
          value={search}
          onInput={(e) => setSearch(getInputEventValue(e))}
        />

        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
          {row("", "None", null)}
          {filteredContacts.map((contact) =>
            row(
              contact.id,
              contact.customer?.displayName ||
                contact.customer?.email ||
                "Customer",
              contact.customer?.email
            )
          )}
        </div>
      </s-stack>

      <s-button
        slot="primary-action"
        variant="primary"
        onClick={handleConfirm}
        loading={saving || undefined}
        disabled={selectedId === currentId || undefined}
      >
        Confirm
      </s-button>
      <s-button
        slot="secondary-actions"
        onClick={onClose}
        disabled={saving || undefined}
      >
        Cancel
      </s-button>
    </s-modal>
  );
}
