import { useCallback, useMemo, useState } from "react";

/** Row-selection state for the companies table (select all / per row). */
export function useCompanySelection(filteredCompanies) {
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const selectedCount = selectedIds.size;

  const allFilteredSelected = useMemo(
    () =>
      filteredCompanies.length > 0 &&
      filteredCompanies.every((company) => selectedIds.has(company.id)),
    [filteredCompanies, selectedIds]
  );

  const someFilteredSelected = useMemo(
    () =>
      filteredCompanies.some((company) => selectedIds.has(company.id)) &&
      !allFilteredSelected,
    [filteredCompanies, selectedIds, allFilteredSelected]
  );

  const toggleCompany = useCallback((companyId, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(companyId);
      } else {
        next.delete(companyId);
      }
      return next;
    });
  }, []);

  const toggleSelectAllFiltered = useCallback(
    (checked) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredCompanies.forEach((company) => {
          if (checked) {
            next.add(company.id);
          } else {
            next.delete(company.id);
          }
        });
        return next;
      });
    },
    [filteredCompanies]
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (companyId) => selectedIds.has(companyId),
    [selectedIds]
  );

  const getSelectedIds = useCallback(() => [...selectedIds], [selectedIds]);

  return {
    selectedCount,
    allFilteredSelected,
    someFilteredSelected,
    toggleCompany,
    toggleSelectAllFiltered,
    clearSelection,
    isSelected,
    getSelectedIds,
  };
}
