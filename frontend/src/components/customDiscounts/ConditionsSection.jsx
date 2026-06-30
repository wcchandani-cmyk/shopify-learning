import React, { useState, useCallback, useMemo } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import "../../styles/CustomDiscountDetail.css";
import ConditionTypeSelect from "../shared/ConditionTypeSelect";
import ConditionOperatorSelect from "../shared/ConditionOperatorSelect";

const NUMERIC_TYPES = new Set([
  "total_amount",
  "subtotal_amount",
  "total_weight",
  "total_spend",
  "total_orders",
]);

const normalizeTags = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
};

const TagValueField = React.memo(function TagValueField({ value, onChange }) {
  const [draft, setDraft] = useState("");
  const tags = useMemo(() => normalizeTags(value), [value]);

  const addTag = useCallback(() => {
    const tag = draft.trim();
    if (!tag) return;
    const lowerTag = tag.toLowerCase();
    if (tags.some((t) => t.toLowerCase() === lowerTag)) {
      setDraft("");
      return;
    }
    onChange([...tags, tag]);
    setDraft("");
  }, [draft, tags, onChange]);

  const removeTag = useCallback((tag) => {
    onChange(tags.filter((t) => t !== tag));
  }, [tags, onChange]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  }, [addTag]);

  const handleInputChange = useCallback((e) => setDraft(e.target.value), []);

  return (
    <div>
      <div className="discount-generate-container">
        <div>
          <input
            type="text"
            className="discount-input-field"
            placeholder="Type a tag and press Enter (e.g. VIP)"
            value={draft}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button type="button" className="field-action-btn" onClick={addTag}>
          Add tag
        </button>
      </div>

      {tags.length > 0 && (
        <div className="shipping-method-list" style={{ marginTop: "8px" }}>
          {tags.map((tag) => (
            <div key={tag} className="shipping-method-chip">
              <span>{tag}</span>
              <button
                type="button"
                className="shipping-method-chip__remove"
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

const ConditionResourcesList = React.memo(function ConditionResourcesList({
  items = [],
  appliesTo,
  onRemove,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!items || items.length === 0) return null;

  const visibleItems = isExpanded ? items : items.slice(0, 3);

  return (
    <s-box padding-block-start="tight">
      <s-stack gap="tight">
        {visibleItems.map((item) => (
          <s-box
            key={item.id}
            padding="tight"
            border="base"
            border-radius="base"
            background="bg-surface"
          >
            <s-stack align="center" gap="tight">
              {item.image ? (
                <s-thumbnail
                  source={item.image}
                  alt={item.title}
                  size="small"
                />
              ) : (
                <s-box
                  background="bg-surface-secondary"
                  border="base"
                  border-radius="base"
                  padding="tight"
                >
                  <s-icon
                    type={appliesTo === "collection" ? "folder" : "image"}
                  />
                </s-box>
              )}
              <s-box grow="1">
                <s-text fontWeight="semibold">{item.title}</s-text>
              </s-box>
              <s-button
                variant="tertiary"
                tone="critical"
                icon="delete"
                accessibilityLabel="Remove item"
                onClick={() => onRemove(item)}
              />
            </s-stack>
          </s-box>
        ))}

        {items.length > 3 && (
          <s-button
            variant="plain"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Show less" : `Show all ${items.length} selected`}
          </s-button>
        )}
      </s-stack>
    </s-box>
  );
});

export default function ConditionsSection({
  conditions = [],
  onChangeConditions,
  combination = "all",
  onChangeCombination,
  functionType = "1",
}) {
  const shopify = useAppBridge();
  const [searchQueries, setSearchQueries] = useState({});

  const handleAddCondition = useCallback(() => {
    onChangeConditions([
      ...conditions,
      {
        type: "total_amount",
        operator: "greater_than_or_equals",
        value: "",
      },
    ]);
  }, [conditions, onChangeConditions]);

  const handleRemoveCondition = useCallback((index) => {
    const next = [...conditions];
    next.splice(index, 1);
    onChangeConditions(next);
  }, [conditions, onChangeConditions]);

  const handleConditionChange = useCallback((index, changes) => {
    const next = [...conditions];
    next[index] = { ...next[index], ...changes };
    onChangeConditions(next);
  }, [conditions, onChangeConditions]);

  const handleBrowse = useCallback(async (index, resourceType) => {
    try {
      const cond = conditions[index];
      const selectedItems = cond?.selectedItems || [];
      const initialSelectionIds = selectedItems.map(item => ({ id: item.id }));

      const selection = await shopify.resourcePicker({
        type: resourceType,
        multiple: true,
        selectionIds: initialSelectionIds,
      });

      if (selection && selection.length > 0) {
        const newItems = selection.map((item) => ({
          id: item.id,
          title: item.title,
          image: item.image?.src || item.image?.originalSrc || item.images?.[0]?.src || item.images?.[0]?.originalSrc || "",
        }));

        handleConditionChange(index, {
          value: newItems.map(item => item.id).join(","),
          valueLabel: newItems.map(item => item.title).join(", "),
          selectedItems: newItems,
        });
      }
    } catch (error) {
      console.error("Failed to open resource picker:", error);
    }
  }, [shopify, conditions, handleConditionChange]);

  const renderValueInput = useCallback((cond, idx) => {
    if (cond.type === "product" || cond.type === "collection") {
      const label = cond.type === "collection" ? "Collection" : "Product";
      const query = searchQueries[idx] || "";

      const value = cond.value || "";
      const valueLabel = cond.valueLabel || "";
      let selectedItems = cond.selectedItems || [];
      if (selectedItems.length === 0 && value) {
        const ids = value.split(",");
        const labels = valueLabel.split(", ");
        selectedItems = ids.map((id, index) => ({
          id,
          title: labels[index] || id,
          image: "",
        }));
      }

      const filteredItems = query.trim()
        ? selectedItems.filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
        : selectedItems;

      return (
        <s-stack gap="tight">
          <div className="search-browse-row" style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <div className="search-input-wrapper" style={{ flex: 1 }}>
              <input
                type="text"
                className="discount-input-field"
                placeholder={`Search ${label}`}
                value={query}
                onChange={(e) => setSearchQueries(prev => ({ ...prev, [idx]: e.target.value }))}
              />
            </div>
            <s-button onClick={() => handleBrowse(idx, cond.type)}>Browse</s-button>
          </div>

          <ConditionResourcesList
            items={filteredItems}
            appliesTo={cond.type}
            onRemove={(itemToRemove) => {
              const nextItems = selectedItems.filter(item => item.id !== itemToRemove.id);
              handleConditionChange(idx, {
                value: nextItems.map(item => item.id).join(","),
                valueLabel: nextItems.map(item => item.title).join(", "),
                selectedItems: nextItems,
              });
            }}
          />
        </s-stack>
      );
    }

    if (cond.type === "customer_tag") {
      return (
        <TagValueField
          value={cond.value}
          onChange={(tags) => handleConditionChange(idx, { value: tags })}
        />
      );
    }

    const isNumeric = NUMERIC_TYPES.has(cond.type);
    return (
      <s-text-field
        type={isNumeric ? "number" : "text"}
        label=""
        labelHidden
        placeholder={
          isNumeric
            ? "Enter a number (e.g. 100)"
            : "Enter value (e.g. VIP, SKU-ABC)"
        }
        value={cond.value ?? ""}
        onChange={(e) => handleConditionChange(idx, { value: e.target.value })}
      />
    );
  }, [handleBrowse, handleConditionChange, searchQueries]);

  const handleCombinationChangeAll = useCallback(() => onChangeCombination("all"), [onChangeCombination]);
  const handleCombinationChangeAny = useCallback(() => onChangeCombination("any"), [onChangeCombination]);

  return (
    <s-section heading="Conditions">
      <s-stack gap="base">
        <div className="radio-options-stack">
          <label className="radio-option-label">
            <input
              type="radio"
              name="conditionsCombination"
              checked={combination === "all"}
              onChange={handleCombinationChangeAll}
            />
            <span>All Below</span>
          </label>
          <label className="radio-option-label">
            <input
              type="radio"
              name="conditionsCombination"
              checked={combination === "any"}
              onChange={handleCombinationChangeAny}
            />
            <span>Any Below</span>
          </label>
        </div>

        {conditions.map((cond, idx) => (
          <div key={idx} className="condition-builder-row">
            <div className="condition-builder-fields-row">
              <div className="flex-1">
                <ConditionTypeSelect
                  source="discount"
                  value={cond.type}
                  showAddress={functionType === "2"}
                  onChange={(e) => {
                    const isNewNumeric = NUMERIC_TYPES.has(e.target.value);
                    handleConditionChange(idx, {
                      type: e.target.value,
                      operator: isNewNumeric ? "greater_than_or_equals" : "contains",
                      value: "",
                      valueLabel: "",
                    });
                  }}
                />
              </div>

              <div className="flex-1">
                <ConditionOperatorSelect
                  value={
                    NUMERIC_TYPES.has(cond.type)
                      ? (["greater_than_or_equals", "less_than_or_equals", "equals"].includes(cond.operator) ? cond.operator : "greater_than_or_equals")
                      : (["contains", "not_contains"].includes(cond.operator) ? cond.operator : "contains")
                  }
                  isNumeric={NUMERIC_TYPES.has(cond.type)}
                  onChange={(e) =>
                    handleConditionChange(idx, { operator: e.target.value })
                  }
                />
              </div>

              <button
                type="button"
                className="condition-builder-delete-btn"
                onClick={() => handleRemoveCondition(idx)}
                aria-label="Remove condition"
              >
                <s-icon type="delete" tone="critical" />
              </button>
            </div>

            <div>{renderValueInput(cond, idx)}</div>
          </div>
        ))}

        <s-button
          variant="primary"
          onClick={handleAddCondition}
          className="custom-action-btn"
        >
          Add condition
        </s-button>

        <s-paragraph tone="subdued">
          Conditions control when this discount applies. All conditions must be met unless you select "Any Below" above.
        </s-paragraph>
      </s-stack>
    </s-section>
  );
}
