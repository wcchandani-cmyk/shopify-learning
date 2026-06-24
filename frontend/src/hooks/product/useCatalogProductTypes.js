import { useCallback, useEffect, useState } from "react";
import { listProducts } from "../../services/productService";
import { normalizeProductTypes } from "../../utils/productTypes";

export function useCatalogProductTypes(seedTypes = []) {
  const [types, setTypes] = useState(() => normalizeProductTypes(seedTypes));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);

    return listProducts({ page: 1, limit: 1 })
      .then((data) => {
        const fromList = data?.productTypes ?? [];
        setTypes((prev) => normalizeProductTypes(seedTypes, fromList, prev));
      })
      .catch((err) => {
        setError(err.message || "Failed to load product types");
        setTypes((prev) => normalizeProductTypes(seedTypes, prev));
      })
      .finally(() => setLoading(false));
  }, [seedTypes]);

  useEffect(() => {
    load();
  }, [load]);

  return { types, loading, error, reload: load };
}
