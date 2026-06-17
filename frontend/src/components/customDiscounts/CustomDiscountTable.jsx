import React, { useState, useCallback, useMemo } from "react";
import {
  FUNCTION_TYPE_LABELS,
  CAMPAIGN_LABELS,
} from "../../constants/customDiscounts";
import "../../styles/CustomDiscountTable.css";

const parseConfiguration = (raw) => {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const extractShopifyDiscountId = (item) =>
  item.shopifyId ? item.shopifyId.split("/").pop() : null;

const toRow = (item) => {
  const config = parseConfiguration(item.configuration);
  return {
    id: extractShopifyDiscountId(item),
    title: item.title || "Untitled discount",
    campaign: CAMPAIGN_LABELS[config.campaignType] || "—",
    type: FUNCTION_TYPE_LABELS[item.functionType] || "Discount",
    method: item.method || "Automatic",
    code: item.method === "Code" && config.code ? config.code : "-",
    isActive: (item.status || "").toLowerCase() === "active",
    status: item.status || "active",
  };
};

const CustomDiscountRow = React.memo(function CustomDiscountRow({
  row,
  onEdit,
  onDelete,
  onToggleStatus,
}) {
  const handleEdit = useCallback(() => onEdit?.(row.id), [row.id, onEdit]);
  const handleDelete = useCallback(() => onDelete?.(row.id), [row.id, onDelete]);
  const handleToggle = useCallback(() => onToggleStatus?.(row.id, row.status), [row.id, row.status, onToggleStatus]);

  const handleToggleKeyDown = useCallback((e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggleStatus?.(row.id, row.status);
    }
  }, [row.id, row.status, onToggleStatus]);

  return (
    <tr>
      <td>
        <span
          className="cd-title-link"
          onClick={handleEdit}
        >
          {row.title}
        </span>
      </td>
      <td>{row.campaign}</td>
      <td>{row.type}</td>
      <td>
        <span
          className={`cd-method-badge ${
            row.method === "Code" ? "cd-method-badge--code" : ""
          }`}
        >
          {row.method}
        </span>
      </td>
      <td className={row.code === "-" ? "cd-muted" : ""}>{row.code}</td>
      <td>
        <span
          className={`cd-status-toggle ${row.isActive ? "is-on" : ""}`}
          role="button"
          tabIndex={0}
          aria-label={`Toggle status: currently ${row.status}`}
          title={row.isActive ? "Click to deactivate" : "Click to activate"}
          onClick={handleToggle}
          onKeyDown={handleToggleKeyDown}
        >
          <span className="cd-status-toggle__knob" />
        </span>
      </td>
      <td className="cd-col-action">
        <span className="cd-actions">
          <button
            type="button"
            className="cd-icon-btn"
            aria-label="Edit discount"
            onClick={handleEdit}
          >
            <s-icon type="edit" />
          </button>
          <button
            type="button"
            className="cd-icon-btn cd-icon-btn--danger"
            aria-label="Delete discount"
            onClick={handleDelete}
          >
            <s-icon type="delete" tone="critical" />
          </button>
        </span>
      </td>
    </tr>
  );
});

export default function CustomDiscountTable({
  items,
  pagination,
  onEdit,
  onDelete,
  onToggleStatus,
  onPreviousPage,
  onNextPage,
  onGoToPage,
}) {
  const [gotoValue, setGotoValue] = useState("");
  const rows = useMemo(() => items.map(toRow), [items]);

  const page = pagination?.page || 1;
  const totalPages = pagination?.totalPages || 1;
  const total = pagination?.total ?? rows.length;

  const handleGoto = useCallback(() => {
    const target = parseInt(gotoValue, 10);
    if (!Number.isNaN(target) && target >= 1 && target <= totalPages) {
      onGoToPage?.(target);
    }
    setGotoValue("");
  }, [gotoValue, totalPages, onGoToPage]);

  const handleGotoChange = useCallback((e) => setGotoValue(e.target.value), []);

  const handleGotoKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      handleGoto();
    }
  }, [handleGoto]);

  return (
    <div className="cd-table-card">
      <table className="cd-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Campaign</th>
            <th>Discount Type</th>
            <th>Discount Method</th>
            <th>Discount Code</th>
            <th>Status</th>
            <th className="cd-col-action">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <CustomDiscountRow
              key={row.id}
              row={row}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleStatus={onToggleStatus}
            />
          ))}
        </tbody>
      </table>

      <div className="cd-table-footer">
        <span className="cd-footer-count">
          {total} {total === 1 ? "item" : "items"}
        </span>

        <div className="cd-footer-pager">
          <span className="cd-page-indicator">
            Page {page}/{totalPages}
          </span>

          <span className="cd-pager-arrows">
            <button
              type="button"
              className="cd-pager-arrow"
              aria-label="Previous page"
              disabled={!pagination?.hasPreviousPage}
              onClick={onPreviousPage}
            >
              <s-icon type="chevron-left" />
            </button>
            <button
              type="button"
              className="cd-pager-arrow"
              aria-label="Next page"
              disabled={!pagination?.hasNextPage}
              onClick={onNextPage}
            >
              <s-icon type="chevron-right" />
            </button>
          </span>

          <span className="cd-goto">
            Go to
            <input
              type="number"
              min={1}
              max={totalPages}
              value={gotoValue}
              placeholder={String(page)}
              onChange={handleGotoChange}
              onKeyDown={handleGotoKeyDown}
              onBlur={handleGoto}
            />
            Page
          </span>
        </div>
      </div>
    </div>
  );
}
