export default function EditVariantsModal({
  modalRef,
  editingProduct,
  tempVariants,
  setTempVariants,
  onToggleVariant,
  onSave,
  onClose,
}) {
  return (
    <s-modal
      id="edit-variants-modal"
      ref={modalRef}
      heading="Edit variants"
      onAfterHide={onClose}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px 0" }}>
        <div className="channel-modal-controls">
          <div className="channel-modal-controls__left">
            <span className="product-list-checkbox" onClick={(e) => e.stopPropagation()}>
              <s-checkbox
                checked={tempVariants.every((v) => v.selected)}
                onChange={() => {
                  const allSelected = tempVariants.every((v) => v.selected);
                  setTempVariants((prev) => prev.map((v) => ({ ...v, selected: !allSelected })));
                }}
              />
            </span>
            <span style={{ fontSize: "14px", fontWeight: 500 }}>
              {tempVariants.filter((v) => v.selected).length} selected
            </span>
          </div>
        </div>

        <div className="variant-list-container">
          {tempVariants.map((variant) => (
            <div
              key={variant.id}
              className="variant-row"
              onClick={() => onToggleVariant(variant.id)}
            >
              <span className="variant-row__checkbox" onClick={(e) => e.stopPropagation()}>
                <s-checkbox
                  checked={variant.selected}
                  onChange={() => onToggleVariant(variant.id)}
                />
              </span>
              <div className="variant-row__content">
                {editingProduct.image ? (
                  <img src={editingProduct.image} alt={variant.title} className="variant-row__thumbnail" />
                ) : (
                  <div className="resource-row__thumbnail-placeholder" style={{ width: "36px", height: "36px" }}>
                    <s-icon source="image" />
                  </div>
                )}
                <div className="variant-row__info">
                  <span className="variant-row__name">{variant.title}</span>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span className="variant-row__stock">{variant.inventoryQuantity} available</span>
                    <span className="variant-row__price">${variant.price}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
