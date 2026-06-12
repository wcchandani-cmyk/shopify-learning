import { useCallback, useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  getInitialDiscountForm,
  getSummaryHeader,
  getSummaryDetails,
} from "../../utils/discountForm";

// Import modular sub-hooks
import { useSalesChannels } from "./useSalesChannels";
import { useCountrySelection } from "./useCountrySelection";
import { useProductVariants } from "./useProductVariants";
import { useDiscountResources } from "./useDiscountResources";
import { useDiscountOperations } from "./useDiscountOperations";
import { useEligibilitySelection } from "./useEligibilitySelection";

export function useDiscountForm({ type, isNew = true, discountData = null }) {
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const location = useLocation();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef(null);

  const [form, setForm] = useState(() => {
    if (location.state?.duplicateForm) {
      return location.state.duplicateForm;
    }
    const base = getInitialDiscountForm();
    if (discountData) {
      return {
        ...base,
        ...discountData,
        selectedItems: discountData.selectedItems || [],
      };
    }
    return base;
  });

  useEffect(() => {
    if (discountData) {
      setForm((prev) => ({
        ...prev,
        ...discountData,
        selectedItems: discountData.selectedItems || [],
      }));
    }
  }, [discountData]);

  // Close the header actions dropdown when clicking outside of it.
  useEffect(() => {
    if (!headerMenuOpen) return undefined;
    const handleClickOutside = (event) => {
      if (event.target.closest?.("[data-header-actions-trigger]")) return;
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target)) {
        setHeaderMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [headerMenuOpen]);

  const updateField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Delegate modular states to sub-hooks
  const channels = useSalesChannels(form.selectedChannels, updateField);
  const countries = useCountrySelection(form.selectedCountries, updateField, shopify);
  const variants = useProductVariants(setForm);
  const resources = useDiscountResources(form, setForm, shopify);
  const operations = useDiscountOperations({
    form,
    type,
    isNew,
    discountData,
    shopify,
    navigate,
    updateField,
    saving,
    setSaving,
    setSaveError,
  });

  const eligibilitySelection = useEligibilitySelection(form, setForm, shopify);

  const displayType = type || "Discount";

  const summaryHeader = useMemo(() => getSummaryHeader(form), [form]);

  const summaryDetails = useMemo(() => getSummaryDetails(form, type), [form, type]);

  const tagList = useMemo(() => {
    return form.tags
      ? form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
      : [];
  }, [form.tags]);

  const pageHeading = isNew ? "Create discount" : (form.title || "Discount");

  const statusBadgeLower = String(form.status || "active").toLowerCase();
  const sidebarBadgeTone = statusBadgeLower === "active" ? "success" : statusBadgeLower === "scheduled" ? "warning" : undefined;
  const sidebarBadgeLabel = statusBadgeLower === "active" ? "Active" : statusBadgeLower === "scheduled" ? "Scheduled" : "Expired";

  return {
    shopify,
    type,
    isNew,
    discountData,
    displayType,
    pageHeading,

    form,
    setForm,
    updateField,
    saving,
    saveError,

    isEditingTags,
    setIsEditingTags,
    tagInput,
    setTagInput,
    tagList,

    // Spread channels sub-hook return fields
    ...channels,

    // Spread countries sub-hook return fields
    ...countries,

    // Spread resources sub-hook return fields and handler
    ...resources,

    // Spread variants sub-hook return fields
    ...variants,

    // Header actions menu
    headerMenuOpen,
    setHeaderMenuOpen,
    headerMenuRef,

    // Spread operations sub-hook return handlers
    ...operations,

    // Spread eligibility selection sub-hook return fields
    ...eligibilitySelection,

    // Summary
    summaryHeader,
    summaryDetails,
    sidebarBadgeTone,
    sidebarBadgeLabel,
  };
}
