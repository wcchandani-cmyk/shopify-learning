import { useCallback, useEffect, useRef, useState } from "react";
import { updateCompanyDetails } from "../../services/companyService";
import { getInputEventValue } from "../../utils/fieldEvent";

export default function EditCompanyDetailsModal({
  open,
  shopify,
  company,
  onClose,
  onSaved,
}) {
  const modalRef = useRef(null);
  const [name, setName] = useState(company.name || "");
  const [externalId, setExternalId] = useState(company.externalId || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    if (open) modal.showOverlay?.();
    else modal.hideOverlay?.();
  }, [open]);

  // Reset the form to the latest company values each time the modal opens.
  useEffect(() => {
    if (open) {
      setName(company.name || "");
      setExternalId(company.externalId || "");
    }
  }, [open, company.name, company.externalId]);

  const trimmedName = name.trim();

  const handleSave = async () => {
    if (saving || !trimmedName) return;
    setSaving(true);
    try {
      await updateCompanyDetails(
        company.id,
        { name: trimmedName, externalId }
      );
      shopify.toast.show("Company details updated");
      onSaved();
      onClose();
    } catch (err) {
      shopify.toast.show(err.message || "Failed to update company details", {
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

  return (
    <s-modal
      id="edit-company-details-modal"
      ref={modalRef}
      heading="Edit company details"
      onAfterHide={handleAfterHide}
    >
      <s-stack gap="base" stretch>
        <s-text-field
          label="Company name"
          value={name}
          error={!trimmedName ? "Company name is required" : undefined}
          onInput={(e) => setName(getInputEventValue(e))}
        />
        <s-stack gap="small-100">
          <s-text-field
            label="Company ID"
            value={externalId}
            onInput={(e) => setExternalId(getInputEventValue(e))}
          />
          <s-text color="subdued" size="small">
            Updating company ID could affect apps and integrations. To prevent
            this, first update the company ID in any apps, then update it in
            Shopify.
          </s-text>
        </s-stack>
      </s-stack>

      <s-button
        slot="primary-action"
        variant="primary"
        onClick={handleSave}
        loading={saving || undefined}
        disabled={!trimmedName || undefined}
      >
        Save
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
