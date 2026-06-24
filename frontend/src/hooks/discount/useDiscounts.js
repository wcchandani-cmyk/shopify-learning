import { useCallback, useEffect, useState } from "react";
import { listDiscounts } from "../../services/discountService";

const DEFAULT_PAGE_SIZE = 25;

export function useDiscounts(pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const [discounts, setDiscounts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(
    (targetPage) => {
      setLoading(true);
      setError(null);

      return listDiscounts({ page: targetPage, limit: pageSize })
        .then((data) => {
          setDiscounts(data?.discounts ?? []);
          setPagination(data?.pagination ?? null);
          setPage(targetPage);
        })
        .catch((err) => {
          setDiscounts([]);
          setPagination(null);
          setError(err.message || "Failed to load discounts");
        })
        .finally(() => setLoading(false));
    },
    [pageSize]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const goToPage = useCallback(
    (nextPage) => {
      if (nextPage < 1 || loading) return;
      if (pagination && nextPage > pagination.totalPages) return;
      load(nextPage);
    },
    [load, loading, pagination]
  );

  return {
    discounts,
    pagination,
    loading,
    error,
    page,
    reload: () => load(page),
    goToPreviousPage: () => goToPage(page - 1),
    goToNextPage: () => goToPage(page + 1),
  };
}
