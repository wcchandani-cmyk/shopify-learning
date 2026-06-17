import "../../styles/CustomDiscountDetail.css";
import {
  CAMPAIGN_LABELS,
  DISCOUNT_TYPE_LABELS,
} from "../../constants/customDiscounts";

export default function CustomDiscountSummaryCard({
  isNew,
  form,
  campaignType,
  discountType,
  status,
}) {
  const methodLabel = form.method === "Code" ? "Discount Code" : "Automatic";
  const campaignLabel = CAMPAIGN_LABELS[campaignType] || campaignType;
  const discountTypeLabel = DISCOUNT_TYPE_LABELS[discountType] || discountType;

  return (
    <s-section>
      <div className="custom-summary-card">
        {/* Header */}
        <div className="custom-summary-card__header-row">
          <span className="custom-summary-card__title">Summary</span>
          {!isNew && status && (
            <s-badge tone={status === "active" ? "success" : "warning"}>
              {status}
            </s-badge>
          )}
        </div>

        {/* Discount Method */}
        <div className="custom-summary-item">
          <span className="custom-summary-item__bullet">•</span>
          <div className="custom-summary-item__content">
            <span className="custom-summary-item__key">Discount Method</span>
            <span className="custom-summary-item__value">{methodLabel}</span>
          </div>
        </div>

        {/* Campaign */}
        <div className="custom-summary-item">
          <span className="custom-summary-item__bullet">•</span>
          <div className="custom-summary-item__content">
            <span className="custom-summary-item__key">Campaign</span>
            <span className="custom-summary-item__value">{campaignLabel}</span>
          </div>
        </div>

        {/* Discount Type */}
        {!(form.functionType === "2" && form.shippingDiscountType === "free_shipping") && (
          <div className="custom-summary-item">
            <span className="custom-summary-item__bullet">•</span>
            <div className="custom-summary-item__content">
              <span className="custom-summary-item__key">Discount Type</span>
              <span className="custom-summary-item__value">
                {discountTypeLabel}
              </span>
            </div>
          </div>
        )}
      </div>
    </s-section>
  );
}
