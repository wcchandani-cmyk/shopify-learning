import { useCallback, useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { listProducts } from "../../services/productService";
import { normalizeProductTypes } from "../../utils/productTypes";

export function useCatalogProductTypes(seedTypes = []) {
  const shopify = useAppBridge();
  const [types, setTypes] = useState(() => normalizeProductTypes(seedTypes));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);

    return shopify
      .idToken()
      .then((token) => listProducts({ page: 1, limit: 1 }, token))
      .then((data) => {
        const fromList = data?.productTypes ?? [];
        setTypes((prev) => normalizeProductTypes(seedTypes, fromList, prev));
      })
      .catch((err) => {
        setError(err.message || "Failed to load product types");
        setTypes((prev) => normalizeProductTypes(seedTypes, prev));
      })
      .finally(() => setLoading(false));
  }, [shopify, seedTypes]);

  useEffect(() => {
    load();
  }, [load]);

  return { types, loading, error, reload: load };
}
