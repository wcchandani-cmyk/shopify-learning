import { formatMoney } from "../../utils/customerForm";

export default function OrderPaymentSection({
  currency,
  hasItems,
  itemCount,
  subtotal,
  discount,
  discountAmount,
  shipping,
  shippingAmount,
  total,
  saving,
  paymentDueLater,
  onTogglePaymentDueLater,
  paymentTermsTemplates = [],
  paymentTermsTemplateId,
  onChangePaymentTerm,
  onAddDiscount,
  onAddShipping,
  onCreate,
  onMarkAsPaid,
  onSendInvoice,
}) {
  return (
    <s-section heading="Payment">
      <div className="order-pay-table">
        <div className="order-pay-row">
          <span>Subtotal</span>
          <span className="order-pay-row__desc">
            {hasItems ? `${itemCount} ${itemCount === 1 ? "item" : "items"}` : ""}
          </span>
          <span className="order-pay-amount">
            {formatMoney(subtotal, currency)}
          </span>
        </div>

        <div className="order-pay-row">
          <button
            type="button"
            className={`order-pay-link${hasItems ? "" : " order-pay-link--muted"}`}
            onClick={onAddDiscount}
            disabled={!hasItems}
          >
            Add discount
          </button>
          <span className="order-pay-row__desc">{discount?.reason || "—"}</span>
          <span className="order-pay-amount">
            {discountAmount > 0
              ? `-${formatMoney(discountAmount, currency)}`
              : formatMoney(0, currency)}
          </span>
        </div>

        <div className="order-pay-row">
          <button
            type="button"
            className={`order-pay-link${hasItems ? "" : " order-pay-link--muted"}`}
            onClick={onAddShipping}
            disabled={!hasItems}
          >
            Add shipping or delivery
          </button>
          <span className="order-pay-row__desc">
            {shipping?.title && shippingAmount > 0 ? shipping.title : "—"}
          </span>
          <span className="order-pay-amount">
            {formatMoney(shippingAmount, currency)}
          </span>
        </div>

        <div className="order-pay-row">
          <span className="order-pay-row__label-muted">
            Estimated tax
            <s-icon type="info" size="small" color="subdued" />
          </span>
          <span className="order-pay-row__desc">Not calculated</span>
          <span className="order-pay-amount">{formatMoney(0, currency)}</span>
        </div>

        <div className="order-pay-row order-pay-total">
          <span>Total</span>
          <span />
          <span className="order-pay-amount">
            {formatMoney(total, currency)}
          </span>
        </div>


      </div>

      {!hasItems && (
        <div className="order-pay-helper">
          Add a product to calculate total and view payment options
        </div>
      )}

      {hasItems && (
        <>
          <div className="order-pay-duelater">
            <label className="order-pay-checkbox">
              <input
                type="checkbox"
                checked={paymentDueLater}
                onChange={(e) => onTogglePaymentDueLater(e.target.checked)}
              />
              <span>Payment due later</span>
            </label>

            {paymentDueLater && (
              <div className="order-pay-terms">
                <label className="order-currency-label" htmlFor="payment-terms-select">
                  Payment terms
                </label>
                <select
                  id="payment-terms-select"
                  className="order-currency-select"
                  value={paymentTermsTemplateId || ""}
                  onChange={(e) => onChangePaymentTerm(e.target.value)}
                >
                  {paymentTermsTemplates.map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.name}
                    </option>
                  ))}
                </select>
                <p className="order-pay-terms-help">
                  Payment due when invoice is sent. You'll be able to collect the
                  balance from the order page.
                </p>
              </div>
            )}
          </div>

          <div className="order-pay-footer">
            <s-button
              variant="secondary"
              onClick={onSendInvoice}
              {...(saving ? { disabled: true } : {})}
            >
              Send invoice
            </s-button>

            {paymentDueLater ? (
              <s-button
                variant="primary"
                onClick={() => onCreate("pending")}
                {...(saving ? { disabled: true } : {})}
              >
                Create order
              </s-button>
            ) : (
              <>
                <s-button
                  variant="primary"
                  icon="chevron-down"
                  commandFor="collect-payment-popover"
                  command="--toggle"
                  {...(saving ? { disabled: true } : {})}
                >
                  Collect payment
                </s-button>
                <s-popover id="collect-payment-popover" position="below">
                  <div className="payment-popover-menu">
                    <button type="button" className="payment-popover-item" disabled>
                      Credit card
                    </button>
                    <button
                      type="button"
                      className="payment-popover-item"
                      command="--hide"
                      commandFor="collect-payment-popover"
                      onClick={onMarkAsPaid}
                    >
                      Mark as paid
                    </button>
                  </div>
                </s-popover>
              </>
            )}
          </div>
        </>
      )}
    </s-section>
  );
}
