import React, { useState, useCallback, useMemo } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getInputEventValue } from "../../utils/fieldEvent";
import { useChoiceList } from "../../hooks/useChoiceList";
import ConditionTypeSelect from "../shared/ConditionTypeSelect";
import ConditionOperatorSelect from "../shared/ConditionOperatorSelect";

const NUMERIC_TYPES = new Set(["cart_total", "cart_subtotal"]);
const BOOLEAN_TYPES = new Set(["line_item_selling_plan", "customer_logged_in"]);

const ConditionResourcesList = React.memo(function ConditionResourcesList({
  items = [],
  onRemove,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!items || items.length === 0) return null;

  const visibleItems = isExpanded ? items : items.slice(0, 3);

  return (
    <div style={{ marginTop: "8px" }}>
      <s-stack gap="tight">
        {visibleItems.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 12px",
              background: "#fff",
              border: "1px solid #e1e3e5",
              borderRadius: "8px",
              marginTop: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title}
                  style={{
                    width: "36px",
                    height: "36px",
                    objectFit: "cover",
                    borderRadius: "4px",
                    border: "1px solid #e1e3e5",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    background: "#f1f2f3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "4px",
                    border: "1px solid #e1e3e5",
                  }}
                >
                  <s-icon type="image" />
                </div>
              )}
              <span style={{ fontWeight: "500", fontSize: "13px", color: "#202223" }}>
                {item.title}
              </span>
            </div>
            <s-button
              variant="tertiary"
              tone="critical"
              icon="delete"
              onClick={() => onRemove(item)}
            />
          </div>
        ))}

        {items.length > 3 && (
          <s-button
            variant="tertiary"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Show less" : `Show all ${items.length} selected >`}
          </s-button>
        )}
      </s-stack>
    </div>
  );
});

