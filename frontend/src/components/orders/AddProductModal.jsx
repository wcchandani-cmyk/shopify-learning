import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { listProducts } from "../../services/productService";
import { getInputEventValue, getCheckboxChecked } from "../../utils/fieldEvent";
import { formatMoney } from "../../utils/customerForm";
import { useOverlayModal } from "../../hooks/useOverlayModal";
import PageLoader from "../shared/PageLoader";
import ProductThumbnail from "../products/ProductThumbnail";

const ADD_PRODUCT_MODAL_ID = "add-product-modal";
const MAX_VARIANTS = 500;

const getAvailable = (product) =>
  (product.variants || []).reduce(
    (sum, variant) => sum + (Number(variant.inventoryQuantity) || 0),
    0
  );

const getPrice = (product) => parseFloat(product.variants?.[0]?.price) || 0;

export default function AddProductModal({ open, onClose, onAdd }) {
  const shopify = useAppBridge();
  const { modalRef, onAfterHide } = useOverlayModal(open, onClose);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState({});

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listProducts({ page: 1, limit: 50 })
      .then((data) => {
        setProducts(data?.products ?? []);
      })
      .catch((err) => {
        console.error("Failed to load products in modal:", err);
        shopify.toast.show("Failed to load products", { isError: true });
      })
      .finally(() => setLoading(false));
  }, [open, shopify.toast]);


  const toggleProduct = useCallback((id, checked) => {
    setSelectedIds((prev) => {
      const next = { ...prev };
      if (checked) next[id] = true;
      else delete next[id];
      return next;
    });
  }, []);

  const handleAddSelected = useCallback(() => {
    const items = products
      .filter((product) => selectedIds[product.id])
      .map((product) => {
        const variant = (product.variants || [])[0] || {};
        return {
          title: product.title,
          price: parseFloat(variant.price) || 0,
          quantity: 1,
          variantId: variant.shopifyId || variant.id,
          imageUrl: product.imageUrl || "",
          imageAlt: product.imageAlt || product.title,
          taxable: true,
          requiresShipping: true,
          isCustom: false,
        };
      })
      .filter((item) => item.variantId);

    onAdd(items);
    setSelectedIds({});
    onClose();
  }, [products, selectedIds, onAdd, onClose]);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return products;
    return products.filter((prod) => prod.title.toLowerCase().includes(q));
  }, [products, search]);

  const selectedCount = Object.keys(selectedIds).length;

  return (
    <s-modal
      id={ADD_PRODUCT_MODAL_ID}
      ref={modalRef}
      heading="Select products"
      onAfterHide={onAfterHide}
      width="large"
    >
      <s-stack gap="base">
        <s-text-field
          label="Search products"
          labelAccessibilityVisibility="exclusive"
          icon="search"
          placeholder="Search products"
          value={search}
          onInput={(event) => setSearch(getInputEventValue(event))}
        />

        {loading ? (
          <PageLoader accessibilityLabel="Loading products" />
        ) : filteredProducts.length === 0 ? (
          <p className="add-product-modal-empty-text">No products found.</p>
        ) : (
          <s-table>
            <s-table-header-row>
              <s-table-header listSlot="labeled" />
              <s-table-header listSlot="primary">Product</s-table-header>
              <s-table-header>Available</s-table-header>
              <s-table-header listSlot="secondary">Price</s-table-header>
            </s-table-header-row>

            <s-table-body>
              {filteredProducts.map((product) => {
                const checkboxId = `add-prod-${product.id}`;
                const checked = Boolean(selectedIds[product.id]);
                return (
                  <s-table-row key={product.id} clickDelegate={checkboxId}>
                    <s-table-cell>
                      <span onClick={(event) => event.stopPropagation()}>
                        <s-checkbox
                          id={checkboxId}
                          checked={checked}
                          onChange={(event) =>
                            toggleProduct(product.id, getCheckboxChecked(event))
                          }
                        />
                      </span>
                    </s-table-cell>
                    <s-table-cell>
                      <s-stack
                        direction="inline"
                        gap="small"
                        alignItems="center"
                      >
                        <ProductThumbnail
                          title={product.title}
                          imageUrl={product.imageUrl}
                          imageAlt={product.imageAlt}
                        />
                        <span>{product.title}</span>
                      </s-stack>
                    </s-table-cell>
                    <s-table-cell>
                      {getAvailable(product)} available
                    </s-table-cell>
                    <s-table-cell>
                      {formatMoney(getPrice(product), "USD")}
                    </s-table-cell>
                  </s-table-row>
                );
              })}
            </s-table-body>
          </s-table>
        )}
      </s-stack>

      <s-text slot="secondary-actions" color="subdued">
        {selectedCount}/{MAX_VARIANTS} variants selected
      </s-text>
      <s-button slot="secondary-actions" variant="tertiary" onClick={onClose}>
        Cancel
      </s-button>
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={handleAddSelected}
        {...(selectedCount > 0 ? {} : { disabled: true })}
      >
        Add
      </s-button>
    </s-modal>
  );
}
