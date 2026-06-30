export default function SelectedResourcesList({
  items,
  appliesTo,
  isExpanded,
  onToggleExpand,
  onEdit,
  onRemove,
}) {
  if (!items || items.length === 0) return null;

  const visibleItems = isExpanded ? items : items.slice(0, 4);

  return (
    <div className="selected-resources-list">
      {visibleItems.map((item) => {
        const selectedVariantsCount = item.variants ? item.variants.filter((variant) => variant.selected).length : 0;
        const totalVariantsCount = item.variants ? item.variants.length : 0;

        return (
          <div key={item.id} className="resource-row">
            <div className="resource-row__left">
              {item.image ? (
                <img src={item.image} alt={item.title} className="resource-row__thumbnail" />
              ) : (
                <div className="resource-row__thumbnail-placeholder">
                  <s-icon source={appliesTo === "collections" ? "folder" : "image"} />
                </div>
              )}
              <div className="resource-row__info">
                <span className="resource-row__title">{item.title}</span>
                <div className="resource-row__subtitle-container">
                  <span className="resource-row__subtitle">
                    {appliesTo === "collections" ? (
                      "Collection"
                    ) : totalVariantsCount > 0 ? (
                      `${selectedVariantsCount} of ${totalVariantsCount} variants selected`
                    ) : (
                      item.variants?.[0]?.price ? `$${item.variants[0].price}` : ""
                    )}
                  </span>
                  {appliesTo === "products" && totalVariantsCount > 1 && (
                    <button
                      type="button"
                      className="resource-row__edit-link"
                      onClick={() => onEdit(item)}
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="resource-row__remove"
              onClick={() => onRemove(item)}
            >
              &times;
            </button>
          </div>
        );
      })}

      {items.length > 4 && (
        <button
          type="button"
          className="resources-list-toggle"
          onClick={onToggleExpand}
        >
          {isExpanded ? (
            <span>Show less</span>
          ) : (
            <span>Show all {items.length} selected {appliesTo} &gt;</span>
          )}
        </button>
      )}
    </div>
  );
}