export default function CheckoutConditionsSection({
  displayConditions,
  onChange,
}) {
  const shopify = useAppBridge();
  const [searchQueries, setSearchQueries] = useState({});

  const { combination, conditions } = useMemo(() => {
    let comb = "all";
    let conds = [];
    if (displayConditions) {
      if (Array.isArray(displayConditions)) {
        conds = displayConditions;
      } else if (typeof displayConditions === "object") {
        comb = displayConditions.combination || "all";
        conds = Array.isArray(displayConditions.conditions)
          ? displayConditions.conditions
          : [];
      }
    }
    if (conds.length === 0) {
      conds = [{ type: "", operator: "", value: "" }];
    }
    return { combination: comb, conditions: conds };
  }, [displayConditions]);

  const updateConditions = useCallback(
    (newConditions) => {
      onChange({
        combination,
        conditions: newConditions,
      });
    },
    [combination, onChange]
  );

  const updateCombination = useCallback(
    (newCombination) => {
      onChange({
        combination: newCombination,
        conditions,
      });
    },
    [conditions, onChange]
  );

  const combRef = useChoiceList(combination, updateCombination);

  const handleAddCondition = useCallback(() => {
    updateConditions([
      ...conditions,
      {
        type: "cart_total",
        operator: "greater_than_or_equals",
        value: "",
      },
    ]);
  }, [conditions, updateConditions]);

  const handleRemoveCondition = useCallback(
    (index) => {
      const next = [...conditions];
      next.splice(index, 1);
      updateConditions(next);
    },
    [conditions, updateConditions]
  );

  const handleConditionChange = useCallback(
    (index, changes) => {
      const next = [...conditions];
      next[index] = { ...next[index], ...changes };
      updateConditions(next);
    },
    [conditions, updateConditions]
  );

  const handleBrowse = useCallback(
    async (index) => {
      try {
        const cond = conditions[index];
        const selectedItems = cond?.selectedItems || [];
        const initialSelection = selectedItems.map((item) => ({ id: item.id }));

        const selection = await shopify.resourcePicker({
          type: "product",
          multiple: true,
          selectionIds: initialSelection,
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
      if (cond.type === "product") {
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
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "8px" }}>
              <div style={{ flex: 1 }}>
                <s-text-field
                  placeholder="Search products"
                  value={query}
                  onInput={(e) =>
                    setSearchQueries((prev) => ({ ...prev, [idx]: getInputEventValue(e) }))
                  }
                />
              </div>
              <s-button onClick={() => handleBrowse(idx)}>Browse</s-button>
            </div>

            <ConditionResourcesList
              items={filteredItems}
              onRemove={(itemToRemove) => {
                const nextItems = selectedItems.filter(
                  (item) => item.id !== itemToRemove.id
                );
                handleConditionChange(idx, {
                  value: nextItems.map((item) => item.id).join(","),
                  valueLabel: nextItems.map((item) => item.title).join(", "),
                  selectedItems: nextItems,
                });
              }}
            />
          </s-stack>
        );
      }

      if (BOOLEAN_TYPES.has(cond.type)) {
        return (
          <div style={{ marginTop: "8px" }}>
            <s-select
              value={cond.value ?? "true"}
              onChange={(e) =>
                handleConditionChange(idx, { value: getInputEventValue(e) })
              }
            >
              <s-option value="true">Yes</s-option>
              <s-option value="false">No</s-option>
            </s-select>
          </div>
        );
      }

      const isNumeric = NUMERIC_TYPES.has(cond.type);
      return (
        <div style={{ marginTop: "8px" }}>
          <s-text-field
            type={isNumeric ? "number" : "text"}
            placeholder={
              cond.type
                ? isNumeric
                  ? "Enter a number (e.g. 100)"
                  : "Enter value (e.g. VIP, USD)"
                : ""
            }
            value={cond.value ?? ""}
            onInput={(e) =>
              handleConditionChange(idx, { value: getInputEventValue(e) })
            }
          />
        </div>
      );
    },
    [handleBrowse, handleConditionChange, searchQueries]
  );

  return (
    <s-section heading="Set Your Condition">
      <s-stack gap="base">
        <s-choice-list
          ref={combRef}
          name="checkoutConditionsCombination"
          values={[combination]}
        >
          <s-choice value="all">All Below</s-choice>
          <s-choice value="any">Any Below</s-choice>
        </s-choice-list>

        {conditions.map((cond, idx) => (
          <s-card key={idx}>
            <s-stack gap="base">
              <s-grid
                gap="base"
                gridTemplateColumns={conditions.length > 1 ? "1fr 1fr auto" : "1fr 1fr"}
              >
                <ConditionTypeSelect
                  source="checkout"
                  value={cond.type}
                  onChange={(e) => {
                    const nextType = getInputEventValue(e);
                    const isNewNumeric = NUMERIC_TYPES.has(nextType);
                    const isNewBoolean = BOOLEAN_TYPES.has(nextType);
                    handleConditionChange(idx, {
                      type: nextType,
                      operator: isNewNumeric
                        ? "greater_than_or_equals"
                        : isNewBoolean
                          ? "equals"
                          : "contains",
                      value: isNewBoolean ? "true" : "",
                      valueLabel: "",
                      selectedItems: [],
                    });
                  }}
                />

                <ConditionOperatorSelect
                  value={cond.operator}
                  isNumeric={NUMERIC_TYPES.has(cond.type)}
                  isBoolean={BOOLEAN_TYPES.has(cond.type)}
                  isCheckout={true}
                  onChange={(e) =>
                    handleConditionChange(idx, { operator: getInputEventValue(e) })
                  }
                />

                {conditions.length > 1 && (
                  <s-button
                    variant="tertiary"
                    tone="critical"
                    icon="delete"
                    accessibilityLabel="Remove condition"
                    onClick={() => handleRemoveCondition(idx)}
                  />
                )}
              </s-grid>

              <div>{renderValueInput(cond, idx)}</div>
            </s-stack>
          </s-card>
        ))}

        <div>
          <s-button variant="primary" onClick={handleAddCondition}>
            Add condition
          </s-button>
        </div>

        <s-paragraph tone="subdued">
          A condition can be set only once, and it will only be activated if all
          the rules are fulfilled.
        </s-paragraph>
      </s-stack>
    </s-section>
  );
}
