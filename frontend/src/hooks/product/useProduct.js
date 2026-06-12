import { useCallback, useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getProduct } from "../../services/productService";

const sameProductId = (a, b) => String(a) === String(b);

export function useProduct(productId, initialProduct = null) {
  const shopify = useAppBridge();
  const hasInitial =
    initialProduct && sameProductId(initialProduct.id, productId);
  const [product, setProduct] = useState(hasInitial ? initialProduct : null);
  const [loading, setLoading] = useState(() => Boolean(productId));
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    if (!hasInitial) {
      setProduct(null);
    }
  }, [productId, hasInitial]);

  const load = useCallback(() => {
    if (!productId) {
      setProduct(null);
      setError(null);
      setLoading(false);
      return Promise.resolve();
    }

    setLoading(true);
    setError(null);

    return shopify
      .idToken()
      .then((token) => getProduct(productId, token))
      .then((data) => setProduct(data))
      .catch((err) => {
        if (hasInitial) {
          setProduct(initialProduct);
        } else {
          setProduct(null);
          setError(err.message || "Failed to load product");
        }
      })
      .finally(() => setLoading(false));
  }, [shopify, productId, hasInitial, initialProduct]);

  useEffect(() => {
    load();
  }, [load]);

  return { product, loading, error, reload: load };
}
