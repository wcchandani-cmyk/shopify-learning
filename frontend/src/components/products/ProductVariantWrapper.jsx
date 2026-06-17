import React, { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";
import PageLoader from "../PageLoader";
import ProductVariantForm from "./ProductVariantForm";
import ProductVariantSidebar from "./ProductVariantSidebar";
import { useProduct } from "../../hooks/product/useProduct";
import {
  createNewVariantDraft,
  mergeOptionValuesFromVariants,
  parseProductOptions,
} from "../../utils/productVariants";
import { variantsToFormState } from "../../utils/productForm";

export default function ProductVariantWrapper() {
  const { id: productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const shopify = useAppBridge();

  const isDraftProduct = productId === "new";
  const draftFromState = location.state?.draft;

  const { product, loading, error } = useProduct(
    isDraftProduct ? null : productId,
    location.state?.product,
  );

  const productSnapshot = useMemo(() => {
    if (isDraftProduct && draftFromState) {
      return draftFromState.product;
    }
    return product;
  }, [isDraftProduct, draftFromState, product]);

  const initialVariants = useMemo(() => {
    if (location.state?.draftVariants) {
      return variantsToFormState(location.state.draftVariants);
    }
    if (draftFromState?.variants) {
      return variantsToFormState(draftFromState.variants);
    }
    return variantsToFormState(productSnapshot?.variants || []);
  }, [location.state?.draftVariants, draftFromState, productSnapshot]);

  const initialOptions = useMemo(() => {
    if (location.state?.draftOptions) {
      return location.state.draftOptions;
    }
    if (draftFromState?.options) {
      return draftFromState.options;
    }
    return parseProductOptions(productSnapshot, initialVariants);
  }, [location.state?.draftOptions, draftFromState, productSnapshot, initialVariants]);

  const returnPath = isDraftProduct
    ? "/products/new"
    : `/products/${productId}`;

  const productTitle =
    draftFromState?.form?.title ||
    productSnapshot?.title ||
    "Untitled product";
  const productStatus =
    draftFromState?.form?.status || productSnapshot?.status || "draft";
  const imageUrl =
    draftFromState?.form?.imageUrl || productSnapshot?.imageUrl || "";
  const imageAlt =
    draftFromState?.form?.imageAlt || productSnapshot?.imageAlt || "";

  const handleCancel = () => {
    navigate(returnPath, {
      state: buildReturnState(),
    });
  };

  const buildReturnState = (extraVariants, extraOptions) => {
    const variants = extraVariants ?? initialVariants;
    const opts = extraOptions ?? initialOptions;
    return {
      productTypes: location.state?.productTypes,
      draftVariants: variants,
      draftOptions: opts,
      draft: isDraftProduct
        ? { ...draftFromState, form: draftFromState?.form, variants, options: opts }
        : draftFromState,
      product: productSnapshot,
    };
  };

  const handleSubmit = ({ optionValues, price, inventoryQuantity }) => {
    const hasOptionFields = initialOptions.length > 0;
    const filledValues = optionValues.map((v) => String(v || "").trim());

    if (hasOptionFields && filledValues.some((v) => !v)) {
      shopify.toast.show("Fill in all option values", { isError: true });
      return;
    }

    if (!hasOptionFields && !filledValues[0]) {
      shopify.toast.show("Enter a variant name", { isError: true });
      return;
    }

    const nextOptions = mergeOptionValuesFromVariants(
      initialOptions,
      [
        createNewVariantDraft({
          optionValues: hasOptionFields ? filledValues : [filledValues[0]],
          price,
          inventoryQuantity,
        }),
      ],
    );

    const newVariant = createNewVariantDraft({
      optionValues: hasOptionFields ? filledValues : [filledValues[0]],
      price,
      inventoryQuantity,
    });

    const nextVariants = [...initialVariants, newVariant];

    shopify.toast.show("Variant added — save the product to publish");

    navigate(returnPath, {
      state: buildReturnState(nextVariants, nextOptions),
    });
  };

  if (!isDraftProduct && loading) {
    return (
      <s-page heading="Add variant">
        <s-section>
          <PageLoader accessibilityLabel="Loading product" />
        </s-section>
      </s-page>
    );
  }

  if (!isDraftProduct && (error || !productSnapshot)) {
    return (
      <s-page heading="Add variant">
        <s-section>
          <s-banner tone="critical">{error || "Product not found"}</s-banner>
        </s-section>
      </s-page>
    );
  }

  if (isDraftProduct && !draftFromState) {
    return (
      <s-page heading="Add variant">
        <s-section>
          <s-banner tone="warning">
            Open add variant from the product page so your changes are kept.
          </s-banner>
        </s-section>
      </s-page>
    );
  }

  return (
    <s-page heading="Add variant">
      <s-button
        slot="breadcrumb-actions"
        accessibilityLabel="Product"
        onClick={handleCancel}
      />

      <s-query-container containerName="variant-editor">
        <div className="variant-editor-layout">
          <ProductVariantSidebar
            productTitle={productTitle}
            productStatus={productStatus}
            imageUrl={imageUrl}
            imageAlt={imageAlt}
            variants={initialVariants}
            activeVariantKey="new"
          />
          <div className="variant-editor-layout__main">
            <ProductVariantForm
              options={initialOptions}
              productTitle={productTitle}
              defaultPrice={
                initialVariants[0]?.price
                  ? String(initialVariants[0].price)
                  : ""
              }
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </s-query-container>
    </s-page>
  );
}
