import { useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  prefetchMetafields,
  getCachedMetafields,
} from "../services/metafieldsStore";

export function useMetafieldsPrefetch(entityType, entityId) {
  const shopify = useAppBridge();
  const [, forceRender] = useState(0);

  useEffect(() => {
    if (!entityId || getCachedMetafields(entityType, entityId))
      return undefined;

    let active = true;
    shopify
      .idToken()
      .then((token) => prefetchMetafields(entityType, entityId, token))
      .catch((err) => console.error("Metafields prefetch failed:", err))
      .finally(() => {
        if (active) forceRender((v) => v + 1);
      });

    return () => {
      active = false;
    };
  }, [shopify, entityType, entityId]);

  const ready = !entityId || Boolean(getCachedMetafields(entityType, entityId));
  return { loading: !ready };
}
