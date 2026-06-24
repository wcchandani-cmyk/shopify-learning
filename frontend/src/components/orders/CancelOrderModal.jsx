import { useEffect, useState } from "react";
import { getInputEventValue } from "../../utils/fieldEvent";
import { useOverlayModal } from "../../hooks/useOverlayModal";
import { formatMoney } from "../../utils/customerForm";

const CANCEL_ORDER_MODAL_ID = "cancel-order-modal";

const CANCEL_REASONS = [
  { value: "CUSTOMER", label: "Customer changed or canceled order" },
  { value: "INVENTORY", label: "Items unavailable" },
  { value: "FRAUD", label: "Fraudulent order" },
  { value: "DECLINED", label: "Payment declined" },
  { value: "STAFF", label: "Staff error" },
  { value: "OTHER", label: "Other" },
];

const REFUND_LATER = "later";
const REFUND_ORIGINAL = "original";

export default function CancelOrderModal({
  open,
  onClose,
  onConfirm,
  orderName,
  refundAmount = 0,
  currency,
  canRefund = false,
  hasCustomer = true,
  saving = false,
}) {
  const { modalRef, onAfterHide } = useOverlayModal(open, onClose);
  const [refundChoice, setRefundChoice] = useState(REFUND_ORIGINAL);
  const [reason, setReason] = useState(CANCEL_REASONS[0].value);
  const [staffNote, setStaffNote] = useState("");

  useEffect(() => {
    if (open) {
      setRefundChoice(REFUND_ORIGINAL);
      setReason(CANCEL_REASONS[0].value);
      setStaffNote("");
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm({
      reason,
      refund: canRefund && refundChoice === REFUND_ORIGINAL,
      restock: true,
      notifyCustomer: true,
      staffNote: staffNote.trim() || null,
    });
  };

  const refundOption = (value, title, subtitle) => (
    <label
      className={`cancel-order-refund-option${
        refundChoice === value ? " cancel-order-refund-option--selected" : ""
      }`}
    >
      <input
        type="radio"
        name="cancel-order-refund"
        value={value}
        checked={refundChoice === value}
        onChange={() => setRefundChoice(value)}
      />
      <span className="cancel-order-refund-option__text">
        <span className="cancel-order-refund-option__title">{title}</span>
        {subtitle ? (
          <span className="cancel-order-refund-option__subtitle">{subtitle}</span>
        ) : null}
      </span>
    </label>
  );

  return (
    <s-modal
      id={CANCEL_ORDER_MODAL_ID}
      ref={modalRef}
      heading={`Cancel order ${orderName || ""}?`}
      onAfterHide={onAfterHide}
    >
      <s-stack gap="base">
        {!hasCustomer && (
          <s-banner tone="info">
            To refund to store credit, first add a customer to the order
          </s-banner>
        )}

        {canRefund && (
          <s-stack gap="small-200">
            <s-text fontWeight="bold">Refund payments</s-text>
            <div className="cancel-order-refund-options">
              {refundOption(
                REFUND_ORIGINAL,
                "Original payment method",
                `Refund ${formatMoney(refundAmount, currency)} (Manual)`
              )}
              {refundOption(REFUND_LATER, "Later", null)}
            </div>
          </s-stack>
        )}

        <s-select
          label="Reason for cancellation"
          value={reason}
          onChange={(e) => setReason(getInputEventValue(e))}
        >
          {CANCEL_REASONS.map((item) => (
            <s-option key={item.value} value={item.value}>
              {item.label}
            </s-option>
          ))}
        </s-select>

        <s-stack gap="small-500">
          <s-text-field
            label="Staff note"
            value={staffNote}
            onInput={(e) => setStaffNote(getInputEventValue(e))}
          />
          <s-text color="subdued">
            Only you and other staff can see this note.
          </s-text>
        </s-stack>
      </s-stack>

      <s-button
        slot="primary-action"
        variant="primary"
        tone="critical"
        onClick={handleConfirm}
        {...(saving ? { loading: true } : {})}
      >
        Cancel order
      </s-button>
      <s-button slot="secondary-actions" onClick={onClose}>
        Keep order
      </s-button>
    </s-modal>
  );
}
