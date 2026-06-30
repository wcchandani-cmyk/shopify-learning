import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { setMainContact } from "../../services/companyService";
import { getInputEventValue } from "../../utils/fieldEvent";
import { useChoiceList } from "../../hooks/useChoiceList";

export default function ChangeMainContactModal({
  open,
  shopify,
  company,
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
      await setMainContact(company.id, selectedId || null);
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

  const choiceListRef = useChoiceList(selectedId, (newVal) => setSelectedId(newVal));

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

        <s-choice-list
          ref={choiceListRef}
          name="main-contact"
          values={[selectedId]}
        >
          <s-choice value="">
            <s-text fontWeight="medium">None</s-text>
          </s-choice>
          {filteredContacts.map((contact) => (
            <s-choice key={contact.id} value={contact.id}>
              <s-stack gap="extra-tight">
                <s-text fontWeight="medium">
                  {contact.customer?.displayName ||
                    contact.customer?.email ||
                    "Customer"}
                </s-text>
                {contact.customer?.email ? (
                  <s-text color="subdued" size="small">
                    {contact.customer.email}
                  </s-text>
                ) : null}
              </s-stack>
            </s-choice>
          ))}
        </s-choice-list>
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
