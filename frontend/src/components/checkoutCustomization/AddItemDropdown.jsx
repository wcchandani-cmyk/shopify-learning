import { useId } from "react";

export default function AddItemDropdown({ items, onAdd, label = "Add Item", groupLabel = "Items" }) {
  const pid = `aid-${useId().replace(/:/g, "")}`;
  return (
    <>
      <s-button
        variant="primary"
        icon="chevron-down"
        commandFor={pid}
        command="--toggle"
      >
        {label}
      </s-button>
      <s-popover id={pid} position="below">
        <div className="ccf-popover-menu">
          <div className="ccf-dropdown-group-label">{groupLabel}</div>
          {items.map((t) => (
            <button
              key={t.id}
              type="button"
              className="ccf-dropdown-item"
              command="--hide"
              commandFor={pid}
              onClick={() => onAdd(t.id)}
            >
              <s-icon type={t.icon} />
              {t.label}
            </button>
          ))}
        </div>
      </s-popover>
    </>
  );
}
