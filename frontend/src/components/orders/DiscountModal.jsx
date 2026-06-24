import { useCallback, useEffect, useState } from "react";
import { getInputEventValue, clearDefaultZeroProps } from "../../utils/fieldEvent";
import { useOverlayModal } from "../../hooks/useOverlayModal";

const DISCOUNT_MODAL_ID = "order-discount-modal";

export default function DiscountModal({ open, onClose, onApply, onRemove, current }) {
  const { modalRef, onAfterHide } = useOverlayModal(open, onClose);
  const [type, setType] = useState("fixed_amount");
  const [value, setValue] = useState("0");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setType(current?.type || "fixed_amount");
      setValue(current?.value != null ? String(current.value) : "0");
      setReason(current?.reason || "");
    }
  }, [open, current]);

  const handleApply = useCallback(() => {
    const numeric = parseFloat(value);
    if (!numeric || numeric <= 0) return;
    onApply({ type, value: numeric, reason: reason.trim() });
    onClose();
  }, [type, value, reason, onApply, onClose]);

  return (
    <s-modal
      id={DISCOUNT_MODAL_ID}
      ref={modalRef}
      heading="Add discount"
      onAfterHide={onAfterHide}
    >
      <s-grid gap="base" gridTemplateColumns="1fr">
        <s-grid gap="base" gridTemplateColumns="1fr 1fr">
          <s-select
            label="Discount type"
            value={type}
            onChange={(e) => setType(getInputEventValue(e))}
          >
            <s-option value="fixed_amount">Amount ($)</s-option>
            <s-option value="percentage">Percentage (%)</s-option>
          </s-select>
          <s-text-field
            label="Discount value"
            type="number"
            prefix={type === "percentage" ? "%" : "$"}
            value={value}
            onInput={(e) => setValue(getInputEventValue(e))}
            {...clearDefaultZeroProps(value, setValue, "0")}
          />
        </s-grid>

        <s-text-field
          label="Reason (optional)"
          placeholder="e.g. Loyalty reward"
          value={reason}
          onInput={(e) => setReason(getInputEventValue(e))}
        />
      </s-grid>

      <s-button
        slot="primary-action"
        variant="primary"
        onClick={handleApply}
        {...(parseFloat(value) > 0 ? {} : { disabled: true })}
      >
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
          Remove discount
        </s-button>
      ) : null}
      <s-button slot="secondary-actions" variant="tertiary" onClick={onClose}>
        Cancel
      </s-button>
    </s-modal>
  );
}
