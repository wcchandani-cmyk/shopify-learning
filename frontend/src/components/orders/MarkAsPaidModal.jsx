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
          <div className="record-payment-amount">
            <label className="order-currency-label" htmlFor="record-amount">
              Amount
            </label>
            <input
              id="record-amount"
              type="number"
              className="discount-input-field"
              value={amountValue}
              onChange={(e) => setAmountValue(e.target.value)}
              style={{ width: "100%" }}
            />
            <p className="order-pay-terms-help">This is a full payment</p>
          </div>
        )}

        <s-select
          label="Method"
          value={method}
          onChange={(e) => setMethod(getInputEventValue(e))}
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
