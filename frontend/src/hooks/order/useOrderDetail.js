import { useCallback, useEffect, useState } from "react";
import { getOrder } from "../../services/orderService";

export function useOrderDetail(orderId) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(orderId));
  const [error, setError] = useState(null);

  const load = useCallback(
    (silent = false) => {
      if (!orderId) {
        setOrder(null);
        setError(null);
        setLoading(false);
        return Promise.resolve();
      }

      // Silent reloads refresh data in place without flipping the page into the
      // full-page loader, which would unmount open overlays (modals) mid-teardown.
      if (!silent) setLoading(true);
      setError(null);

      return getOrder(orderId)
        .then((data) => setOrder(data))
        .catch((err) => {
          if (!silent) setOrder(null);
          setError(err.message || "Failed to load order");
        })
        .finally(() => {
          if (!silent) setLoading(false);
        });
    },
    [orderId]
  );


  useEffect(() => {
    load();
  }, [load]);

  return { order, loading, error, reload: load };
}
