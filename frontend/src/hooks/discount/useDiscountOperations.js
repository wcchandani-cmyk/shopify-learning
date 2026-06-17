import { useCallback, useRef } from "react";
import { createDiscount, updateDiscount, deleteDiscounts } from "../../services/discountService";
import { combineDateTime, generateRandomDiscountCode } from "../../utils/discountForm";

export function useDiscountOperations({
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
}) {
  const isSavingRef = useRef(false);

  const handleDeleteDiscount = useCallback(async () => {
    if (!discountData || !discountData.id || isSavingRef.current || saving) return;
    const confirmed = window.confirm(`Are you sure you want to delete ${form.title || "this discount"}?`);
    if (!confirmed) return;

    isSavingRef.current = true;
    setSaving(true);
    try {
      const token = await shopify.idToken();
      await deleteDiscounts([discountData.id], token);
      shopify.toast.show("Discount deleted");
      navigate("/discounts");
    } catch (err) {
      shopify.toast.show(err.message || "Failed to delete discount", { isError: true });
      isSavingRef.current = false;
      setSaving(false);
    }
  }, [discountData, form.title, shopify, navigate, setSaving, saving]);

  const handleDuplicateDiscount = useCallback(() => {
    navigate(`/discounts/new/${type === "Free shipping" ? "free-shipping" : type === "Amount off order" ? "amount-off-order" : "amount-off-product"}`, {
      state: {
        duplicateForm: {
          ...form,
          title: `${form.title} Copy`,
        }
      }
    });
    shopify.toast.show("Discount details copied");
  }, [form, type, navigate, shopify]);

  const handleGenerateCode = useCallback(() => {
    const code = generateRandomDiscountCode();
    updateField("title", code);
    shopify.toast.show("Code generated");
  }, [updateField, shopify]);

  const handleCancel = useCallback(() => {
    navigate("/discounts");
  }, [navigate]);

  const handleSave = useCallback(async () => {
    if (isSavingRef.current || saving) return;
    const titleClean = form.title.trim();
    if (!titleClean) {
      const msg = form.method === "Code" ? "Discount code is required" : "Title is required";
      setSaveError(msg);
      shopify.toast.show(msg, { isError: true });
      return;
    }

    const isValueRequired = type === "Amount off product" || type === "Amount off order";
    if (isValueRequired) {
      const val = parseFloat(form.value);
      if (isNaN(val) || val <= 0) {
        const msg = "Please enter a valid positive discount value";
        setSaveError(msg);
        shopify.toast.show(msg, { isError: true });
        return;
      }
    }
    if (type === "Free shipping" && form.excludeShippingRates) {
      const cleanVal = String(form.excludeShippingRatesValue || "").replace(/,/g, "");
      const val = parseFloat(cleanVal);
      if (isNaN(val) || val < 0) {
        const msg = "Please enter a valid shipping rate threshold";
        setSaveError(msg);
        shopify.toast.show(msg, { isError: true });
        return;
      }
    }

    isSavingRef.current = true;
    setSaving(true);
    setSaveError(null);

    try {
      const startsAt = combineDateTime(form.startDate, form.startTime);
      const endsAt = form.hasEndDate ? combineDateTime(form.endDate, form.endTime) : null;

      const payload = {
        ...form,
        title: titleClean,
        type,
        value: isValueRequired ? form.value : "100",
        startsAt,
        endsAt,
        minimumRequirementValue: form.minimumRequirementValue ? parseFloat(form.minimumRequirementValue) : null,
        limitTotalUsesValue: form.limitTotalUsesValue ? parseInt(form.limitTotalUsesValue, 10) : null,
        selectedCountries: form.selectedCountries || [],
        selectedItems: form.selectedItems || [],
        selectedCustomers: form.selectedCustomers || [],
        selectedSegments: form.selectedSegments || [],
        selectedMarkets: form.selectedMarkets || [],
        bxgyCustomerBuysSelectedItems: form.bxgyCustomerBuysSelectedItems || [],
        bxgyCustomerGetsSelectedItems: form.bxgyCustomerGetsSelectedItems || [],
      };

      const token = await shopify.idToken();
      if (isNew) {
        await createDiscount(payload, token);
        shopify.toast.show("Discount created successfully");
      } else {
        await updateDiscount(discountData.id, payload, token);
        shopify.toast.show("Discount updated successfully");
      }
      navigate("/discounts");
    } catch (err) {
      const msg = err.message || (isNew ? "Failed to create discount" : "Failed to update discount");
      setSaveError(msg);
      shopify.toast.show(msg, { isError: true });
      isSavingRef.current = false;
      setSaving(false);
    }
  }, [form, type, isNew, discountData, shopify, navigate, saving, setSaving, setSaveError]);

  return {
    handleDeleteDiscount,
    handleDuplicateDiscount,
    handleGenerateCode,
    handleCancel,
    handleSave,
  };
}
