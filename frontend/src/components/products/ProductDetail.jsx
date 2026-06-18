import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useProductMutations } from "../../hooks/product/useProductMutations";
import { useUnsavedProductGuard } from "../../hooks/product/useUnsavedProductGuard";
import { getInputEventValue } from "../../utils/fieldEvent";
import {
  buildUpdatePayload,
  productToFormState,
  variantsToFormState,
} from "../../utils/productForm";
import { normalizeProductTypes } from "../../utils/productTypes";
import { listProductVendors } from "../../services/productService";
import ProductCategoryPicker from "./ProductCategoryPicker";
import SearchAddCombobox from "./SearchAddCombobox";
import ProductMediaUpload from "./ProductMediaUpload";
import ProductRichTextEditor from "./ProductRichTextEditor";
import ProductDetailPageHeader from "./ProductDetailPageHeader";
import ProductVariantSection from "./ProductVariantSection";
import MetafieldsCard from "../shared/metafields/MetafieldsCard";
import {
  parseProductOptions,
  syncVariantsWithOptions,
} from "../../utils/productVariants";
import { exclusiveFieldLabel } from "../../utils/formFields";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

export default function ProductDetail({
  product,
  productTypes = [],
  isNew = false,
  onBack,
  onSaved,
}) {
  const shopify = useAppBridge();
  const { saveProduct, saving } = useProductMutations();
  const location = useLocation();
  const [form, setForm] = useState(() => productToFormState(product));
  const [variants, setVariants] = useState(() => {
    if (location.state?.draftVariants) {
      return location.state.draftVariants;
    }
    return variantsToFormState(product.variants);
  });
  const [options, setOptions] = useState(() => {
    if (location.state?.draftOptions) {
      return location.state.draftOptions;
    }
    return parseProductOptions(product, variantsToFormState(product.variants));
  });
  const [saveError, setSaveError] = useState(null);

  const warnUnsavedLeave = useCallback(() => {
    shopify.toast.show("Save changes before leaving", { isError: true });
  }, [shopify]);

  const { resetBaseline, allowLeaveAfterSave, requestLeave } =
    useUnsavedProductGuard(form, variants, options, {
      onBlockLeave: warnUnsavedLeave,
    });

  useEffect(() => {
    const nextForm = productToFormState(product);
    let nextVariants = variantsToFormState(product.variants);
    let nextOptions = parseProductOptions(product, nextVariants);

    if (location.state?.draftVariants) {
      nextVariants = location.state.draftVariants;
    }
    if (location.state?.draftOptions) {
      nextOptions = location.state.draftOptions;
    }

    setForm(nextForm);
    setVariants(nextVariants);
    setOptions(nextOptions);
    setSaveError(null);
    resetBaseline(nextForm, nextVariants, nextOptions);
  }, [
    product,
    resetBaseline,
    location.state?.draftVariants,
    location.state?.draftOptions,
  ]);

  const updateField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateVariant = useCallback((index, field, value) => {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant
      )
    );
  }, []);

  const handleOptionsChange = useCallback((nextOptions) => {
    setOptions(nextOptions);
    setVariants((prev) => syncVariantsWithOptions(nextOptions, prev));
  }, []);

  const handleOptionEditCommit = useCallback((optionIndex, draft) => {
    setOptions((prevOptions) => {
      const option = prevOptions[optionIndex];
      if (!option) return prevOptions;

      const position = option.position ?? optionIndex + 1;
      const optionKey = `option${position}`;
      const newName = String(draft.name || "").trim() || option.name;

      const cleanedRows = (draft.values || [])
        .map((row) => ({
          originalValue: row.originalValue,
          value: String(row.value || "").trim(),
        }))
        .filter((row) => row.value);

      const uniqueValues = [...new Set(cleanedRows.map((row) => row.value))];

      const renameMap = new Map();
      cleanedRows.forEach((row) => {
        if (row.originalValue && row.originalValue !== row.value) {
          renameMap.set(row.originalValue, row.value);
        }
      });

      const nextOptions = prevOptions.map((opt, index) =>
        index === optionIndex
          ? { ...opt, name: newName, values: uniqueValues }
          : opt,
      );

      setVariants((prevVariants) => {
        const renamed = prevVariants.map((variant) => {
          const current = String(variant[optionKey] || "").trim();
          if (!renameMap.has(current)) return variant;

          const nextValue = renameMap.get(current);
          const next = { ...variant, [optionKey]: nextValue };
          next.title =
            [next.option1, next.option2, next.option3]
              .map((value) => String(value || "").trim())
              .filter(Boolean)
              .join(" / ") || nextValue;
          return next;
        });

        return syncVariantsWithOptions(nextOptions, renamed);
      });

      return nextOptions;
    });
  }, []);

  const handleOptionsReorder = useCallback((fromIndex, toIndex) => {
    setOptions((prevOptions) => {
      if (
        fromIndex === toIndex ||
        fromIndex == null ||
        toIndex == null ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prevOptions.length ||
        toIndex >= prevOptions.length
      ) {
        return prevOptions;
      }

      const reordered = [...prevOptions];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);

      const oldKeys = reordered.map(
        (option, i) => `option${option.position ?? i + 1}`,
      );
      const nextOptions = reordered.map((option, i) => ({
        ...option,
        position: i + 1,
      }));

      setVariants((prevVariants) =>
        prevVariants.map((variant) => {
          const values = oldKeys.map((key) => variant[key]);
          const next = {
            ...variant,
            option1: nextOptions.length >= 1 ? values[0] ?? null : "",
            option2: nextOptions.length >= 2 ? values[1] ?? null : "",
            option3: nextOptions.length >= 3 ? values[2] ?? null : "",
          };
          next.title =
            [next.option1, next.option2, next.option3]
              .map((value) => String(value || "").trim())
              .filter(Boolean)
              .join(" / ") || next.title;
          return next;
        }),
      );

      return nextOptions;
    });
  }, []);

  const draftNavigationState = useMemo(
    () => ({
      draft: { form, variants, options },
      productTypes,
    }),
    [form, variants, options, productTypes]
  );

  const handleSave = useCallback(async () => {
    const title = form.title.trim();
    if (!title) {
      const message = "Title is required";
      setSaveError(message);
      shopify.toast.show(message, { isError: true });
      return false;
    }

    setSaveError(null);

    try {
      const payload = buildUpdatePayload(form, variants, options);
      const data = await saveProduct({
        productId: product.id,
        payload,
        isNew,
      });

      shopify.toast.show(isNew ? "Product created" : "Product saved");
      allowLeaveAfterSave();
      onSaved?.(data);
      return true;
    } catch (err) {
      const message = err.message || "Failed to save product";
      setSaveError(message);
      shopify.toast.show(message, { isError: true });
      return false;
    }
  }, [
    shopify,
    form,
    variants,
    options,
    product.id,
    isNew,
    onSaved,
    allowLeaveAfterSave,
    saveProduct,
  ]);

  const pageHeading = isNew ? "Add product" : "Product details";
  const pageTitle = isNew
    ? form.title.trim() || "Add product"
    : form.title.trim() || "Product";
  useEffect(() => {
    document.title = pageHeading;
  }, [pageHeading]);

  const typeOptions = useMemo(
    () => normalizeProductTypes(productTypes, product.availableProductTypes),
    [productTypes, product.availableProductTypes]
  );

  const loadVendors = useCallback(
    () => shopify.idToken().then((token) => listProductVendors(token)),
    [shopify]
  );

  const handleBack = useCallback(() => {
    requestLeave(onBack);
  }, [requestLeave, onBack]);

  return (
    <s-page heading={pageHeading}>
      <s-link
        slot="breadcrumb-actions"
        href="/products"
        onClick={(event) => {
          event.preventDefault();
          handleBack();
        }}
      >
        Products
      </s-link>
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={handleSave}
        {...(saving ? { loading: true } : {})}
      >
        Save
      </s-button>

      {saveError ? <s-banner tone="critical">{saveError}</s-banner> : null}

      <ProductDetailPageHeader title={pageTitle} status={form.status} />

      <s-query-container containerName="product-detail">
        <div className="product-detail-layout">
          <div className="product-detail-layout__main">
            <s-stack gap="base">
              <s-section>
                <s-text-field
                  label="Title"
                  placeholder="Enter title"
                  {...exclusiveFieldLabel}
                  value={form.title}
                  onInput={(event) =>
                    updateField("title", getInputEventValue(event))
                  }
                />
              </s-section>

              <s-section heading="Description">
                <ProductRichTextEditor
                  key={isNew ? "new" : product.id}
                  placeholder="Enter description"
                  value={form.bodyHtml}
                  onChange={(bodyHtml) => updateField("bodyHtml", bodyHtml)}
                />
              </s-section>

              <s-section heading="Media">
                <ProductMediaUpload
                  title={form.title}
                  images={form.images}
                  onImagesChange={(images) =>
                    setForm((prev) => ({
                      ...prev,
                      images,
                      imageUrl: images[0]?.url || "",
                      imageAlt: images[0]?.alt || "",
                    }))
                  }
                  onError={(message) =>
                    shopify.toast.show(message, { isError: true })
                  }
                />
              </s-section>

              <s-section heading="Category">
                <ProductCategoryPicker
                  categoryId={form.categoryId}
                  categoryName={form.categoryName}
                  onChange={(category) =>
                    setForm((prev) => ({
                      ...prev,
                      categoryId: category?.id || "",
                      categoryName: category?.fullName || "",
                    }))
                  }
                />
              </s-section>

              <s-section padding="none">
                <s-box padding="base">
                  <ProductVariantSection
                    productId={product.id}
                    isNew={isNew}
                    productTitle={form.title}
                    productStatus={form.status}
                    imageUrl={form.imageUrl}
                    variants={variants}
                    options={options}
                    onOptionsChange={handleOptionsChange}
                    onOptionEditCommit={handleOptionEditCommit}
                    onOptionsReorder={handleOptionsReorder}
                    onVariantChange={updateVariant}
                    draftNavigationState={draftNavigationState}
                  />
                </s-box>
              </s-section>

              <MetafieldsCard entityType="product" entityId={isNew ? "new" : product.id} />
            </s-stack>
          </div>

          <div className="product-detail-layout__aside">
            <s-stack gap="base">
              <s-section heading="Status">
                <s-select
                  label="Status"
                  {...exclusiveFieldLabel}
                  value={form.status}
                  onChange={(event) =>
                    updateField("status", getInputEventValue(event))
                  }
                >
                  {STATUS_OPTIONS.map((option) => (
                    <s-option key={option.value} value={option.value}>
                      {option.label}
                    </s-option>
                  ))}
                </s-select>
              </s-section>

              <s-section heading="Publishing">
                <s-text>All channels</s-text>
              </s-section>

              <s-section heading="Sales">
                <s-text color="subdued">No recent sales of this product</s-text>
              </s-section>

              <s-section heading="Product organization">
                <s-stack gap="base">
                  <SearchAddCombobox
                    label="Type"
                    placeholder="Search or add product type"
                    value={form.productType}
                    options={typeOptions}
                    onChange={(productType) =>
                      updateField("productType", productType)
                    }
                  />
                  <SearchAddCombobox
                    label="Vendor"
                    placeholder="Search or add vendor"
                    value={form.vendor}
                    loadOptions={loadVendors}
                    onChange={(vendor) => updateField("vendor", vendor)}
                  />
                </s-stack>
              </s-section>

              <s-section heading="Theme template">
                <s-select
                  label="Theme template"
                  {...exclusiveFieldLabel}
                  value={form.templateSuffix || ""}
                  onChange={(event) =>
                    updateField("templateSuffix", getInputEventValue(event))
                  }
                >
                  <s-option value="">Default product</s-option>
                </s-select>
              </s-section>
            </s-stack>
          </div>
        </div>
      </s-query-container>
    </s-page>
  );
}
