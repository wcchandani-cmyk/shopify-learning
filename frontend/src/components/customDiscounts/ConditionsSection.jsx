import React, { useState, useCallback, useMemo } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useChoiceList } from "../../hooks/useChoiceList";
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
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const TagValueField = React.memo(function TagValueField({ value, onChange }) {
  const [draft, setDraft] = useState("");
  const tags = useMemo(() => normalizeTags(value), [value]);

  const addTag = useCallback(() => {
    const tag = draft.trim();
    if (!tag) return;
    const lowerTag = tag.toLowerCase();
    if (tags.some((tagItem) => tagItem.toLowerCase() === lowerTag)) {
      setDraft("");
      return;
    }
    onChange([...tags, tag]);
    setDraft("");
  }, [draft, tags, onChange]);

  const removeTag = useCallback(
    (tag) => {
      onChange(tags.filter((tagItem) => tagItem !== tag));
    },
    [tags, onChange]
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        addTag();
      }
    },
    [addTag]
  );

  return (
    <s-stack gap="tight">
      <s-stack direction="inline" gap="base" alignItems="end">
        <s-box grow="1">
          <s-text-field
            label="Tag"
            labelAccessibilityVisibility="exclusive"
            placeholder="Type a tag and press Enter (e.g. VIP)"
            value={draft}
            onInput={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
          />
        </s-box>
        <s-button variant="secondary" onClick={addTag}>
          Add tag
        </s-button>
      </s-stack>

      {tags.length > 0 && (
        <s-stack direction="inline" gap="tight" wrap>
          {tags.map((tag) => (
            <s-clickable-chip
              key={tag}
              removable
              accessibilityLabel={tag}
              onRemove={() => removeTag(tag)}
            >
              {tag}
            </s-clickable-chip>
          ))}
        </s-stack>
      )}
    </s-stack>
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
            borderRadius="base"
            background="bg-surface"
          >
            <s-stack direction="inline" alignItems="center" gap="tight">
              {item.image ? (
                <s-thumbnail
                  src={item.image}
                  alt={item.title}
                  size="small"
                />
              ) : (
                <s-box
                  background="bg-surface-secondary"
                  border="base"
                  borderRadius="base"
                  padding="tight"
                >
                  <s-icon
                    type={appliesTo === "collection" ? "folder" : "image"}
                  />
                </s-box>
              )}
              <s-box grow="1">
                <s-text type="strong">{item.title}</s-text>
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
  const combinationRef = useChoiceList(combination, onChangeCombination);

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

  const handleRemoveCondition = useCallback(
    (index) => {
      const next = [...conditions];
      next.splice(index, 1);
      onChangeConditions(next);
    },
    [conditions, onChangeConditions]
  );

  const handleConditionChange = useCallback(
    (index, changes) => {
      const next = [...conditions];
      next[index] = { ...next[index], ...changes };
      onChangeConditions(next);
    },
    [conditions, onChangeConditions]
  );

  const handleBrowse = useCallback(
    async (index, resourceType) => {
      try {
        const cond = conditions[index];
        const selectedItems = cond?.selectedItems || [];
        const initialSelectionIds = selectedItems.map((item) => ({
          id: item.id,
        }));

        const selection = await shopify.resourcePicker({
          type: resourceType,
          multiple: true,
          selectionIds: initialSelectionIds,
        });

        if (selection && selection.length > 0) {
          const newItems = selection.map((item) => ({
            id: item.id,
            title: item.title,
            image:
              item.image?.src ||
              item.image?.originalSrc ||
              item.images?.[0]?.src ||
              item.images?.[0]?.originalSrc ||
              "",
          }));

          handleConditionChange(index, {
            value: newItems.map((item) => item.id).join(","),
            valueLabel: newItems.map((item) => item.title).join(", "),
            selectedItems: newItems,
          });
        }
      } catch (error) {
        console.error("Failed to open resource picker:", error);
      }
    },
    [shopify, conditions, handleConditionChange]
  );

  const renderValueInput = useCallback(
    (cond, idx) => {
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
          ? selectedItems.filter((item) =>
              item.title.toLowerCase().includes(query.toLowerCase())
            )
          : selectedItems;

        return (
          <s-stack gap="tight">
            <s-stack direction="inline" gap="base" alignItems="end">
              <s-box grow="1">
                <s-text-field
                  label={`Search ${label}`}
                  labelAccessibilityVisibility="exclusive"
                  placeholder={`Search ${label}`}
                  value={query}
                  onInput={(e) =>
                    setSearchQueries((prev) => ({
                      ...prev,
                      [idx]: e.target.value,
                    }))
                  }
                />
              </s-box>
              <s-button onClick={() => handleBrowse(idx, cond.type)}>
                Browse
              </s-button>
            </s-stack>

            <ConditionResourcesList
              items={filteredItems}
              appliesTo={cond.type}
              onRemove={(itemToRemove) => {
                const nextItems = selectedItems.filter(
                  (item) => item.id !== itemToRemove.id
                );
                handleConditionChange(idx, {
                  value: nextItems.map((item) => item.id).join(","),
                  valueLabel: nextItems
                    .map((item) => item.title)
                    .join(", "),
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
          label="Value"
          labelAccessibilityVisibility="exclusive"
          placeholder={
            isNumeric
              ? "Enter a number (e.g. 100)"
              : "Enter value (e.g. VIP, SKU-ABC)"
          }
          value={cond.value ?? ""}
          onInput={(e) =>
            handleConditionChange(idx, { value: e.target.value })
          }
        />
      );
    },
    [handleBrowse, handleConditionChange, searchQueries]
  );

  return (
    <s-section heading="Conditions">
      <s-stack gap="base">
        <s-choice-list
          ref={combinationRef}
          name="conditionsCombination"
          values={[combination]}
        >
          <s-choice value="all">All Below</s-choice>
          <s-choice value="any">Any Below</s-choice>
        </s-choice-list>

        {conditions.map((cond, idx) => (
          <s-box key={idx} border="base" borderRadius="base" padding="base">
            <s-stack gap="base">
              <s-grid
                gap="base"
                gridTemplateColumns="1fr 1fr auto"
              >
                <ConditionTypeSelect
                  source="discount"
                  value={cond.type}
                  showAddress={functionType === "2"}
                  onChange={(e) => {
                    const isNewNumeric = NUMERIC_TYPES.has(e.target.value);
                    handleConditionChange(idx, {
                      type: e.target.value,
                      operator: isNewNumeric
                        ? "greater_than_or_equals"
                        : "contains",
                      value: "",
                      valueLabel: "",
                    });
                  }}
                />

                <ConditionOperatorSelect
                  value={
                    NUMERIC_TYPES.has(cond.type)
                      ? [
                          "greater_than_or_equals",
                          "less_than_or_equals",
                          "equals",
                        ].includes(cond.operator)
                        ? cond.operator
                        : "greater_than_or_equals"
                      : ["contains", "not_contains"].includes(cond.operator)
                      ? cond.operator
                      : "contains"
                  }
                  isNumeric={NUMERIC_TYPES.has(cond.type)}
                  onChange={(e) =>
                    handleConditionChange(idx, { operator: e.target.value })
                  }
                />

                <s-button
                  variant="tertiary"
                  tone="critical"
                  icon="delete"
                  accessibilityLabel="Remove condition"
                  onClick={() => handleRemoveCondition(idx)}
                />
              </s-grid>

              <div>{renderValueInput(cond, idx)}</div>
            </s-stack>
          </s-box>
        ))}

        <div>
          <s-button variant="primary" onClick={handleAddCondition}>
            Add condition
          </s-button>
        </div>

        <s-paragraph tone="subdued">
          Conditions control when this discount applies. All conditions must be
          met unless you select "Any Below" above.
        </s-paragraph>
      </s-stack>
    </s-section>
  );
}
