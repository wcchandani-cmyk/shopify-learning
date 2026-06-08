import { getPaginationRangeLabel } from "../../utils/productDisplay";

export default function ProductListPagination({
  pagination,
  onPreviousPage,
  onNextPage,
}) {
  if (!pagination) return null;

  const range = getPaginationRangeLabel(pagination);

  return (
    <div className="product-list-pagination">
      <s-button
        variant="tertiary"
        icon="chevron-left"
        accessibilityLabel="Previous page"
        disabled={!pagination.hasPreviousPage}
        onClick={onPreviousPage}
      />
      <span className="product-list-pagination__range">{range}</span>
      <s-button
        variant="tertiary"
        icon="chevron-right"
        accessibilityLabel="Next page"
        disabled={!pagination.hasNextPage}
        onClick={onNextPage}
      />
    </div>
  );
}
