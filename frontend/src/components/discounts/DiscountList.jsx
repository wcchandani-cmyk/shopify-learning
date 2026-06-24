import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useDiscounts } from "../../hooks/discount/useDiscounts";
import { useDiscountMutations } from "../../hooks/discount/useDiscountMutations";
import { getCheckboxChecked, getInputEventValue } from "../../utils/fieldEvent";
import { exclusiveFieldLabel } from "../../utils/formFields";
import PageLoader from "../shared/PageLoader";
import DiscountListBulkBar from "./DiscountListBulkBar";
import DiscountRow from "./DiscountRow";
import "../../styles/ProductList.css";
import "../../styles/DiscountDetail.css";

const SELECT_ALL_ID = "discount-list-select-all";

export default function DiscountList() {
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const modalRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pendingNavigationPathRef = useRef(null);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    if (isModalOpen) {
      modal.showOverlay?.();
    } else {
      modal.hideOverlay?.();
    }
  }, [isModalOpen]);

  const handleAfterHide = useCallback(
    (event) => {
      if (event.target === event.currentTarget) {
        setIsModalOpen(false);
        if (pendingNavigationPathRef.current) {
          navigate(pendingNavigationPathRef.current);
          pendingNavigationPathRef.current = null;
        }
      }
    },
    [navigate]
  );

  const handleExportClick = useCallback(() => {
    shopify.toast.show("Export discounts");
  }, [shopify]);

  const handleCreateDiscountClick = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const {
    discounts,
    pagination,
    loading,
    error,
    reload,
    goToPreviousPage,
    goToNextPage,
  } = useDiscounts();
  const { deleteDiscounts, deleting } = useDiscountMutations();

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());

  const matchesSearch = useCallback((discount, query) => {
    const queryLower = query.trim().toLowerCase();
    if (!queryLower) return true;
    const haystack = [
      discount.title,
      discount.summary,
      discount.method,
      discount.type,
      discount.eligibility,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(queryLower);
  }, []);

  const filteredDiscounts = useMemo(
    () => discounts.filter((discount) => matchesSearch(discount, search)),
    [discounts, search, matchesSearch]
  );


  const allFilteredSelected = useMemo(
    () =>
      filteredDiscounts.length > 0 &&
      filteredDiscounts.every((discount) => selectedIds.has(discount.id)),
    [filteredDiscounts, selectedIds]
  );

  const someFilteredSelected = useMemo(
    () =>
      filteredDiscounts.some((discount) => selectedIds.has(discount.id)) &&
      !allFilteredSelected,
    [filteredDiscounts, selectedIds, allFilteredSelected]
  );

  const toggleDiscount = useCallback((id, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAllFiltered = useCallback(
    (checked) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredDiscounts.forEach((discount) => {
          if (checked) {
            next.add(discount.id);
          } else {
            next.delete(discount.id);
          }
        });
        return next;
      });
    },
    [filteredDiscounts]
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectedCount = selectedIds.size;

  const handleDeleteSelected = useCallback(async () => {
    const ids = [...selectedIds];
    if (!ids.length || deleting) return;

    try {
      await deleteDiscounts(ids);
      shopify.toast.show(
        ids.length === 1 ? "Discount deleted" : `${ids.length} discounts deleted`
      );
      clearSelection();
      reload();
    } catch (err) {
      shopify.toast.show(err.message || "Could not delete discounts", {
        isError: true,
      });
    }
  }, [selectedIds, deleting, deleteDiscounts, shopify, clearSelection, reload]);

  const showEmpty = !loading && !error && filteredDiscounts.length === 0;
  const showList = !loading && !error && filteredDiscounts.length > 0;

  const searchField = (
    <s-text-field
      label="Search discounts"
      {...exclusiveFieldLabel}
      icon="search"
      placeholder="Search and filter"
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

  return (
    <s-page heading="Discounts">
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={handleCreateDiscountClick}
      >
        Create discount
      </s-button>
      <s-button
        slot="secondary-actions"
        icon="export"
        onClick={handleExportClick}
      >
        Export
      </s-button>

      <DiscountListBulkBar
        selectedCount={selectedCount}
        deleting={deleting}
        onDelete={handleDeleteSelected}
        onClearSelection={clearSelection}
      />

      {error && (
        <s-section>
          <s-banner tone="critical" heading="Could not load discounts">
            {error}
          </s-banner>
        </s-section>
      )}

      {loading && (
        <s-section>
          <PageLoader accessibilityLabel="Loading discounts" />
        </s-section>
      )}

      {showEmpty && (
        <s-section accessibilityLabel="Empty discounts state">
          <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
            <s-grid justifyItems="center" maxInlineSize="450px" gap="base">
              <s-stack alignItems="center">
                <s-heading>No discounts found</s-heading>
                <s-paragraph>
                  {search
                    ? "Try a different search term or clear the search field."
                    : "Create discounts in Shopify to sync them here."}
                </s-paragraph>
              </s-stack>
            </s-grid>
          </s-grid>
        </s-section>
      )}

      {showList && (
        <s-query-container containerName="discounts-list">
          <div className="product-list-desktop">
            <div className="products-table-host">
              <s-stack>
                <s-section padding="none" accessibilityLabel="Discounts table">
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
                        Title
                      </s-table-header>
                      <s-table-header>Status</s-table-header>
                      <s-table-header>Method</s-table-header>
                      <s-table-header>Eligibility</s-table-header>
                      <s-table-header>Type</s-table-header>
                      <s-table-header>Combinations</s-table-header>
                      <s-table-header style={{ textAlign: "right", paddingRight: "12px" }}>
                        Used
                      </s-table-header>
                    </s-table-header-row>

                    <s-table-body>
                      {filteredDiscounts.map((discount) => (
                        <DiscountRow
                          key={discount.id}
                          discount={discount}
                          selected={selectedIds.has(discount.id)}
                          onSelectedChange={toggleDiscount}
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

      <s-modal
        id="select-discount-type-modal"
        ref={modalRef}
        heading="Select discount type"
        onAfterHide={handleAfterHide}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          
          <div
            className="discount-type-option"
            onClick={() => {
              pendingNavigationPathRef.current = "/discounts/new/amount-off-product";
              setIsModalOpen(false);
            }}
          >
            <div className="discount-type-option__left">
              <div className="discount-type-option__icon-container">
                <s-icon type="discount" />
              </div>
              <div className="discount-type-option__content">
                <div className="discount-type-option__title">Amount off products</div>
                <div className="discount-type-option__desc">Discount specific products or collections of products</div>
              </div>
            </div>
            <div className="discount-type-option__chevron">
              <s-icon type="chevron-right" />
            </div>
          </div>

          <div
            className="discount-type-option"
            onClick={() => {
              pendingNavigationPathRef.current = "/discounts/new/buy-x-get-y";
              setIsModalOpen(false);
            }}
          >
            <div className="discount-type-option__left">
              <div className="discount-type-option__icon-container">
                <s-icon type="gift-card" />
              </div>
              <div className="discount-type-option__content">
                <div className="discount-type-option__title">Buy X get Y</div>
                <div className="discount-type-option__desc">Discount specific products or collections of products</div>
              </div>
            </div>
            <div className="discount-type-option__chevron">
              <s-icon type="chevron-right" />
            </div>
          </div>

          <div
            className="discount-type-option"
            onClick={() => {
              pendingNavigationPathRef.current = "/discounts/new/amount-off-order";
              setIsModalOpen(false);
            }}
          >
            <div className="discount-type-option__left">
              <div className="discount-type-option__icon-container">
                <s-icon type="order" />
              </div>
              <div className="discount-type-option__content">
                <div className="discount-type-option__title">Amount off order</div>
                <div className="discount-type-option__desc">Discount the total order amount</div>
              </div>
            </div>
            <div className="discount-type-option__chevron">
              <s-icon type="chevron-right" />
            </div>
          </div>

          <div
            className="discount-type-option"
            onClick={() => {
              pendingNavigationPathRef.current = "/discounts/new/free-shipping";
              setIsModalOpen(false);
            }}
          >
            <div className="discount-type-option__left">
              <div className="discount-type-option__icon-container">
                <s-icon type="delivery" />
              </div>
              <div className="discount-type-option__content">
                <div className="discount-type-option__title">Free shipping</div>
                <div className="discount-type-option__desc">Offer free shipping on an order</div>
              </div>
            </div>
            <div className="discount-type-option__chevron">
              <s-icon type="chevron-right" />
            </div>
          </div>

        </div>

        <s-button
          slot="secondary-actions"
          onClick={() => setIsModalOpen(false)}
        >
          Cancel
        </s-button>
      </s-modal>
    </s-page>
  );
}
