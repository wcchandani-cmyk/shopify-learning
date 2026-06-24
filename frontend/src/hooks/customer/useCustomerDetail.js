import { useCallback, useEffect, useState } from "react";
import { getCustomer } from "../../services/customerService";

export function useCustomerDetail(customerId) {
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

    return getCustomer(customerId)
      .then((data) => setCustomer(data))
      .catch((err) => {
        setCustomer(null);
        setError(err.message || "Failed to load customer");
      })
      .finally(() => setLoading(false));
  }, [customerId]);

  useEffect(() => {
    load();
  }, [load]);

  return { customer, loading, error, reload: load };
}
