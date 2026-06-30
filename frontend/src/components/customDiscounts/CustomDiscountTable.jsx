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
  const handleDelete = useCallback(
    () => onDelete?.(row.id),
    [row.id, onDelete]
  );

  return (
    <s-table-row>
      <s-table-cell>
        <s-button variant="plain" onClick={handleEdit}>
          {row.title}
        </s-button>
      </s-table-cell>
      <s-table-cell>{row.campaign}</s-table-cell>
      <s-table-cell>{row.type}</s-table-cell>
      <s-table-cell>
        <s-badge tone={row.method === "Code" ? "info" : "default"}>
          {row.method}
        </s-badge>
      </s-table-cell>
      <s-table-cell>
        {row.code === "-" ? (
          <s-text tone="subdued">—</s-text>
        ) : (
          <s-text>{row.code}</s-text>
        )}
      </s-table-cell>
      <s-table-cell>
        <s-switch
          label={`Status: ${row.status}`}
          labelAccessibilityVisibility="exclusive"
          checked={row.isActive || undefined}
          onClick={() => onToggleStatus?.(row.id, row.status)}
        />
      </s-table-cell>
      <s-table-cell>
        <s-button-group gap="tight">
          <s-button
            variant="tertiary"
            icon="edit"
            accessibilityLabel="Edit discount"
            onClick={handleEdit}
          />
          <s-button
            variant="tertiary"
            tone="critical"
            icon="delete"
            accessibilityLabel="Delete discount"
            onClick={handleDelete}
          />
        </s-button-group>
      </s-table-cell>
    </s-table-row>
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

  return (
    <div className="cd-table-card">
      <s-table variant="auto">
        <s-table-header-row>
          <s-table-header>Title</s-table-header>
          <s-table-header>Campaign</s-table-header>
          <s-table-header>Discount Type</s-table-header>
          <s-table-header>Discount Method</s-table-header>
          <s-table-header>Discount Code</s-table-header>
          <s-table-header>Status</s-table-header>
          <s-table-header>Action</s-table-header>
        </s-table-header-row>
        <s-table-body>
          {rows.map((row) => (
            <CustomDiscountRow
              key={row.id}
              row={row}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleStatus={onToggleStatus}
            />
          ))}
        </s-table-body>
      </s-table>

      <div className="cd-table-footer">
        <s-text tone="subdued">
          {total} {total === 1 ? "item" : "items"}
        </s-text>

        <div className="cd-footer-pager">
          <s-text tone="subdued">
            Page {page}/{totalPages}
          </s-text>

          <s-button-group gap="tight">
            <s-button
              variant="tertiary"
              icon="chevron-left"
              accessibilityLabel="Previous page"
              disabled={!pagination?.hasPreviousPage || undefined}
              onClick={onPreviousPage}
            />
            <s-button
              variant="tertiary"
              icon="chevron-right"
              accessibilityLabel="Next page"
              disabled={!pagination?.hasNextPage || undefined}
              onClick={onNextPage}
            />
          </s-button-group>

          <s-stack direction="inline" gap="tight" alignItems="center">
            <s-text tone="subdued">Go to</s-text>
            <s-box inlineSize="80px">
              <s-text-field
                label="Page number"
                labelAccessibilityVisibility="exclusive"
                type="number"
                min={1}
                max={totalPages}
                value={gotoValue}
                placeholder={String(page)}
                onInput={(e) => setGotoValue(e.target.value)}
                onBlur={handleGoto}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleGoto();
                }}
              />
            </s-box>
            <s-text tone="subdued">Page</s-text>
          </s-stack>
        </div>
      </div>
    </div>
  );
}
