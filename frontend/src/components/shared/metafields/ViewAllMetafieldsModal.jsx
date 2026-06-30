import React, { useState, useEffect, useMemo } from "react";
import {
  saveMetafields,
  deleteDefinition,
  updateDefinition,
} from "../../../services/metafieldService";
import MetafieldValueInput from "./MetafieldValueInput";
import { capitalize, valuesFromMetafields } from "../../../utils/metafields";
import { useCollapseOnClickOutside } from "../../../hooks/useCollapseOnClickOutside";

export default function ViewAllMetafieldsModal({
  modalRef,
  entityType,
  entityId,
  metafields,
  onClose,
  onReload,
  shopify,
}) {
  const [localValues, setLocalValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const { activeId, setActiveId, containerRef } = useCollapseOnClickOutside();

  useEffect(() => {
    setLocalValues(valuesFromMetafields(metafields));
    setHasUnsavedChanges(false);
  }, [metafields]);

  const handleValueChange = (definitionId, val) => {
    setLocalValues((prev) => ({
      ...prev,
      [definitionId]: val,
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveValues = async () => {
    if (!entityId || entityId === "new") {
      shopify.toast.show("Cannot save metafield values for an unsaved entity", {
        isError: true,
      });
      return;
    }
    setSaving(true);
    try {
      await saveMetafields(entityType, entityId, localValues);
      shopify.toast.show("Metafield values saved");
      setHasUnsavedChanges(false);
      onReload();
    } catch (err) {
      shopify.toast.show(err.message || "Failed to save metafield values", {
        isError: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePin = async (definition) => {
    try {
      await updateDefinition(
        definition.id,
        { pinned: !definition.pinned }
      );
      shopify.toast.show(
        definition.pinned ? "Definition unpinned" : "Definition pinned"
      );
      onReload();
    } catch (err) {
      shopify.toast.show(err.message || "Failed to update pin status", {
        isError: true,
      });
    }
  };

  const handleDeleteDef = async (definition) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete definition '${definition.name}'? All saved values for this definition will be lost.`
    );
    if (!confirmed) return;

    try {
      await deleteDefinition(definition.id);
      shopify.toast.show("Definition deleted");
      onReload();
    } catch (err) {
      shopify.toast.show(err.message || "Failed to delete definition", {
        isError: true,
      });
    }
  };

  const { pinned, unpinned } = useMemo(() => {
    const pinnedList = [];
    const unpinnedList = [];
    metafields.forEach((metafield) => {
      if (metafield.definition.pinned) pinnedList.push(metafield);
      else unpinnedList.push(metafield);
    });
    return { pinned: pinnedList, unpinned: unpinnedList };
  }, [metafields]);

  const renderInputField = (metafield, isActive) => (
    <MetafieldValueInput
      def={metafield.definition}
      value={localValues[metafield.definition.id] ?? ""}
      onChange={(val) => handleValueChange(metafield.definition.id, val)}
      active={isActive}
    />
  );

  const renderRow = (metafield) => {
    const def = metafield.definition;
    const isActive = activeId === def.id;
    const hasValue = String(localValues[def.id] ?? "") !== "";
    return (
      <div
        key={def.id}
        data-mf-row={def.id}
        className={`metafield-view-all-row ${isActive ? "is-active" : ""}`}
        onClick={() => setActiveId(def.id)}
      >
        <div className="metafield-view-all-row__label-container">
          <div className="metafield-view-all-row__label">{def.name}</div>
          {isActive && (
            <div className="metafield-view-all-row__key">{def.typeLabel}</div>
          )}
        </div>
        <div className="metafield-view-all-row__field">
          {renderInputField(metafield, isActive)}
        </div>
        <div
          className="metafield-view-all-row__actions"
          onClick={(event) => event.stopPropagation()}
        >
          {isActive ? (
            <button
              type="button"
              className="metafield-clear-btn"
              disabled={!hasValue}
              onClick={() => handleValueChange(def.id, "")}
            >
              Clear
            </button>
          ) : (
            <>
              <s-button variant="tertiary" onClick={() => handleTogglePin(def)}>
                {def.pinned ? "Unpin" : "Pin"}
              </s-button>
              <s-button
                variant="tertiary"
                onClick={() => handleDeleteDef(def)}
                className="metafield-btn-destructive"
              >
                Delete
              </s-button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <s-modal
      id="view-all-metafields-modal"
      ref={modalRef}
      heading={`${capitalize(entityType)} metafields`}
    >
      <div className="metafield-modal-body">
        <div className="metafield-tabs">
          <button
            type="button"
            className={`metafield-tab ${
              activeTab === "all" ? "metafield-tab--active" : ""
            }`}
            onClick={() => setActiveTab("all")}
          >
            All
          </button>
          <button
            type="button"
            className={`metafield-tab ${
              activeTab === "entity" ? "metafield-tab--active" : ""
            }`}
            onClick={() => setActiveTab("entity")}
          >
            {capitalize(entityType)} metafields
          </button>
        </div>

        {activeTab === "category" ? (
          <div className="metafield-view-all-empty">
            This {entityType}'s category doesn't have any metafields.
          </div>
        ) : metafields.length === 0 ? (
          <div className="metafield-view-all-empty">
            No metafield definitions found. Create one using "Add definition".
          </div>
        ) : (
          <div className="metafield-view-all-list" ref={containerRef}>
            {pinned.length > 0 && (
              <div>
                <div className="metafield-view-all-group-title">Pinned</div>
                <div className="metafield-view-all-group-list">
                  {pinned.map(renderRow)}
                </div>
              </div>
            )}

            {unpinned.length > 0 && (
              <div>
                <div className="metafield-view-all-group-title">Unpinned</div>
                <div className="metafield-view-all-group-list">
                  {unpinned.map(renderRow)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {hasUnsavedChanges && (
        <s-button
          slot="primary-action"
          variant="primary"
          onClick={handleSaveValues}
          {...(saving ? { loading: true } : {})}
        >
          Save values
        </s-button>
      )}
      <s-button slot="secondary-actions" onClick={onClose}>
        Close
      </s-button>
    </s-modal>
  );
}
