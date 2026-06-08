import { memo } from "react";
import { getCheckboxChecked } from "../../utils/fieldEvent";
import { useProductListItem } from "../../hooks/useProductListItem";
import ProductThumbnail from "./ProductThumbnail";

const ProductListCard = memo(function ProductListCard({
  product,
  productTypes = [],
  selected = false,
  onSelectedChange,
}) {
  const checkboxId = `mobile-product-${product.id}`;
  const { title, inventory, statusLabel, statusBadge, openDetail, onTitleClick } =
    useProductListItem(product, productTypes);

  const stockText = `${inventory.totalStock} in stock`;
  const variantSuffix =
    inventory.variantCount > 1
      ? ` for ${inventory.variantCount} variants`
      : "";

  return (
    <article
      className={`product-list-card${selected ? " product-list-card--selected" : ""}`}
    >
      <div className="product-list-card__row">
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
        <button
          type="button"
          className="product-list-card__open"
          aria-label={`Open ${title}`}
          onClick={openDetail}
        >
          <ProductThumbnail
            title={title}
            imageUrl={product.imageUrl}
            imageAlt={product.imageAlt}
          />
        </button>
        <div className="product-list-card__main">
          <div className="product-list-card__heading">
            <s-link href={`/products/${product.id}`} onClick={onTitleClick}>
              {title}
            </s-link>
            <s-badge {...statusBadge}>{statusLabel}</s-badge>
          </div>
          <p className="product-list-card__inventory">
            <span
              className={
                inventory.isOutOfStock
                  ? "product-list-card__stock--critical"
                  : undefined
              }
            >
              {stockText}
            </span>
            {variantSuffix ? (
              <span className="product-list-card__stock-muted">
                {variantSuffix}
              </span>
            ) : null}
          </p>
        </div>
      </div>
    </article>
  );
});

export default ProductListCard;
