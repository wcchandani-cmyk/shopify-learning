import { useEffect, useState } from "react";
import { getInputEventValue } from "../../utils/fieldEvent";
import { useOverlayModal } from "../../hooks/useOverlayModal";
import { formatMoney } from "../../utils/customerForm";

const MARK_AS_PAID_MODAL_ID = "mark-as-paid-modal";

const PAYMENT_METHODS = ["Other", "Cash on Delivery (COD)"];

export default function MarkAsPaidModal({
  open,
  onClose,
  onConfirm,
  total,
  currency,
  saving = false,
  mode = "create",
  balance,
}) {
  const { modalRef, onAfterHide } = useOverlayModal(open, onClose);
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [amountValue, setAmountValue] = useState("");

  const isRecord = mode === "record";
  const amount = isRecord ? balance : total;

  useEffect(() => {
    if (open) {
      setMethod(PAYMENT_METHODS[0]);
      setAmountValue(String(amount ?? 0));
    }
  }, [open, amount]);

  return (
    <s-modal
      id={MARK_AS_PAID_MODAL_ID}
      ref={modalRef}
      heading={isRecord ? "Record payment" : "Mark as paid"}
      onAfterHide={onAfterHide}
    >
      <s-stack gap="base">
        <s-text>
          {isRecord
            ? `Record payment you received from another payment method. ${formatMoney(
                amount,
                currency
              )} is due later.`
            : `Mark this order as paid if you received ${formatMoney(
                amount,
                currency
              )} from another payment method. This will create an order.`}
        </s-text>

        {isRecord && (
          <s-stack gap="tight">
            <s-number-field
              label="Amount"
              id="record-amount"
              value={amountValue}
              onInput={(event) => setAmountValue(getInputEventValue(event))}
            />
            <s-text tone="subdued">This is a full payment</s-text>
          </s-stack>
        )}

        <s-select
          label="Method"
          value={method}
          onChange={(event) => setMethod(getInputEventValue(event))}
        >
          {PAYMENT_METHODS.map((name) => (
            <s-option key={name} value={name}>
              {name}
            </s-option>
          ))}
        </s-select>
      </s-stack>

      <s-button
        slot="primary-action"
        variant="primary"
        onClick={() => onConfirm(method)}
        {...(saving ? { loading: true } : {})}
      >
        {isRecord ? "Record payment" : "Create order"}
      </s-button>
      <s-button slot="secondary-actions" variant="tertiary" onClick={onClose}>
        Cancel
      </s-button>
    </s-modal>
  );
}
