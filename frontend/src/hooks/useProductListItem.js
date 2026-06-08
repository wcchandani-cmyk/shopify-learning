import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  formatStatus,
  getInventorySummary,
  getStatusBadgeProps,
} from "../utils/productDisplay";

export function useProductListItem(product, productTypes = []) {
  const navigate = useNavigate();
  const title = product.title || "Untitled product";
  const inventory = getInventorySummary(product.variants);
  const statusLabel = formatStatus(product.status);
  const statusBadge = getStatusBadgeProps(product.status);

  const openDetail = useCallback(() => {
    navigate(`/products/${product.id}`, { state: { productTypes } });
  }, [navigate, product.id, productTypes]);

  const onTitleClick = useCallback(
    (event) => {
      event.preventDefault();
      openDetail();
    },
    [openDetail],
  );

  return {
    title,
    inventory,
    statusLabel,
    statusBadge,
    openDetail,
    onTitleClick,
  };
}
