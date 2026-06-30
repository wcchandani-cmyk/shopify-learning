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
                        {item.properties.map((property, propertyIndex) => {
                          const propertyName = property.name || property.key;
                          const propertyValue = property.value;
                          if (!propertyName) return null;
                          return (
                            <div
                              key={propertyIndex}
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
                              {propertyName}
                              {propertyValue ? `: ${propertyValue}` : ''}
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
                  <s-button
                    onClick={onOpenHoldForm}
                  >
                    Add hold
                  </s-button>
                  <s-button
                    variant="primary"
                    onClick={onReleaseHold}
                  >
                    Release hold
                  </s-button>
                </>
              ) : (
                <>
                  <s-button-group gap="none">
                    <s-button variant="primary" onClick={onMarkFulfilled}>
                      Mark as fulfilled
                    </s-button>
                    <s-button
                      variant="primary"
                      icon="chevron-down"
                      commandFor="fulfillment-options-popover"
                      command="--toggle"
                      accessibilityLabel="Fulfillment options"
                    />
                    <s-popover id="fulfillment-options-popover" position="below">
                      <s-stack padding="none" gap="none">
                        {fulfillmentMenuOptions.map((option) => (
                          <s-button
                            key={option.status}
                            variant="tertiary"
                            width="100%"
                            command="--hide"
                            commandFor="fulfillment-options-popover"
                            onClick={() => {
                              if (option.status === "on hold") {
                                onOpenHoldForm();
                              } else {
                                onUpdateStatus(option.status);
                              }
                            }}
                          >
                            {option.label}
                          </s-button>
                        ))}
                      </s-stack>
                    </s-popover>
                  </s-button-group>
                </>
              )}
            </div>
          )}
        </>
      )}
    </s-section>
  );
}
