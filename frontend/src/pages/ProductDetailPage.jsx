import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PageLoader from "../components/PageLoader";
import ProductDetail from "../components/products/ProductDetail";
import { useCatalogProductTypes } from "../hooks/useCatalogProductTypes";
import { useProduct } from "../hooks/useProduct";
import { EMPTY_PRODUCT } from "../utils/productForm";
import { normalizeProductTypes } from "../utils/productTypes";

export default function ProductDetailPage() {
  const { id } = useParams();
  const isNew = id === "new";
  const location = useLocation();
  const navigate = useNavigate();

  const { product, loading, error } = useProduct(isNew ? null : id);

  const seedTypes = useMemo(
    () =>
      normalizeProductTypes(
        location.state?.productTypes,
        product?.availableProductTypes,
        product?.productType
      ),
    [
      location.state?.productTypes,
      product?.availableProductTypes,
      product?.productType,
    ]
  );

  const { types: catalogTypes } = useCatalogProductTypes(seedTypes);

  const productTypes = useMemo(
    () => normalizeProductTypes(location.state?.productTypes, catalogTypes),
    [location.state?.productTypes, catalogTypes]
  );

  const handleSaved = () => {
    navigate("/products", {
      replace: true,
      state: { productTypes: catalogTypes },
    });
  };

  if (isNew) {
    return (
      <ProductDetail
        isNew
        product={EMPTY_PRODUCT}
        productTypes={productTypes}
        onBack={() => navigate("/products")}
        onSaved={handleSaved}
      />
    );
  }

  if (loading) {
    return (
      <s-page heading="Product details">
        <s-button
          slot="breadcrumb-actions"
          accessibilityLabel="Products"
          onClick={() => navigate("/products")}
        />

        <s-section>
          <PageLoader accessibilityLabel="Loading product" />
        </s-section>
      </s-page>
    );
  }

  if (error || !product) {
    return (
      <s-page heading="Product details">
        <s-button
          slot="breadcrumb-actions"
          accessibilityLabel="Products"
          onClick={() => navigate("/products")}
        />

        <s-section>
          <s-banner tone="critical" heading="Could not load product">
            {error || "Product not found"}
          </s-banner>
        </s-section>
      </s-page>
    );
  }

  return (
    <ProductDetail
      product={product}
      productTypes={productTypes}
      onBack={() => navigate("/products")}
      onSaved={handleSaved}
    />
  );
}
