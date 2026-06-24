import { useEffect, useRef } from "react";
import { getShopDetails } from "../services/shopService";

export function useShopBootstrap() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    getShopDetails()
      .catch((error) => {
        console.warn("Shop bootstrap failed:", error.message);
      });
  }, []);
}
