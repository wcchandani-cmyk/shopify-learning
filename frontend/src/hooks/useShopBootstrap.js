import { useEffect, useRef } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getShopDetails } from "../services/shopService";

export function useShopBootstrap() {
  const shopify = useAppBridge();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    shopify
      .idToken()
      .then((token) => getShopDetails(token))
      .catch((error) => {
        console.warn("Shop bootstrap failed:", error.message);
      });
  }, [shopify]);
}
