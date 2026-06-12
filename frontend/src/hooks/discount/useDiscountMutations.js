import { useCallback, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { deleteDiscounts as deleteDiscountsRequest } from "../../services/discountService";

export function useDiscountMutations() {
  const shopify = useAppBridge();
  const [deleting, setDeleting] = useState(false);

  const deleteDiscounts = useCallback(
    (ids) => {
      setDeleting(true);
      return shopify
        .idToken()
        .then((token) => deleteDiscountsRequest(ids, token))
        .finally(() => setDeleting(false));
    },
    [shopify]
  );

  return { deleteDiscounts, deleting };
}
