import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useProductMutations } from "../../hooks/useProductMutations";
import { useProductSelection } from "../../hooks/useProductSelection";
import { useProducts } from "../../hooks/useProducts";
import { getCheckboxChecked, getInputEventValue } from "../../utils/fieldEvent";
import { exclusiveFieldLabel } from "../../utils/formFields";
import { matchesProductSearch } from "../../utils/productDisplay";
import PageLoader from "../PageLoader";
import ProductListBulkBar from "./ProductListBulkBar";
import ProductListCard from "./ProductListCard";
import ProductListPagination from "./ProductListPagination";
import ProductRow from "./ProductRow";
import "../../styles/ProductList.css";

const SELECT_ALL_ID = "product-list-select-all";

export default function ProductList() {
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const { deleteProducts, deleting } = useProductMutations();
  const {
    products,
    productTypes,
    pagination,
    loading,
    error,
    reload,
    goToPreviousPage,
    goToNextPage,
  } = useProducts();
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(
    () => products.filter((product) => matchesProductSearch(product, search)),
    [products, search]
  );

  const {
    selectedCount,
    allFilteredSelected,
    someFilteredSelected,
    toggleProduct,
    toggleSelectAllFiltered,
    clearSelection,
    isSelected,
    getSelectedIds,
  } = useProductSelection(filteredProducts);

  const handleDeleteSelected = useCallback(async () => {
    const ids = getSelectedIds();
    if (!ids.length || deleting) return;

    try {
      await deleteProducts(ids);
      shopify.toast.show(
        ids.length === 1 ? "Product deleted" : `${ids.length} products deleted`
      );
      clearSelection();
      reload();
    } catch (err) {
      shopify.toast.show(err.message || "Could not delete products", {
        isError: true,
      });
    }
  }, [
    getSelectedIds,
    deleting,
    shopify,
    clearSelection,
    reload,
    deleteProducts,
  ]);

  const handleAddProduct = useCallback(() => {
    navigate("/products/new", { state: { productTypes } });
  }, [navigate, productTypes]);

  const showEmpty = !loading && !error && filteredProducts.length === 0;
  const showList = !loading && !error && filteredProducts.length > 0;

  const searchField = (
    <s-text-field
      label="Search products"
      {...exclusiveFieldLabel}
      icon="search"
      placeholder="Search by title, vendor, or type"
      value={search}
      onInput={(event) => setSearch(getInputEventValue(event))}
    />
  );

  const selectAllCheckbox = (id) => (
    <s-checkbox
      id={id}
      checked={allFilteredSelected}
      indeterminate={someFilteredSelected}
      onChange={(event) => toggleSelectAllFiltered(getCheckboxChecked(event))}
    />
  );

  const productListProps = (product) => ({
    product,
    productTypes,
    selected: isSelected(product.id),
    onSelectedChange: toggleProduct,
  });

  return (
    <s-page heading="Products">
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={handleAddProduct}
      >
        Add product
      </s-button>

      <ProductListBulkBar
        selectedCount={selectedCount}
        deleting={deleting}
        onDelete={handleDeleteSelected}
        onClearSelection={clearSelection}
      />

      {error && (
        <s-section>
          <s-banner tone="critical" heading="Could not load products">
            {error}
          </s-banner>
        </s-section>
      )}

      {loading && (
        <s-section>
          <PageLoader accessibilityLabel="Loading products" />
        </s-section>
      )}

      {showEmpty && (
        <s-section accessibilityLabel="Empty products state">
          <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
            <s-grid justifyItems="center" maxInlineSize="450px" gap="base">
              <s-stack alignItems="center">
                <s-heading>No products found</s-heading>
                <s-paragraph>
                  {search
                    ? "Try a different search term or clear the search field."
                    : "Sync products from Shopify to load images and inventory, or add a new product."}
                </s-paragraph>
              </s-stack>
              <s-button variant="primary" onClick={handleAddProduct}>
                Add product
              </s-button>
            </s-grid>
          </s-grid>
        </s-section>
      )}

      {showList && (
        <s-query-container containerName="products-list">
          <div className="product-list-mobile" aria-label="Products list">
            <div className="product-list-mobile__inner">
              <div className="product-list-mobile__search">{searchField}</div>
              <div className="product-list-mobile__select-all">
                <s-stack direction="inline" gap="small" alignItems="center">
                  {selectAllCheckbox(`${SELECT_ALL_ID}-mobile`)}
                  <s-text>Select all on this page</s-text>
                </s-stack>
              </div>
              <div className="product-list-mobile__items">
                {filteredProducts.map((product) => (
                  <ProductListCard
                    key={product.id}
                    {...productListProps(product)}
                  />
                ))}
              </div>
              <ProductListPagination
                pagination={pagination}
                onPreviousPage={goToPreviousPage}
                onNextPage={goToNextPage}
              />
            </div>
          </div>

          <div className="product-list-desktop">
            <div className="products-table-host">
              <s-stack>
                <s-section padding="none" accessibilityLabel="Products table">
                  <s-table
                    paginate={Boolean(pagination)}
                    hasPreviousPage={pagination?.hasPreviousPage}
                    hasNextPage={pagination?.hasNextPage}
                    onPreviousPage={goToPreviousPage}
                    onNextPage={goToNextPage}
                    paginationLabel={
                      pagination
                        ? `Page ${pagination.page} of ${pagination.totalPages}`
                        : ""
                    }
                  >
                    <s-grid
                      slot="filters"
                      gap="small-200"
                      gridTemplateColumns="1fr"
                    >
                      {searchField}
                    </s-grid>

                    <s-table-header-row>
                      <s-table-header listSlot="labeled">
                        {selectAllCheckbox(SELECT_ALL_ID)}
                      </s-table-header>
                      <s-table-header listSlot="primary">
                        Product
                      </s-table-header>
                      <s-table-header>Status</s-table-header>
                      <s-table-header>Inventory</s-table-header>
                      <s-table-header>Product type</s-table-header>
                      <s-table-header listSlot="secondary">
                        Vendor
                      </s-table-header>
                    </s-table-header-row>

                    <s-table-body>
                      {filteredProducts.map((product) => (
                        <ProductRow
                          key={product.id}
                          {...productListProps(product)}
                        />
                      ))}
                    </s-table-body>
                  </s-table>
                </s-section>
              </s-stack>
            </div>
          </div>
        </s-query-container>
      )}
    </s-page>
  );
}
