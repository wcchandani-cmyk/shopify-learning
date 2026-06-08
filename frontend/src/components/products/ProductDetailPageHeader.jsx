import { formatStatus, getStatusBadgeProps } from "../../utils/productDisplay";

export default function ProductDetailPageHeader({ title, status }) {
  const statusLabel = formatStatus(status || "draft");

  return (
    <div className="product-detail-page-header">
      <s-stack direction="inline" gap="small" alignItems="center">
        <h1 className="product-detail-page-header__title">{title}</h1>
        <s-badge size="large" {...getStatusBadgeProps(status || "draft")}>
          {statusLabel}
        </s-badge>
      </s-stack>
    </div>
  );
}
