import { useMemo, useState } from "react";
import ProductThumbnail from "./ProductThumbnail";
import {
  formatStatus,
  getStatusBadgeProps,
} from "../../utils/productDisplay";
import {
  filterVariantsBySearch,
  getVariantDisplayName,
  getVariantRowKey,
} from "../../utils/productVariants";
import { exclusiveFieldLabel } from "../../utils/formFields";

export default function ProductVariantSidebar({
  productTitle,
  productStatus,
  imageUrl,
  imageAlt,
  variants,
  activeVariantKey,
  onSelectVariant,
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => filterVariantsBySearch(variants, search),
    [variants, search],
  );

  const statusLabel = formatStatus(productStatus);

  return (
    <aside className="variant-editor-sidebar">
      <div className="variant-editor-sidebar__product">
        <ProductThumbnail
          title={productTitle}
          imageUrl={imageUrl}
          imageAlt={imageAlt}
        />
        <div className="variant-editor-sidebar__product-meta">
          <s-text type="strong">{productTitle || "Untitled product"}</s-text>
          <s-stack direction="inline" gap="small" alignItems="center">
            <s-badge {...getStatusBadgeProps(productStatus)}>
              {statusLabel}
            </s-badge>
            <s-text color="subdued">
              {variants.length}{" "}
              {variants.length === 1 ? "variant" : "variants"}
            </s-text>
          </s-stack>
        </div>
      </div>

      <div className="variant-editor-sidebar__search">
        <s-text-field
          label="Search variants"
          {...exclusiveFieldLabel}
          icon="search"
          placeholder="Search variants"
          value={search}
          onInput={(event) => setSearch(event.currentTarget.value)}
        />
      </div>

      <nav className="variant-editor-sidebar__list" aria-label="Variants">
        {filtered.map((variant) => {
          const key = getVariantRowKey(variant);
          const isActive = key === activeVariantKey;
          return (
            <button
              key={key}
              type="button"
              className={`variant-editor-sidebar__item${
                isActive ? " variant-editor-sidebar__item--active" : ""
              }`}
              onClick={() => onSelectVariant?.(variant)}
            >
              <ProductThumbnail
                title={getVariantDisplayName(variant)}
                imageUrl={imageUrl}
                imageAlt={imageAlt}
                size={32}
              />
              <s-text>{getVariantDisplayName(variant)}</s-text>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
