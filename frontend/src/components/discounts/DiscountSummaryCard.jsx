export default function DiscountSummaryCard({
  shopify,
  type,
  displayType,
  isNew,
  form,
  summaryHeader,
  summaryDetails,
  sidebarBadgeTone,
  sidebarBadgeLabel,
}) {
  const discountCategory =
    type === "Free shipping"
      ? "Shipping discount"
      : type === "Amount off order"
      ? "Order discount"
      : "Product discount";

  const categoryIcon =
    type === "Free shipping"
      ? "shipping"
      : type === "Amount off order"
      ? "receipt"
      : "tag";

  return (
    <s-section>
      {/* Header */}
      <div className="summary-card__header">
        <s-heading>{summaryHeader}</s-heading>
        {!isNew && (
          <s-badge tone={sidebarBadgeTone}>{sidebarBadgeLabel}</s-badge>
        )}
      </div>

      {/* Method badge */}
      <s-text color="subdued" className="summary-card__method">
        {form.method}
      </s-text>

      {/* Type */}
      <div className="summary-section">
        <p className="summary-label">Type</p>
        <p className="summary-value">{displayType}</p>
        <div className="summary-category">
          <s-icon type={categoryIcon} color="subdued" />
          <s-text color="subdued" size="small">{discountCategory}</s-text>
        </div>
      </div>

      {/* Details */}
      {summaryDetails.length > 0 && (
        <div className="summary-section">
          <p className="summary-label">Details</p>
          <ul className="summary-details-list">
            {summaryDetails.map((detail, index) => (
              <li key={index}>{detail}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Performance */}
      {!isNew && (
        <div className="summary-section">
          <p className="summary-label">Performance</p>
          <p className="summary-value">{form.usedCount || 0} used</p>
          <button
            type="button"
            className="link-button"
            onClick={() =>
              shopify.toast.show("Report not available in development")
            }
          >
            View sales by discount report
          </button>
        </div>
      )}
    </s-section>
  );
}
