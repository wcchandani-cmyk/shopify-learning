import { useCallback, useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { listProducts } from "../services/productService";

const DEFAULT_PAGE_SIZE = 25;

export function useProducts(pageSize = DEFAULT_PAGE_SIZE) {
  const shopify = useAppBridge();
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
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
          listProducts({ page: targetPage, limit: pageSize }, token),
        )
        .then((data) => {
          setProducts(data?.products ?? []);
          setProductTypes(data?.productTypes ?? []);
          setPagination(data?.pagination ?? null);
          setPage(targetPage);
        })
        .catch((err) => {
          setProducts([]);
          setProductTypes([]);
          setPagination(null);
          setError(err.message || "Failed to load products");
        })
        .finally(() => setLoading(false));
    },
    [shopify, pageSize],
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
    [load, loading, pagination],
  );

  return {
    products,
    productTypes,
    pagination,
    loading,
    error,
    page,
    reload: () => load(page),
    goToPreviousPage: () => goToPage(page - 1),
    goToNextPage: () => goToPage(page + 1),
  };
}
