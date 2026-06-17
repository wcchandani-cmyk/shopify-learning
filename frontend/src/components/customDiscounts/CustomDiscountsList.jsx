import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  listCustomDiscounts,
  deleteCustomDiscounts,
  toggleCustomDiscountStatus,
} from "../../services/customDiscountService";
import PageLoader from "../PageLoader";
import CustomDiscountTable from "./CustomDiscountTable";
import "../../styles/ProductList.css";
import "../../styles/CustomDiscountDetail.css";
import "../../styles/CustomDiscountTable.css";

const PAGE_SIZE = 10;

export default function CustomDiscountsList() {
  const navigate = useNavigate();
  const shopify = useAppBridge();

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [customDiscounts, setCustomDiscounts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const fetchCustomDiscounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await shopify.idToken();
      const res = await listCustomDiscounts({ page, limit: PAGE_SIZE }, token);
      setCustomDiscounts(res.customizations || res.customDiscounts || []);
      setPagination(res.pagination || null);
    } catch (err) {
      setError(err.message || "Failed to load custom discounts");
    } finally {
      setLoading(false);
    }
  }, [shopify, page]);

  useEffect(() => {
    fetchCustomDiscounts();
  }, [fetchCustomDiscounts]);

  const matchesSearch = useCallback((item, query) => {
    const queryLower = query.trim().toLowerCase();
    if (!queryLower) return true;
    const haystack = [item.title, item.method, item.status]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(queryLower);
  }, []);

  const filteredCustomDiscounts = useMemo(
    () => customDiscounts.filter((item) => matchesSearch(item, search)),
    [customDiscounts, search, matchesSearch]
  );

  const handleEdit = useCallback(
    (id) => navigate(`/custom-discounts/${id}`),
    [navigate]
  );

  const handleDelete = useCallback(
    async (id) => {
      if (deleting) return;
      const confirmed = window.confirm(
        "Are you sure you want to delete this custom discount?"
      );
      if (!confirmed) return;

      setDeleting(true);
      try {
        const token = await shopify.idToken();
        await deleteCustomDiscounts([id], token);
        shopify.toast.show("Custom discount deleted");
        fetchCustomDiscounts();
      } catch (err) {
        shopify.toast.show(err.message || "Could not delete custom discount", {
          isError: true,
        });
      } finally {
        setDeleting(false);
      }
    },
    [deleting, shopify, fetchCustomDiscounts]
  );

  const handleToggleStatus = useCallback(
    async (id, currentStatus) => {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      // Optimistic update in the list
      setCustomDiscounts((prev) =>
        prev.map((item) => {
          const tail = item.shopifyId ? item.shopifyId.split("/").pop() : null;
          return tail === String(id) ? { ...item, status: newStatus } : item;
        })
      );
      try {
        const token = await shopify.idToken();
        await toggleCustomDiscountStatus(id, newStatus, token);
        shopify.toast.show(
          newStatus === "active" ? "Discount activated" : "Discount deactivated"
        );
      } catch (err) {
        // Revert on error
        setCustomDiscounts((prev) =>
          prev.map((item) => {
            const tail = item.shopifyId
              ? item.shopifyId.split("/").pop()
              : null;
            return tail === String(id) ? { ...item, status: currentStatus } : item;
          })
        );
        shopify.toast.show(
          err.message || "Could not update discount status",
          { isError: true }
        );
      }
    },
    [shopify]
  );

  const goToPage = useCallback(
    (target) => {
      if (target !== page) setPage(target);
    },
    [page]
  );

  const showList = !loading && !error && filteredCustomDiscounts.length > 0;
  const showEmpty = !loading && !error && filteredCustomDiscounts.length === 0;

  return (
    <s-page heading="Custom Discounts">
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={() => navigate("/custom-discounts/new")}
      >
        Add discount
      </s-button>

      {error && (
        <s-section>
          <s-banner tone="critical" heading="Could not load custom discounts">
            {error}
          </s-banner>
        </s-section>
      )}

      {loading && (
        <s-section>
          <PageLoader accessibilityLabel="Loading custom discounts" />
        </s-section>
      )}

      {!loading && !error && (
        <>
          <s-section padding="none">
            <div className="cd-search-bar">
              <input
                className="cd-search-input"
                type="text"
                placeholder="Search by title, method, status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="cd-search-clear" onClick={() => setSearch("")} aria-label="Clear search">
                  ×
                </button>
              )}
            </div>
          </s-section>

          {showEmpty && (
            <s-section>
              <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
                <s-stack alignItems="center">
                  <s-heading>No custom discounts found</s-heading>
                  <s-paragraph>
                    {search
                      ? "Try a different search term."
                      : "Click 'Add discount' to create your first custom discount."}
                  </s-paragraph>
                </s-stack>
              </s-grid>
            </s-section>
          )}

          {showList && (
            <s-section padding="none">
              <CustomDiscountTable
                items={filteredCustomDiscounts}
                pagination={pagination}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                onPreviousPage={() => goToPage(Math.max(1, page - 1))}
                onNextPage={() => goToPage(page + 1)}
                onGoToPage={goToPage}
              />
            </s-section>
          )}
        </>
      )}
    </s-page>
  );
}
