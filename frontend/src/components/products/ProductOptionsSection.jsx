import { useEffect, useState } from "react";
import { getInputEventValue } from "../../utils/fieldEvent";
import { MAX_PRODUCT_OPTIONS } from "../../utils/productVariants";

import { exclusiveFieldLabel } from "../../utils/formFields";

export default function ProductOptionsSection({
  options,
  onOptionsChange,
  onOptionEditCommit,
  onOptionsReorder,
}) {
  const [showAddOption, setShowAddOption] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftValue, setDraftValue] = useState("");
  const [addError, setAddError] = useState("");
  const [editingOptionIndex, setEditingOptionIndex] = useState(null);
  const [dragOptionIndex, setDragOptionIndex] = useState(null);

  const canAddMore = options.length < MAX_PRODUCT_OPTIONS;

  const saveNewOption = () => {
    const name = draftName.trim();
    const value = draftValue.trim();
    if (!name) {
      setAddError("Enter an option name.");
      return;
    }
    if (!value) {
      setAddError("Add at least one option value.");
      return;
    }

    const position = options.length + 1;
    onOptionsChange([...options, { name, values: [value], position }]);
    setDraftName("");
    setDraftValue("");
    setAddError("");
    setShowAddOption(false);
  };

  const cancelAddOption = () => {
    setDraftName("");
    setDraftValue("");
    setAddError("");
    setShowAddOption(false);
  };

  const removeOption = (optionIndex) => {
    setEditingOptionIndex((current) =>
      current === optionIndex ? null : current,
    );
    const next = options
      .filter((_, i) => i !== optionIndex)
      .map((option, i) => ({ ...option, position: i + 1 }));
    onOptionsChange(next);
  };

  const dropOption = (targetIndex) => {
    if (dragOptionIndex != null && dragOptionIndex !== targetIndex) {
      setEditingOptionIndex(null);
      onOptionsReorder?.(dragOptionIndex, targetIndex);
    }
    setDragOptionIndex(null);
  };

  return (
    <div className="product-options">
      {options.map((option, index) => (
        <div
          key={option.position ?? index}
          className="product-options__row"
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => dropOption(index)}
        >
          <span
            className="product-options__drag-handle"
            aria-label="Reorder option"
            draggable
            onDragStart={() => setDragOptionIndex(index)}
            onDragEnd={() => setDragOptionIndex(null)}
          >
            <s-icon type="drag" />
          </span>
          <div className="product-options__row-body">
            <OptionCard
              option={option}
              optionIndex={index}
              isEditing={editingOptionIndex === index}
              onOpen={() => setEditingOptionIndex(index)}
              onClose={() => setEditingOptionIndex(null)}
              onCommit={onOptionEditCommit}
              onDeleteOption={() => removeOption(index)}
            />
          </div>
        </div>
      ))}

      {showAddOption ? (
        <div className="product-options__card product-options__card--editing">
          <s-stack gap="base">
            <s-text type="strong">Add another option</s-text>
            <s-text-field
              label="Option name"
              placeholder="e.g. Size, Material"
              value={draftName}
              onInput={(event) => setDraftName(getInputEventValue(event))}
            />
            <s-text-field
              label="Option value"
              placeholder="e.g. Large"
              details="At least one value is required. You can add more after creating the option."
              error={addError || undefined}
              value={draftValue}
              onInput={(event) => {
                setDraftValue(getInputEventValue(event));
                if (addError) setAddError("");
              }}
            />
            <s-stack direction="inline" gap="small">
              <s-button variant="primary" onClick={saveNewOption}>
                Done
              </s-button>
              <s-button variant="tertiary" onClick={cancelAddOption}>
                Cancel
              </s-button>
            </s-stack>
          </s-stack>
        </div>
      ) : canAddMore ? (
        <button
          type="button"
          className="product-options__add-btn"
          onClick={() => setShowAddOption(true)}
        >
          <span className="product-options__add-btn-icon" aria-hidden="true">
            +
          </span>
          Add another option
        </button>
      ) : null}
    </div>
  );
}

