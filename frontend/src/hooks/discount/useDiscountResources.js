import { useState, useMemo, useCallback } from "react";

export function useDiscountResources(form, setForm, shopify) {
  const [appliesToSearchQuery, setAppliesToSearchQuery] = useState("");
  const [buysSearchQuery, setBuysSearchQuery] = useState("");
  const [getsSearchQuery, setGetsSearchQuery] = useState("");
  const [isExpandedResources, setIsExpandedResources] = useState(false);
  const [isExpandedBuys, setIsExpandedBuys] = useState(false);
  const [isExpandedGets, setIsExpandedGets] = useState(false);

  const handleBrowse = useCallback(async (targetSection = "default") => {
    try {
      const appliesToField = targetSection === "buys" ? form.bxgyCustomerBuysAppliesTo : (targetSection === "gets" ? form.bxgyCustomerGetsAppliesTo : form.appliesTo);
      const resourceType = appliesToField === "collections" ? "collection" : "product";

      const selection = await shopify.resourcePicker({
        type: resourceType,
        multiple: true,
      });

      if (selection && selection.length > 0) {
        const newItems = selection.map((item) => {
          const mapped = {
            id: item.id,
            title: item.title,
            image: item.image?.src || item.image?.originalSrc || item.images?.[0]?.src || item.images?.[0]?.originalSrc || "",
          };
          if (resourceType === "product") {
            mapped.variants = (item.variants || []).map((v) => ({
              id: v.id,
              title: v.title,
              price: v.price || "",
              selected: true,
              inventoryQuantity: v.inventoryQuantity ?? v.inventory ?? 0,
            }));
          }
          return mapped;
        });

        const currentItems = (targetSection === "buys" ? form.bxgyCustomerBuysSelectedItems : (targetSection === "gets" ? form.bxgyCustomerGetsSelectedItems : form.selectedItems)) || [];
        const existingMap = new Map(currentItems.map(item => [item.id, item]));
        const mergedNewItems = newItems.map(item => {
          const matched = existingMap.get(item.id);
          if (matched && matched.variants && item.variants) {
            const matchedVariantsMap = new Map(matched.variants.map(v => [v.id, v]));
            item.variants = item.variants.map(v => {
              const mv = matchedVariantsMap.get(v.id);
              return mv ? { ...v, selected: mv.selected } : v;
            });
          }
          return item;
        });

        const newItemsMap = new Map(mergedNewItems.map(item => [item.id, item]));
        const finalItems = [
          ...currentItems.map(item => newItemsMap.get(item.id) || item),
          ...mergedNewItems.filter(item => !existingMap.has(item.id))
        ];

        const fieldName = targetSection === "buys"
          ? "bxgyCustomerBuysSelectedItems"
          : targetSection === "gets"
          ? "bxgyCustomerGetsSelectedItems"
          : "selectedItems";

        setForm((prev) => {
          const next = { ...prev, [fieldName]: finalItems };
          if (fieldName === "selectedItems") {
            next.searchQuery = finalItems.map((item) => item.title).join(", ");
          }
          return next;
        });
        shopify.toast.show(`${finalItems.length} ${resourceType}(s) selected`);
      }
    } catch (error) {
      console.error("Failed to open resource picker:", error);
    }
  }, [form.appliesTo, form.selectedItems, form.bxgyCustomerBuysAppliesTo, form.bxgyCustomerBuysSelectedItems, form.bxgyCustomerGetsAppliesTo, form.bxgyCustomerGetsSelectedItems, setForm, shopify]);

  const filterItems = (items, query) => {
    const q = query.trim().toLowerCase();
    return q ? (items || []).filter(item => item.title.toLowerCase().includes(q)) : (items || []);
  };
  const filteredSelectedItems = useMemo(() => filterItems(form.selectedItems, appliesToSearchQuery), [form.selectedItems, appliesToSearchQuery]);
  const filteredBuysItems = useMemo(() => filterItems(form.bxgyCustomerBuysSelectedItems, buysSearchQuery), [form.bxgyCustomerBuysSelectedItems, buysSearchQuery]);
  const filteredGetsItems = useMemo(() => filterItems(form.bxgyCustomerGetsSelectedItems, getsSearchQuery), [form.bxgyCustomerGetsSelectedItems, getsSearchQuery]);

  return {
    appliesToSearchQuery,
    setAppliesToSearchQuery,
    filteredSelectedItems,
    buysSearchQuery,
    setBuysSearchQuery,
    filteredBuysItems,
    getsSearchQuery,
    setGetsSearchQuery,
    filteredGetsItems,
    isExpandedResources,
    setIsExpandedResources,
    isExpandedBuys,
    setIsExpandedBuys,
    isExpandedGets,
    setIsExpandedGets,
    handleBrowse,
  };
}
