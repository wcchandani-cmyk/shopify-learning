import { useCallback, useMemo, useState } from "react";
import { getCheckboxChecked } from "../utils/fieldEvent";

export function useProductSelection(filteredProducts) {
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const selectedCount = selectedIds.size;

  const allFilteredSelected = useMemo(
    () =>
      filteredProducts.length > 0 &&
      filteredProducts.every((product) => selectedIds.has(product.id)),
    [filteredProducts, selectedIds],
  );

  const someFilteredSelected = useMemo(
    () =>
      filteredProducts.some((product) => selectedIds.has(product.id)) &&
      !allFilteredSelected,
    [filteredProducts, selectedIds, allFilteredSelected],
  );

  const toggleProduct = useCallback((productId, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(productId);
      } else {
        next.delete(productId);
      }
      return next;
    });
  }, []);

  const toggleSelectAllFiltered = useCallback(
    (checked) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredProducts.forEach((product) => {
          if (checked) {
            next.add(product.id);
          } else {
            next.delete(product.id);
          }
        });
        return next;
      });
    },
    [filteredProducts],
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (productId) => selectedIds.has(productId),
    [selectedIds],
  );

  const getSelectedIds = useCallback(() => [...selectedIds], [selectedIds]);

  return {
    selectedCount,
    allFilteredSelected,
    someFilteredSelected,
    toggleProduct,
    toggleSelectAllFiltered,
    clearSelection,
    isSelected,
    getSelectedIds,
  };
}
