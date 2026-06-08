const STATUS_BADGE = {
  active: { tone: "success", color: "strong" },
  draft: { tone: "info", color: "base" },
  archived: { tone: "neutral", color: "subdued" },
};

export function formatStatus(status) {
  if (!status) return "—";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

/** Badge props for header / list (Shopify-style status pill). */
export function getStatusBadgeProps(status) {
  const key = String(status || "").toLowerCase();
  return STATUS_BADGE[key] || { tone: "neutral", color: "base" };
}

export function getInventorySummary(variants = []) {
  const variantCount = variants.length;
  const totalStock = variants.reduce(
    (sum, variant) => sum + (Number(variant.inventoryQuantity) || 0),
    0
  );

  const label =
    variantCount <= 1
      ? `${totalStock} in stock`
      : `${totalStock} in stock for ${variantCount} variants`;

  return { totalStock, variantCount, label, isOutOfStock: totalStock === 0 };
}

export function getPaginationRangeLabel(pagination) {
  if (!pagination) return "";
  const { page, limit, total } = pagination;
  if (total === 0) return "0";
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  return `${start}-${end}`;
}

export function formatPrice(price) {
  if (price == null || price === "") return "—";
  const amount = Number(price);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : "—";
}

export function matchesProductSearch(product, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    product.title,
    product.vendor,
    product.productType,
    product.handle,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}
