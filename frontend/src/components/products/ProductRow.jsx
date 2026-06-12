import { memo } from "react";
import { getCheckboxChecked } from "../../utils/fieldEvent";
import { useProductListItem } from "../../hooks/product/useProductListItem";
import ProductThumbnail from "./ProductThumbnail";

const ProductRow = memo(function ProductRow({
  product,
  productTypes = [],
  selected = false,
  onSelectedChange,
}) {
  const checkboxId = `product-${product.id}`;
  const { title, inventory, statusLabel, statusBadge, onTitleClick } =
    useProductListItem(product, productTypes);

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
              onSelectedChange?.(product.id, getCheckboxChecked(event))
            }
          />
        </span>
      </s-table-cell>
      <s-table-cell>
        <s-stack direction="inline" gap="small" alignItems="center">
          <ProductThumbnail
            title={title}
            imageUrl={product.imageUrl}
            imageAlt={product.imageAlt}
          />
          <s-link
            href={`/products/${product.id}`}
            onClick={onTitleClick}
          >
            {title}
          </s-link>
        </s-stack>
      </s-table-cell>
      <s-table-cell>
        <s-badge {...statusBadge}>{statusLabel}</s-badge>
      </s-table-cell>
      <s-table-cell>
        <s-text tone={inventory.isOutOfStock ? "critical" : undefined}>
          {inventory.label}
        </s-text>
      </s-table-cell>
      <s-table-cell>{product.productType || "—"}</s-table-cell>
      <s-table-cell>{product.vendor || "—"}</s-table-cell>
    </s-table-row>
  );
});

export default ProductRow;
