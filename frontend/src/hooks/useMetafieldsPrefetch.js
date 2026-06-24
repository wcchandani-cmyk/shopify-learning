import { useEffect, useState } from "react";
import {
  prefetchMetafields,
  getCachedMetafields,
} from "../services/metafieldsStore";

export function useMetafieldsPrefetch(entityType, entityId) {
  const [, forceRender] = useState(0);

  useEffect(() => {
    if (!entityId || getCachedMetafields(entityType, entityId))
      return undefined;

    let active = true;
    prefetchMetafields(entityType, entityId)
      .catch((err) => console.error("Metafields prefetch failed:", err))
      .finally(() => {
        if (active) forceRender((v) => v + 1);
      });

    return () => {
      active = false;
    };
  }, [entityType, entityId]);

  const ready = !entityId || Boolean(getCachedMetafields(entityType, entityId));
  return { loading: !ready };
}
