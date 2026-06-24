import { useCallback, useState } from "react";
import {
  bulkDeleteProducts,
  createProduct,
  updateProduct,
} from "../../services/productService";

export function useProductMutations() {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const saveProduct = useCallback(
    ({ productId, payload, isNew }) => {
      setSaving(true);
      return (
        isNew
          ? createProduct(payload)
          : updateProduct(productId, payload)
      ).finally(() => setSaving(false));
    },
    [],
  );

  const deleteProducts = useCallback(
    (ids) => {
      setDeleting(true);
      return bulkDeleteProducts(ids)
        .finally(() => setDeleting(false));
    },
    [],
  );

  return { saveProduct, deleteProducts, saving, deleting };
}
