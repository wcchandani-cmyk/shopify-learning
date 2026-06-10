import { useCallback, useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getCustomer } from "../services/customerService";

export function useCustomerDetail(customerId) {
  const shopify = useAppBridge();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(customerId));
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    if (!customerId) {
      setCustomer(null);
      setError(null);
      setLoading(false);
      return Promise.resolve();
    }

    setLoading(true);
    setError(null);

    return shopify
      .idToken()
      .then((token) => getCustomer(customerId, token))
      .then((data) => setCustomer(data))
      .catch((err) => {
        setCustomer(null);
        setError(err.message || "Failed to load customer");
      })
      .finally(() => setLoading(false));
  }, [shopify, customerId]);

  useEffect(() => {
    load();
  }, [load]);

  return { customer, loading, error, reload: load };
}
