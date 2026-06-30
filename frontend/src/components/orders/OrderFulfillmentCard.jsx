import { useState } from "react";
import { formatMoney } from "../../utils/customerForm";
import OrderItemThumbnail from "./OrderItemThumbnail";
import FulfillmentHoldForm from "./FulfillmentHoldForm";

export default function OrderFulfillmentCard({
  lineItems,
  currency,
  fulfillment,
  fulfillmentState,
  fulfillmentMenuOptions,
  itemsCount,
  isOnHold,
  holdReason,
  holdFormOpen,
  holdingOrder,
  onMarkFulfilled,
  onUpdateStatus,
  onOpenHoldForm,
  onCancelHold,
  onConfirmHold,
  onReleaseHold,
}) {
  const [splitMenuOpen, setSplitMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  const toggleSplitMenu = (event) => {
    if (!splitMenuOpen) {
      const rect = event.currentTarget
        .closest(".order-split-button")
        .getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setSplitMenuOpen((open) => !open);
  };

  return (
    <s-section>
      <div className="order-fulfillment-header">
        <s-stack direction="inline" gap="small-200" alignItems="center">
          <s-badge size="large" tone={fulfillment.tone} icon={fulfillment.icon}>
            {fulfillment.label} ({itemsCount})
          </s-badge>
          <s-badge size="large" icon="location">Shop location</s-badge>
        </s-stack>
        <div className="order-fulfillment-header__actions" onClick={() => {}}>
          <span className="order-fulfillment-header__more-icon">···</span>
        </div>
      </div>

      {isOnHold && holdReason ? (
        <div className="order-manual-hold">
          <span>Manual hold</span>
          <s-badge>{holdReason}</s-badge>
        </div>
      ) : null}

      <div className="order-shipping-box">
        <s-icon type="delivery" />
        <span>Shipping</span>
      </div>

      {holdFormOpen ? (
        <FulfillmentHoldForm
          lineItems={lineItems}
          saving={holdingOrder}
          onCancel={onCancelHold}
          onConfirm={onConfirmHold}
        />
      ) : (
        <>
          <div className="order-line-items-list">
            {lineItems.map((item, index) => (
              <div key={index} className="order-line-item-row">
                <div className="order-line-item-info">
                  <OrderItemThumbnail
                    imageUrl={item.imageUrl}
                    imageAlt={item.imageAlt}
                    title={item.title}
                  />
                  <div>
                    <div className="order-line-item-title">{item.title}</div>
                    {item.variantTitle ? (
                      <div className="order-line-item-variant">
                        <span className="custom-variant-badge">{item.variantTitle}</span>
                      </div>
                    ) : null}
                    {item.properties && item.properties.length > 0 && (
                      <div className="order-line-item-properties" style={{ marginTop: 4 }}>
                        {item.properties.map((prop, pIdx) => {
                          const pName = prop.name || prop.key;
                          const pVal = prop.value;
                          if (!pName) return null;
                          return (
                            <div
                              key={pIdx}
                              className="order-line-item-property"
                              style={{
                                display: "inline-flex",
                                padding: "2px 8px",
                                backgroundColor: "#f1f2f3",
                                borderRadius: "12px",
                                fontSize: "11px",
                                color: "#4f5357",
                                marginTop: "4px",
                                marginRight: "4px",
                                fontWeight: "500",
                                border: "1px solid #e1e3e5",
                              }}
                            >
                              {pName}
                              {pVal ? `: ${pVal}` : ''}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="order-line-item-qty">
                  {formatMoney(item.price, currency)} × {item.quantity}
                </div>
                <div className="order-line-item-price">
                  {formatMoney(item.price * item.quantity, currency)}
                </div>
              </div>
            ))}
          </div>

          {fulfillmentState !== "fulfilled" && (
            <div className="order-fulfillment-actions">
              {isOnHold ? (
                <>
                  <button
                    type="button"
                    className="order-btn-sm"
                    onClick={onOpenHoldForm}
                  >
                    Add hold
                  </button>
                  <button
                    type="button"
                    className="order-btn-sm order-btn-sm--primary"
                    onClick={onReleaseHold}
                  >
                    Release hold
                  </button>
                </>
              ) : (
                <>
                  <div className="order-split-button">
                    <button
                      type="button"
                      className="order-split-button__action"
                      onClick={onMarkFulfilled}
                    >
                      Mark as fulfilled
                    </button>
                    <button
                      type="button"
                      className="order-split-button__toggle"
                      aria-label="Fulfillment options"
                      aria-expanded={splitMenuOpen}
                      onClick={toggleSplitMenu}
                    >
                      <s-icon
                        type="chevron-down"
                        className="order-split-button__chevron"
                      />
                    </button>
                    {splitMenuOpen ? (
                      <div
                        className="order-split-popover-menu"
                        style={{ top: menuPos.top, right: menuPos.right }}
                      >
                        {fulfillmentMenuOptions.map((option) => (
                          <button
                            key={option.status}
                            type="button"
                            className="order-split-popover-item"
                            onClick={() => {
                              setSplitMenuOpen(false);
                              if (option.status === "on hold") {
                                onOpenHoldForm();
                              } else {
                                onUpdateStatus(option.status);
                              }
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </s-section>
  );
}
