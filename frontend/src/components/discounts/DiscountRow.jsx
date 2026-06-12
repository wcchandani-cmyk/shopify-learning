import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getCheckboxChecked } from "../../utils/fieldEvent";

const getStatusBadge = (status) => {
  const statusLower = String(status || "").toLowerCase();
  if (statusLower === "active") return { tone: "success", label: "Active" };
  if (statusLower === "scheduled") return { tone: "warning", label: "Scheduled" };
  return { tone: "neutral", label: "Expired" };
};

const getTypeIcon = (type) => {
  const typeLower = String(type || "").toLowerCase();
  if (typeLower.includes("shipping")) return "delivery";
  if (typeLower.includes("buy x")) return "gift-card";
  if (typeLower.includes("order")) return "order";
  return "discount";
};

const DiscountRow = memo(function DiscountRow({
  discount,
  selected = false,
  onSelectedChange,
}) {
  const navigate = useNavigate();
  const checkboxId = `discount-${discount.id}`;
  const badgeProps = getStatusBadge(discount.status);

  const handleTitleClick = useCallback((event) => {
    event.preventDefault();
    navigate(`/discounts/${discount.id}`);
  }, [navigate, discount.id]);

  return (
    <s-table-row clickDelegate={checkboxId}>
      <s-table-cell>
        <span
          className="product-list-checkbox"
          onClick={(event) => event.stopPropagation()}
        >
          <s-checkbox
            id={checkboxId}
            checked={selected}
            onChange={(event) =>
              onSelectedChange?.(discount.id, getCheckboxChecked(event))
            }
          />
        </span>
      </s-table-cell>

      <s-table-cell>
        <s-stack gap="extra-tight">
          <s-link
            href={`/discounts/${discount.id}`}
            onClick={handleTitleClick}
          >
            {discount.title}
          </s-link>
          <s-text color="subdued" size="small">
            {discount.summary || "No description"}
          </s-text>
        </s-stack>
      </s-table-cell>

      <s-table-cell>
        <s-badge tone={badgeProps.tone}>{badgeProps.label}</s-badge>
      </s-table-cell>

      <s-table-cell>
        <s-text>{discount.method}</s-text>
      </s-table-cell>

      <s-table-cell>
        <s-stack direction="inline" gap="tight" alignItems="center">
          <s-icon type="customers" color="subdued" />
          <s-text>{discount.eligibility}</s-text>
        </s-stack>
      </s-table-cell>

      <s-table-cell>
        <s-stack direction="inline" gap="tight" alignItems="center">
          <s-icon type={getTypeIcon(discount.type)} color="subdued" />
          <s-text>{discount.type}</s-text>
        </s-stack>
      </s-table-cell>

      <s-table-cell>
        <s-stack direction="inline" gap="small" alignItems="center">
          <span
            title="Product"
            style={{
              opacity: discount.combinesWithProduct ? 1 : 0.2,
              display: "inline-flex",
            }}
          >
            <s-icon
              type="discount"
              color={discount.combinesWithProduct ? undefined : "subdued"}
            />
          </span>
          <span
            title="Order"
            style={{
              opacity: discount.combinesWithOrder ? 1 : 0.2,
              display: "inline-flex",
            }}
          >
            <s-icon
              type="order"
              color={discount.combinesWithOrder ? undefined : "subdued"}
            />
          </span>
          <span
            title="Shipping"
            style={{
              opacity: discount.combinesWithShipping ? 1 : 0.2,
              display: "inline-flex",
            }}
          >
            <s-icon
              type="delivery"
              color={discount.combinesWithShipping ? undefined : "subdued"}
            />
          </span>
        </s-stack>
      </s-table-cell>

      <s-table-cell>
        <div style={{ textAlign: "right", paddingRight: "12px" }}>
          <s-text fontWeight="bold">{discount.usedCount}</s-text>
        </div>
      </s-table-cell>
    </s-table-row>
  );
});

export default DiscountRow;
