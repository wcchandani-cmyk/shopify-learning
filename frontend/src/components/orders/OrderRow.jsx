import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { formatMoney } from "../../utils/customerForm";
import {
  formatOrderDateShort,
  getPaymentBadge,
  getFulfillmentBadge,
} from "../../utils/orderDisplay";

const OrderRow = memo(function OrderRow({ order, isDraftTab = false }) {
  const navigate = useNavigate();
  const detailPath = isDraftTab ? `/drafts/${order.shopifyId}` : `/orders/${order.shopifyId}`;
  const displayName = isDraftTab ? (order.draftName || order.name) : order.name;
  const displayString = isDraftTab && displayName && displayName.startsWith("D") ? `#${displayName}` : displayName;

  if (isDraftTab) {
    return (
      <s-table-row>
        <s-table-cell>
          <div className="order-row-name-container">
            <s-link
              href={detailPath}
              onClick={(event) => {
                event.preventDefault();
                navigate(detailPath);
              }}
            >
              {displayString}
            </s-link>
          </div>
        </s-table-cell>
        <s-table-cell>—</s-table-cell>
        <s-table-cell>
          {(() => {
            const dateParts = formatOrderDateShort(order.createdAt);
            if (!dateParts) return "—";
            return (
              <div className="order-row-date">
                <span className="order-row-date-date">{dateParts.dateStr}</span>
                <span className="order-row-date-time">{dateParts.timeStr}</span>
              </div>
            );
          })()}
        </s-table-cell>
        <s-table-cell>
          {order.customerName || order.customerEmail || order.email || "No customer"}
        </s-table-cell>
        <s-table-cell>
          {order.financialStatus === "pending" ? (
            <s-badge size="large" tone="warning">Open</s-badge>
          ) : (
            <s-badge size="large">Completed</s-badge>
          )}
        </s-table-cell>
        <s-table-cell>
          {formatMoney(order.totalPrice, order.currency, {
            fallbackCurrency: "USD",
          })}
        </s-table-cell>
      </s-table-row>
    );
  }

  return (
    <s-table-row>
      <s-table-cell>
        <div className="order-row-name-container">
          <s-link
            href={detailPath}
            onClick={(event) => {
              event.preventDefault();
              navigate(detailPath);
            }}
          >
            {displayName}
          </s-link>
        </div>
      </s-table-cell>
      <s-table-cell>
        {(() => {
          const dateParts = formatOrderDateShort(order.createdAt);
          if (!dateParts) return "—";
          return (
            <div className="order-row-date">
              <span className="order-row-date-date">{dateParts.dateStr}</span>
              <span className="order-row-date-time">{dateParts.timeStr}</span>
            </div>
          );
        })()}
      </s-table-cell>
      <s-table-cell>
        {order.customerName || order.customerEmail || order.email || "No customer"}
      </s-table-cell>
      <s-table-cell>—</s-table-cell>
      <s-table-cell>{order.channel || "Online Store"}</s-table-cell>
      <s-table-cell>
        {formatMoney(order.totalPrice, order.currency, {
          fallbackCurrency: "USD",
        })}
      </s-table-cell>
      <s-table-cell>
        {getPaymentBadge(order.financialStatus)}
      </s-table-cell>
      <s-table-cell>{getFulfillmentBadge(order.fulfillmentStatus)}</s-table-cell>
      <s-table-cell>{order.itemsCount} {order.itemsCount === 1 ? "item" : "items"}</s-table-cell>
      <s-table-cell>—</s-table-cell>
      <s-table-cell>Standard</s-table-cell>
      <s-table-cell>{order.tags || "—"}</s-table-cell>
    </s-table-row>
  );
});

export default OrderRow;
