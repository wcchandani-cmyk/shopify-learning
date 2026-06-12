import { getInputEventValue, getCheckboxChecked } from "../../utils/fieldEvent";

export default function BrowseSelectModal({
  id,
  heading,
  modalRef,
  search,
  setSearch,
  showOnlySelected,
  setShowOnlySelected,
  tempSelected,
  filteredItems,
  isAllSelected,
  onToggleSelectAll,
  onToggleItem,
  onSave,
  onClose,
  onAfterHide,
  loading,
  icon = "image",
  itemSubtitle = "",
}) {
  return (
    <s-modal id={id} ref={modalRef} heading={heading} onAfterHide={onAfterHide}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px 0" }}>
        <s-text-field
          label="Search"
          labelAccessibilityVisibility="exclusive"
          icon="search"
          placeholder="Search"
          value={search}
          onInput={(event) => setSearch(getInputEventValue(event))}
        />

        <div className="channel-modal-controls">
          <div className="channel-modal-controls__left">
            <span className="product-list-checkbox" onClick={(e) => e.stopPropagation()}>
              <s-checkbox
                checked={isAllSelected}
                onChange={onToggleSelectAll}
              />
            </span>
            <span style={{ fontSize: "14px", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "4px" }}>
              {tempSelected.length} selected <s-icon type="chevron-down" />
            </span>
          </div>
          <div className="channel-modal-controls__right" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <s-switch
              checked={showOnlySelected || undefined}
              onChange={(event) => setShowOnlySelected(getCheckboxChecked(event))}
            />
            <span style={{ fontSize: "14px" }}>Show all selected</span>
          </div>
        </div>

        <div className="channel-list-container">
          {loading ? (
            <div style={{ padding: "20px", textAlign: "center" }}>
              <s-spinner />
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#6d7175" }}>
              No items found.
            </div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className="channel-list-item" onClick={() => onToggleItem(item)}>
                <span className="product-list-checkbox" onClick={(e) => e.stopPropagation()}>
                  <s-checkbox
                    checked={tempSelected.some((t) => t.id === item.id)}
                    onChange={() => onToggleItem(item)}
                  />
                </span>
                <div className="channel-list-item__content flex-align-center">
                  <s-icon source={icon} />
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontWeight: 500 }}>{item.title}</span>
                    {item.email ? (
                      <span style={{ fontSize: "12px", color: "#6d7175" }}>{item.email}</span>
                    ) : itemSubtitle ? (
                      <span style={{ fontSize: "12px", color: "#6d7175" }}>{itemSubtitle}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <s-button slot="primary-action" variant="primary" onClick={onSave}>
        Add
      </s-button>
      <s-button slot="secondary-actions" onClick={onClose}>
        Cancel
      </s-button>
    </s-modal>
  );
}
