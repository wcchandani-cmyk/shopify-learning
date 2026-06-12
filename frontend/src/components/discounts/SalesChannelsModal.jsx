import { getInputEventValue, getCheckboxChecked } from "../../utils/fieldEvent";

export default function SalesChannelsModal({
  modalRef,
  channelSearch,
  setChannelSearch,
  showOnlySelected,
  setShowOnlySelected,
  tempSelectedChannels,
  filteredChannels,
  isAllFilteredSelected,
  onToggleSelectAll,
  onToggleChannel,
  onSave,
  onClose,
  onAfterHide,
}) {
  return (
    <s-modal
      id="sales-channels-modal"
      ref={modalRef}
      heading="Sales channel access"
      onAfterHide={onAfterHide}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px 0" }}>
        <s-text-field
          label="Search"
          labelAccessibilityVisibility="exclusive"
          icon="search"
          placeholder="Search"
          value={channelSearch}
          onInput={(event) => setChannelSearch(getInputEventValue(event))}
        />

        <div className="channel-modal-controls">
          <div className="channel-modal-controls__left">
            <span className="product-list-checkbox" onClick={(e) => e.stopPropagation()}>
              <s-checkbox
                checked={isAllFilteredSelected}
                onChange={onToggleSelectAll}
              />
            </span>
            <span style={{ fontSize: "14px", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "4px" }}>
              {tempSelectedChannels.length} selected <s-icon type="chevron-down" />
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
          {filteredChannels.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#6d7175" }}>
              No sales channels found.
            </div>
          ) : (
            filteredChannels.map((channel) => (
              <div key={channel.id} className="channel-list-item" onClick={() => onToggleChannel(channel.id)}>
                <span className="product-list-checkbox" onClick={(e) => e.stopPropagation()}>
                  <s-checkbox
                    checked={tempSelectedChannels.includes(channel.id)}
                    onChange={() => onToggleChannel(channel.id)}
                  />
                </span>
                <div className="channel-list-item__content">
                  <s-icon type={channel.icon} color="subdued" />
                  <span>{channel.name}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <s-button
        slot="primary-action"
        variant="primary"
        onClick={onSave}
      >
        Done
      </s-button>
      <s-button slot="secondary-actions" onClick={onClose}>
        Cancel
      </s-button>
    </s-modal>
  );
}
