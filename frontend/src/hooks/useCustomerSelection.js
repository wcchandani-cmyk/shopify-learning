import { useCallback, useMemo, useState } from "react";

/** Row-selection state for the customers table (select all / per row). */
export function useCustomerSelection(filteredCustomers) {
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const selectedCount = selectedIds.size;

  const allFilteredSelected = useMemo(
    () =>
      filteredCustomers.length > 0 &&
      filteredCustomers.every((customer) => selectedIds.has(customer.id)),
    [filteredCustomers, selectedIds]
  );

  const someFilteredSelected = useMemo(
    () =>
      filteredCustomers.some((customer) => selectedIds.has(customer.id)) &&
      !allFilteredSelected,
    [filteredCustomers, selectedIds, allFilteredSelected]
  );

  const toggleCustomer = useCallback((customerId, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(customerId);
      } else {
        next.delete(customerId);
      }
      return next;
    });
  }, []);

  const toggleSelectAllFiltered = useCallback(
    (checked) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredCustomers.forEach((customer) => {
          if (checked) {
            next.add(customer.id);
          } else {
            next.delete(customer.id);
          }
        });
        return next;
      });
    },
    [filteredCustomers]
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (customerId) => selectedIds.has(customerId),
    [selectedIds]
  );

  const getSelectedIds = useCallback(() => [...selectedIds], [selectedIds]);

  return {
    selectedCount,
    allFilteredSelected,
    someFilteredSelected,
    toggleCustomer,
    toggleSelectAllFiltered,
    clearSelection,
    isSelected,
    getSelectedIds,
  };
}
