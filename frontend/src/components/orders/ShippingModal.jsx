import { useCallback, useEffect, useState } from "react";
import { getInputEventValue, clearDefaultZeroProps } from "../../utils/fieldEvent";
import { useOverlayModal } from "../../hooks/useOverlayModal";

const SHIPPING_MODAL_ID = "order-shipping-modal";

export default function ShippingModal({ open, onClose, onApply, onRemove, current }) {
  const { modalRef, onAfterHide } = useOverlayModal(open, onClose);
  const [title, setTitle] = useState("Standard");
  const [amount, setAmount] = useState("0.00");

  useEffect(() => {
    if (open) {
      setTitle(current?.title || "Standard");
      setAmount(current?.amount != null ? String(current.amount) : "0.00");
    }
  }, [open, current]);

  const handleApply = useCallback(() => {
    const numeric = parseFloat(amount) || 0;
    onApply({ title: title.trim() || "Shipping", amount: numeric });
    onClose();
  }, [title, amount, onApply, onClose]);

  return (
    <s-modal
      id={SHIPPING_MODAL_ID}
      ref={modalRef}
      heading="Add shipping or delivery"
      onAfterHide={onAfterHide}
    >
      <s-grid gap="base" gridTemplateColumns="2fr 1fr">
        <s-text-field
          label="Rate name"
          placeholder="e.g. Standard, Express"
          value={title}
          onInput={(e) => setTitle(getInputEventValue(e))}
        />
        <s-text-field
          label="Price"
          type="number"
          prefix="$"
          value={amount}
          onInput={(e) => setAmount(getInputEventValue(e))}
          {...clearDefaultZeroProps(amount, setAmount, "0.00")}
        />
      </s-grid>

      <s-button slot="primary-action" variant="primary" onClick={handleApply}>
        Apply
      </s-button>
      {current ? (
        <s-button
          slot="secondary-actions"
          variant="tertiary"
          tone="critical"
          onClick={() => {
            onRemove();
            onClose();
          }}
        >
          Remove shipping
        </s-button>
      ) : null}
      <s-button slot="secondary-actions" variant="tertiary" onClick={onClose}>
        Cancel
      </s-button>
    </s-modal>
  );
}
