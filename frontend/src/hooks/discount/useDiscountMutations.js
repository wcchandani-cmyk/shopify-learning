import { useCallback, useState } from "react";
import { deleteDiscounts as deleteDiscountsRequest } from "../../services/discountService";

export function useDiscountMutations() {
  const [deleting, setDeleting] = useState(false);

  const deleteDiscounts = useCallback(
    (ids) => {
      setDeleting(true);
      return deleteDiscountsRequest(ids)
        .finally(() => setDeleting(false));
    },
    []
  );

  return { deleteDiscounts, deleting };
}
