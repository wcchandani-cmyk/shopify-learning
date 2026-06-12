import { useCallback, useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { listDiscounts } from "../../services/discountService";

const DEFAULT_PAGE_SIZE = 25;

export function useDiscounts(pageSize = DEFAULT_PAGE_SIZE) {
  const shopify = useAppBridge();
  const [page, setPage] = useState(1);
  const [discounts, setDiscounts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(
    (targetPage) => {
      setLoading(true);
      setError(null);

      return shopify
        .idToken()
        .then((token) =>
          listDiscounts({ page: targetPage, limit: pageSize }, token)
        )
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
    [shopify, pageSize]
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
