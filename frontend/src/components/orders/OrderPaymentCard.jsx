import { formatMoney } from "../../utils/customerForm";

export default function OrderPaymentCard({
  currency,
  subtotalPrice,
  totalShipping,
  totalTax,
  totalPrice,
  paidAmount,
  balance,
  itemsCount,
  isPaid,
  collectingPayment,
  onSendInvoice,
  onManualPayment,
  isDraft,
}) {
  return (
    <s-section>
      <div className="order-payment-header">
        <s-badge
          size="large"
          tone={isPaid ? "success" : "warning"}
          {...(isPaid ? {} : { icon: "clock" })}
        >
          {isPaid ? "Paid" : "Payment pending"}
        </s-badge>
      </div>
      <div className="order-payment-table">
        <div className="order-payment-table__section">
          <div className="order-payment-row">
            <span>Subtotal</span>
            <span className="order-payment-row__desc">
              {itemsCount} {itemsCount === 1 ? "item" : "items"}
            </span>
            <span>{formatMoney(subtotalPrice, currency)}</span>
          </div>
          <div className="order-payment-row">
            <span>Shipping</span>
            <span className="order-payment-row__desc" />
            <span>
              {Number(totalShipping) > 0
                ? formatMoney(totalShipping, currency)
                : "Free"}
            </span>
          </div>
          {Number(totalTax) > 0 && (
            <div className="order-payment-row">
              <span>Tax</span>
              <span className="order-payment-row__desc" />
              <span>{formatMoney(totalTax, currency)}</span>
            </div>
          )}
          <div className="order-payment-row order-payment-row--strong">
            <span>Total</span>
            <span />
            <span>{formatMoney(totalPrice, currency)}</span>
          </div>
        </div>

        <div className="order-payment-table__section">
          <div className="order-payment-row">
            <span>Paid</span>
            <span className="order-payment-row__desc" />
            <span>{formatMoney(paidAmount, currency)}</span>
          </div>
          <div className="order-payment-row order-payment-row--strong">
            <span>Balance</span>
            <span className="order-payment-row__desc" />
            <span>{formatMoney(balance, currency)}</span>
          </div>
        </div>
      </div>

      {!isPaid && balance > 0 && (
        <div className="order-payment-warning">
          <s-icon type="alert" size="small" />
          <span>
            {formatMoney(balance, currency)} of the balance is currently
            unauthorized
          </span>
        </div>
      )}

      {!isPaid && (
        <div className="order-payment-actions">
          <s-button variant="secondary" onClick={onSendInvoice}>
            Send invoice
          </s-button>
          <s-button
            variant="primary"
            icon="chevron-down"
            commandFor="order-collect-payment-popover"
            command="--toggle"
            {...(collectingPayment ? { loading: true } : {})}
          >
            Collect payment
          </s-button>
          <s-popover id="order-collect-payment-popover" position="below">
            <div className="payment-popover-menu">
              <button
                type="button"
                className="payment-popover-item"
                disabled
              >
                <s-icon type="credit-card" />
                Credit card
              </button>
              <button
                type="button"
                className="payment-popover-item"
                command="--hide"
                commandFor="order-collect-payment-popover"
                onClick={onManualPayment}
              >
                {isDraft ? "Mark as paid" : "Manual payment"}
              </button>
            </div>
          </s-popover>
        </div>
      )}
    </s-section>
  );
}
