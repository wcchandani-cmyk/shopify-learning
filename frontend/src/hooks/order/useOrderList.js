import { useCallback, useEffect, useState } from "react";
import { listOrders } from "../../services/orderService";

const DEFAULT_PAGE_SIZE = 25;

export function useOrderList(tab = "orders", pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [count, setCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [draftsCount, setDraftsCount] = useState(0);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(
    (targetPage, sync = false) => {
      setLoading(true);
      setError(null);

      return listOrders({ page: targetPage, limit: pageSize, sync, tab })
        .then((data) => {
          setOrders(data?.orders ?? []);
          setCount(data?.count ?? 0);
          setOrdersCount(data?.ordersCount ?? 0);
          setDraftsCount(data?.draftsCount ?? 0);
          setPagination(data?.pagination ?? null);
          setPage(targetPage);
        })
        .catch((err) => {
          setOrders([]);
          setCount(0);
          setOrdersCount(0);
          setDraftsCount(0);
          setPagination(null);
          setError(err.message || "Failed to load orders");
        })
        .finally(() => setLoading(false));
    },
    [pageSize, tab]
  );

  useEffect(() => {
    load(1, true);
  }, [load]);

  const goToPage = useCallback(
    (nextPage) => {
      if (nextPage < 1 || loading) return;
      if (pagination && nextPage > pagination.totalPages) return;
      load(nextPage, false);
    },
    [load, loading, pagination]
  );

  return {
    orders,
    count,
    ordersCount,
    draftsCount,
    pagination,
    loading,
    error,
    page,
    reload: () => load(page, true),
    goToPreviousPage: () => goToPage(page - 1),
    goToNextPage: () => goToPage(page + 1),
  };
}
