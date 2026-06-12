import { useCallback, useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { listCustomers } from "../../services/customerService";

const DEFAULT_PAGE_SIZE = 25;

/** Paginated list of customers for the Customers list page. */
export function useCustomerList(pageSize = DEFAULT_PAGE_SIZE) {
  const shopify = useAppBridge();
  const [page, setPage] = useState(1);
  const [customers, setCustomers] = useState([]);
  const [count, setCount] = useState(0);
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
          listCustomers({ page: targetPage, limit: pageSize }, token)
        )
        .then((data) => {
          setCustomers(data?.customers ?? []);
          setCount(data?.count ?? 0);
          setPagination(data?.pagination ?? null);
          setPage(targetPage);
        })
        .catch((err) => {
          setCustomers([]);
          setCount(0);
          setPagination(null);
          setError(err.message || "Failed to load customers");
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
    customers,
    count,
    pagination,
    loading,
    error,
    page,
    reload: () => load(page),
    goToPreviousPage: () => goToPage(page - 1),
    goToNextPage: () => goToPage(page + 1),
  };
}
