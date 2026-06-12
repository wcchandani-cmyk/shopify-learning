export default function DiscountListBulkBar({
  selectedCount,
  deleting,
  onDelete,
  onClearSelection,
}) {
  if (selectedCount < 1) return null;

  const label =
    selectedCount === 1
      ? "1 discount selected"
      : `${selectedCount} discounts selected`;

  return (
    <div className="product-list-bulk-bar">
      <s-stack direction="inline" gap="small" alignItems="center">
        <s-text type="strong">{label}</s-text>
        <s-button variant="tertiary" onClick={onClearSelection}>
          Clear
        </s-button>
        <s-button
          tone="critical"
          onClick={onDelete}
          {...(deleting ? { loading: true } : {})}
        >
          Delete
        </s-button>
      </s-stack>
    </div>
  );
}
