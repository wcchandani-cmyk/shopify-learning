import { useState } from "react";
import { getInputEventValue, getCheckboxChecked } from "../../utils/fieldEvent";
import OrderItemThumbnail from "./OrderItemThumbnail";

const HOLD_REASONS = [
  "Inventory out of stock",
  "Address incorrect",
  "High risk of fraud",
  "Awaiting payment",
  "Other",
];

export default function FulfillmentHoldForm({
  lineItems,
  saving,
  onCancel,
  onConfirm,
}) {
  const [reason, setReason] = useState("");
  const [selected, setSelected] = useState(() =>
    lineItems.map((_, index) => index)
  );

  const allSelected = selected.length === lineItems.length;

  const toggleAll = (checked) =>
    setSelected(checked ? lineItems.map((_, index) => index) : []);

  const toggleItem = (index, checked) =>
    setSelected((prev) =>
      checked
        ? [...new Set([...prev, index])]
        : prev.filter((value) => value !== index)
    );

  return (
    <div className="order-hold-form">
      <div className="order-hold-form__head">
        <s-checkbox
          label={`${selected.length} ${
            selected.length === 1 ? "item" : "items"
          } selected`}
          checked={allSelected || undefined}
          onChange={(e) => toggleAll(getCheckboxChecked(e))}
        />
      </div>

      <div className="order-hold-form__items">
        {lineItems.map((item, index) => (
          <div key={index} className="order-hold-form__item">
            <s-checkbox
              label={item.title}
              labelAccessibilityVisibility="exclusive"
              checked={selected.includes(index) || undefined}
              onChange={(e) => toggleItem(index, getCheckboxChecked(e))}
            />
            <OrderItemThumbnail
              imageUrl={item.imageUrl}
              imageAlt={item.imageAlt}
              title={item.title}
            />
            <div className="order-hold-form__item-info">
              <div className="order-line-item-title">{item.title}</div>
              {item.variantTitle ? (
                <div className="order-line-item-variant">
                  <s-badge>{item.variantTitle}</s-badge>
                </div>
              ) : null}
            </div>
            <div className="order-hold-form__qty">
              {item.quantity} of {item.quantity}
            </div>
          </div>
        ))}
      </div>

      <div className="order-hold-form__reason">
        <s-select
          label="Hold reason"
          value={reason}
          onChange={(e) => setReason(getInputEventValue(e))}
        >
          <s-option value="">Select the reason for holding</s-option>
          {HOLD_REASONS.map((item) => (
            <s-option key={item} value={item}>
              {item}
            </s-option>
          ))}
        </s-select>
        <div className="order-hold-form__caption">
          Only you and your staff can see this reason
        </div>
      </div>

      <div className="order-fulfillment-actions">
        <button type="button" className="order-btn-sm" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="order-btn-sm order-btn-sm--primary"
          onClick={() => onConfirm(reason)}
          disabled={!reason || saving}
        >
          Mark as on hold
        </button>
      </div>
    </div>
  );
}
