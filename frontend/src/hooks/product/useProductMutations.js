import { useCallback, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  bulkDeleteProducts,
  createProduct,
  updateProduct,
} from "../../services/productService";

export function useProductMutations() {
  const shopify = useAppBridge();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const saveProduct = useCallback(
    ({ productId, payload, isNew }) => {
      setSaving(true);
      return shopify
        .idToken()
        .then((token) =>
          isNew
            ? createProduct(payload, token)
            : updateProduct(productId, payload, token),
        )
        .finally(() => setSaving(false));
    },
    [shopify],
  );

  const deleteProducts = useCallback(
    (ids) => {
      setDeleting(true);
      return shopify
        .idToken()
        .then((token) => bulkDeleteProducts(ids, token))
        .finally(() => setDeleting(false));
    },
    [shopify],
  );

  return { saveProduct, deleteProducts, saving, deleting };
}
