import { useCallback, useMemo, useState } from "react";

export function useSelection(filteredItems = []) {
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const selectedCount = selectedIds.size;

  const allFilteredSelected = useMemo(
    () =>
      filteredItems.length > 0 &&
      filteredItems.every((item) => selectedIds.has(item.id)),
    [filteredItems, selectedIds]
  );

  const someFilteredSelected = useMemo(
    () =>
      filteredItems.some((item) => selectedIds.has(item.id)) &&
      !allFilteredSelected,
    [filteredItems, selectedIds, allFilteredSelected]
  );

  const toggleItem = useCallback((itemId, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(itemId);
      } else {
        next.delete(itemId);
      }
      return next;
    });
  }, []);

  const toggleSelectAllFiltered = useCallback(
    (checked) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredItems.forEach((item) => {
          if (checked) {
            next.add(item.id);
          } else {
            next.delete(item.id);
          }
        });
        return next;
      });
    },
    [filteredItems]
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (itemId) => selectedIds.has(itemId),
    [selectedIds]
  );

  const getSelectedIds = useCallback(() => [...selectedIds], [selectedIds]);

  return {
    selectedCount,
    allFilteredSelected,
    someFilteredSelected,
    toggleItem,
    toggleSelectAllFiltered,
    clearSelection,
    isSelected,
    getSelectedIds,
  };
}
