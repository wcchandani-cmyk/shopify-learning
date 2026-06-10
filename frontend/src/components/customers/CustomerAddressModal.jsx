import { useCallback, useEffect, useRef, useState } from "react";
import { EMPTY_ADDRESS } from "../../utils/customerForm";
import AddressFields from "./AddressFields";

const ADDRESS_MODAL_ID = "customer-address-modal";

export default function CustomerAddressModal({
  open,
  address,
  title = "Add default address",
  saving = false,
  onSave,
  onClose,
}) {
  const modalRef = useRef(null);
  const [draft, setDraft] = useState(EMPTY_ADDRESS);

  useEffect(() => {
    if (open) setDraft({ ...EMPTY_ADDRESS, ...(address || {}) });
  }, [open, address]);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    if (open) modal.showOverlay?.();
    else modal.hideOverlay?.();
  }, [open]);

  const patchDraft = useCallback((patch) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSave = useCallback(() => {
    onSave(draft);
  }, [draft, onSave]);

  const handleAfterHide = useCallback(
    (event) => {
      if (event.target === event.currentTarget) onClose();
    },
    [onClose]
  );

  return (
    <s-modal
      id={ADDRESS_MODAL_ID}
      ref={modalRef}
      heading={title}
      onAfterHide={handleAfterHide}
    >
      <AddressFields value={draft} onChange={patchDraft} />
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={handleSave}
        {...(saving ? { loading: true } : {})}
      >
        Save
      </s-button>
      <s-button slot="secondary-actions" onClick={onClose}>
        Cancel
      </s-button>
    </s-modal>
  );
}
