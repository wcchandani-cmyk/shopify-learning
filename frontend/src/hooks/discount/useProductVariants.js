import { useCallback, useState, useEffect, useRef } from "react";

export function useProductVariants(setForm) {
  const [editingProduct, setEditingProduct] = useState(null);
  const [tempVariants, setTempVariants] = useState([]);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const variantModalRef = useRef(null);

  useEffect(() => {
    if (editingProduct) {
      const targetProduct = editingProduct.section ? editingProduct.product : editingProduct;
      setTempVariants(targetProduct?.variants || []);
      setIsVariantModalOpen(true);
    } else {
      setTempVariants([]);
      setIsVariantModalOpen(false);
    }
  }, [editingProduct]);

  useEffect(() => {
    const modal = variantModalRef.current;
    if (!modal) return;
    if (isVariantModalOpen) {
      modal.showOverlay?.();
    } else {
      modal.hideOverlay?.();
    }
  }, [isVariantModalOpen]);

  const handleToggleVariant = useCallback((variantId) => {
    setTempVariants((prev) =>
      prev.map((variant) => (variant.id === variantId ? { ...variant, selected: !variant.selected } : variant))
    );
  }, []);

  const handleSaveVariants = useCallback(() => {
    if (!editingProduct) return;
    const { section, product } = editingProduct;
    const targetProduct = section ? product : editingProduct;
    const targetField = section === "buys"
      ? "bxgyCustomerBuysSelectedItems"
      : section === "gets"
      ? "bxgyCustomerGetsSelectedItems"
      : "selectedItems";

    setForm((prev) => ({
      ...prev,
      [targetField]: (prev[targetField] || []).map((item) =>
        item.id === targetProduct.id ? { ...item, variants: tempVariants } : item
      ),
    }));
    setEditingProduct(null);
  }, [editingProduct, tempVariants, setForm]);

  return {
    editingProduct,
    setEditingProduct,
    tempVariants,
    setTempVariants,
    isVariantModalOpen,
    variantModalRef,
    handleToggleVariant,
    handleSaveVariants,
  };
}