function makeRowKey() {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function OptionCard({
  option,
  optionIndex,
  isEditing,
  onOpen,
  onClose,
  onCommit,
  onDeleteOption,
}) {
  const [draftName, setDraftName] = useState(option.name || "");
  const [rows, setRows] = useState([]);
  const [dragRowIndex, setDragRowIndex] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEditing) return;

    setDraftName(option.name || "");
    setRows([
      ...(option.values || []).map((value) => ({
        key: makeRowKey(),
        originalValue: value,
        value,
      })),
      { key: makeRowKey(), originalValue: null, value: "" },
    ]);
    setDragRowIndex(null);
    setError("");
  }, [isEditing]);

  const updateRow = (rowKey, value) => {
    if (error) setError("");
    setRows((prev) => {
      const next = prev.map((row) =>
        row.key === rowKey ? { ...row, value } : row,
      );
      const last = next[next.length - 1];
      if (last && last.value.trim() !== "") {
        next.push({ key: makeRowKey(), originalValue: null, value: "" });
      }
      return next;
    });
  };

  const removeRow = (rowKey) => {
    setRows((prev) => prev.filter((row) => row.key !== rowKey));
  };

  const dropRow = (targetIndex) => {
    setRows((prev) => {
      const lastIndex = prev.length - 1;
      if (
        dragRowIndex == null ||
        dragRowIndex === targetIndex ||
        dragRowIndex === lastIndex ||
        targetIndex === lastIndex
      ) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(dragRowIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setDragRowIndex(null);
  };

  const handleDone = () => {
    const finalRows = rows.filter((row) => row.value.trim() !== "");
    if (finalRows.length === 0) {
      setError("Add at least one option value.");
      return;
    }
    setError("");
    onCommit?.(optionIndex, { name: draftName, values: finalRows });
    onClose?.();
  };

  if (!isEditing) {
    const values = option.values || [];
    return (
      <div
        className="product-options__card product-options__card--clickable"
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen();
          }
        }}
      >
        <s-stack gap="small">
          <s-text type="strong">{option.name || "Option"}</s-text>
          {values.length > 0 ? (
            <div className="product-options__tags">
              {values.map((value) => (
                <span
                  key={value}
                  className="product-options__tag product-options__tag--readonly"
                >
                  {value}
                </span>
              ))}
            </div>
          ) : (
            <s-text color="subdued">No values yet</s-text>
          )}
        </s-stack>
      </div>
    );
  }

  return (
    <div className="product-options__card product-options__card--editing">
      <s-stack gap="base">
        <s-text-field
          label="Option name"
          value={draftName}
          onInput={(event) => setDraftName(getInputEventValue(event))}
        />

        <s-stack gap="small">
          <s-text type="strong">Option values</s-text>
          {error ? (
            <s-text tone="critical" color="critical">
              {error}
            </s-text>
          ) : null}
          <div className="product-options__values">
            {rows.map((row, index) => {
              const isAddRow = index === rows.length - 1;
              return (
              <div
                className="product-options__value-row"
                key={row.key}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.stopPropagation();
                  dropRow(index);
                }}
              >
                <span
                  className={`product-options__drag-handle${
                    isAddRow ? " product-options__drag-handle--hidden" : ""
                  }`}
                  aria-label="Reorder value"
                  draggable={!isAddRow}
                  onDragStart={(event) => {
                    if (isAddRow) return;
                    event.stopPropagation();
                    setDragRowIndex(index);
                  }}
                  onDragEnd={() => setDragRowIndex(null)}
                >
                    <s-icon type="drag" />
                </span>
                <s-text-field
                  className="product-options__value-input"
                  label="Value"
                  {...exclusiveFieldLabel}
                  placeholder={isAddRow ? "Add another value" : undefined}
                  value={row.value}
                  onInput={(event) =>
                    updateRow(row.key, getInputEventValue(event))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.preventDefault();
                  }}
                />
                <button
                  type="button"
                  className={`product-options__value-delete${
                    isAddRow ? " product-options__value-delete--hidden" : ""
                  }`}
                  aria-label={`Remove ${row.value || "value"}`}
                  tabIndex={isAddRow ? -1 : 0}
                  onClick={() => {
                    if (!isAddRow) removeRow(row.key);
                  }}
                >
                    <s-icon type="delete" />
                </button>
              </div>
              );
            })}
          </div>
        </s-stack>

        <div className="product-options__editor-footer">
          <s-button variant="tertiary" tone="critical" onClick={onDeleteOption}>
            Delete
          </s-button>
          <s-button variant="primary" onClick={handleDone}>
            Done
          </s-button>
        </div>
      </s-stack>
    </div>
  );
}
