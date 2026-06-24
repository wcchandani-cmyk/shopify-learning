import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { listMarkets, listSegments } from "../../services/discountService";
import { listCustomers } from "../../services/customerService";

const typeFieldMap = {
  markets: "selectedMarkets",
  segments: "selectedSegments",
  customers: "selectedCustomers",
};

export function useEligibilitySelection(form, setForm) {
  const [activeType, setActiveType] = useState(null); // null | "markets" | "segments" | "customers"
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [tempSelection, setTempSelection] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef(null);

  // Fetch data depending on active type
  const fetchData = useCallback(async (type) => {
    setLoading(true);
    try {
      if (type === "markets") {
        const list = await listMarkets();
        setItemsList(list || []);
      } else if (type === "segments") {
        const list = await listSegments();
        setItemsList(list || []);
      } else if (type === "customers") {
        const data = await listCustomers({ page: 1, limit: 100 });
        if (data && data.customers) {
          setItemsList(
            data.customers.map((c) => ({
              id: `customer-${c.shopifyId || c.id}`,
              title: c.displayName || `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.email || "Unknown Customer",
              email: c.email || "",
            }))
          );
        } else {
          setItemsList([]);
        }
      }
    } catch (err) {
      console.error(`Failed to load ${type}:`, err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle overlay transitions
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    if (activeType) {
      modal.showOverlay?.();
      fetchData(activeType);
    } else {
      modal.hideOverlay?.();
    }
  }, [activeType, fetchData]);

  // Open modal configuration
  const openModal = useCallback((type) => {
    setTempSelection(form[typeFieldMap[type]] || []);
    setSearchQuery("");
    setShowOnlySelected(false);
    setActiveType(type);
  }, [form]);

  // Toggle item selection
  const handleToggleItem = useCallback((item) => {
    setTempSelection((prev) =>
      prev.some((x) => x.id === item.id)
        ? prev.filter((x) => x.id !== item.id)
        : [...prev, item]
    );
  }, []);

  // Save selection
  const handleSave = useCallback(() => {
    const fieldName = typeFieldMap[activeType];
    if (fieldName) {
      setForm((prev) => ({ ...prev, [fieldName]: tempSelection }));
    }
    setActiveType(null);
  }, [activeType, tempSelection, setForm]);

  // Close modal
  const closeModal = useCallback(() => {
    setActiveType(null);
  }, []);

  // Native close sync
  const handleAfterHide = useCallback(() => {
    setActiveType(null);
  }, []);

  // Filter list items
  const filteredItems = useMemo(() => {
    return itemsList.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.email && item.email.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesSelected = !showOnlySelected || tempSelection.some((x) => x.id === item.id);
      return matchesSearch && matchesSelected;
    });
  }, [searchQuery, showOnlySelected, tempSelection, itemsList]);

  // Checkbox select all sync
  const isAllSelected = useMemo(() => {
    if (filteredItems.length === 0) return false;
    return filteredItems.every((item) => tempSelection.some((x) => x.id === item.id));
  }, [filteredItems, tempSelection]);

  // Toggle Select All
  const handleToggleSelectAll = useCallback(() => {
    const ids = filteredItems.map((item) => item.id);
    setTempSelection((prev) => {
      if (isAllSelected) {
        return prev.filter((x) => !ids.includes(x.id));
      }
      const existingIds = new Set(prev.map((x) => x.id));
      return [...prev, ...filteredItems.filter((item) => !existingIds.has(item.id))];
    });
  }, [isAllSelected, filteredItems]);

  return {
    activeType,
    eligibilityModalRef: modalRef,
    eligibilitySearchQuery: searchQuery,
    setEligibilitySearchQuery: setSearchQuery,
    showOnlySelectedEligibility: showOnlySelected,
    setShowOnlySelectedEligibility: setShowOnlySelected,
    tempEligibilitySelection: tempSelection,
    filteredEligibilityItems: filteredItems,
    isAllEligibilitySelected: isAllSelected,
    handleToggleSelectAllEligibility: handleToggleSelectAll,
    handleToggleEligibilityItem: handleToggleItem,
    handleSaveEligibility: handleSave,
    closeEligibilityModal: closeModal,
    handleAfterHideEligibility: handleAfterHide,
    eligibilityLoading: loading,

    openMarketsModal: () => openModal("markets"),
    openSegmentsModal: () => openModal("segments"),
    openCustomersModal: () => openModal("customers"),
  };
}
