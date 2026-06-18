import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { saveMetafields } from "../../../services/metafieldService";
import {
  fetchMetafieldsBundle,
  getCachedMetafields,
  setCachedMetafields,
} from "../../../services/metafieldsStore";
import MetafieldValueInput from "./MetafieldValueInput";
import AddMetafieldDefinitionModal from "./AddMetafieldDefinitionModal";
import ViewAllMetafieldsModal from "./ViewAllMetafieldsModal";
import { capitalize, valuesFromMetafields } from "../../../utils/metafields";
import { useCollapseOnClickOutside } from "../../../hooks/useCollapseOnClickOutside";
import "../../../styles/Metafields.css";

export default function MetafieldsCard({ entityType, entityId }) {
  const shopify = useAppBridge();

  const cachedBundle = getCachedMetafields(entityType, entityId);

  const [token, setToken] = useState(null);
  const [metafields, setMetafields] = useState(cachedBundle?.metafields || []);
  const [typeOptions, setTypeOptions] = useState(
    cachedBundle?.typeOptions || []
  );
  const [loading, setLoading] = useState(!cachedBundle);
  const [localValues, setLocalValues] = useState(() =>
    valuesFromMetafields(cachedBundle?.metafields || [])
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const { activeId, setActiveId, containerRef } = useCollapseOnClickOutside();

  const [activeModal, setActiveModal] = useState(null);
  const addDefModalRef = useRef(null);
  const viewAllModalRef = useRef(null);

  const validateSingleField = (def, val) => {
    if (!val) return null;

    if (!def.validationRulesJson) return null;

    let rules = [];
    try {
      rules = JSON.parse(def.validationRulesJson);
    } catch (e) {
      console.error("Failed to parse validation rules:", e);
      return null;
    }

    for (const rule of rules) {
      if (rule.name === "char_limit") {
        let config = {};
        try {
          config =
            typeof rule.value === "string"
              ? JSON.parse(rule.value)
              : rule.value;
        } catch (e) {}

        const length = String(val).length;
        if (
          config.min !== null &&
          config.min !== undefined &&
          length < config.min
        ) {
          return `Must be at least ${config.min} characters.`;
        }
        if (
          config.max !== null &&
          config.max !== undefined &&
          length > config.max
        ) {
          return `Must be no more than ${config.max} characters.`;
        }
      }

      if (rule.name === "regex") {
        const pattern = rule.value;
        if (pattern) {
          try {
            const regex = new RegExp(pattern);
            if (!regex.test(String(val))) {
              return `Must match regular expression: ${pattern}`;
            }
          } catch (e) {
            console.error("Invalid regex pattern:", pattern, e);
          }
        }
      }

      if (rule.name === "number_range") {
        let config = {};
        try {
          config =
            typeof rule.value === "string"
              ? JSON.parse(rule.value)
              : rule.value;
        } catch (e) {}

        const num = parseFloat(val);
        if (isNaN(num)) {
          return "Must be a valid number.";
        }
        if (
          config.min !== null &&
          config.min !== undefined &&
          num < config.min
        ) {
          return `Must be at least ${config.min}.`;
        }
        if (
          config.max !== null &&
          config.max !== undefined &&
          num > config.max
        ) {
          return `Must be no more than ${config.max}.`;
        }
      }
    }

    return null;
  };

  const applyBundle = useCallback((bundle) => {
    setMetafields(bundle.metafields);
    setTypeOptions(bundle.typeOptions);
    setLocalValues(valuesFromMetafields(bundle.metafields));
    setValidationErrors({});
    setHasUnsavedChanges(false);
  }, []);

  const loadMetafields = useCallback(async () => {
    setLoading(true);
    try {
      const freshToken = await shopify.idToken();
      setToken(freshToken);
      const bundle = await fetchMetafieldsBundle(
        entityType,
        entityId,
        freshToken
      );
      setCachedMetafields(entityType, entityId, bundle);
      applyBundle(bundle);
    } catch (err) {
      console.error("Failed to load metafields:", err);
    } finally {
      setLoading(false);
    }
  }, [shopify, entityType, entityId, applyBundle]);

  useEffect(() => {
    shopify
      .idToken()
      .then(setToken)
      .catch(() => {});
    const cached = getCachedMetafields(entityType, entityId);
    if (cached) {
      applyBundle(cached);
      setLoading(false);
    } else {
      loadMetafields();
    }
  }, [shopify, entityType, entityId, loadMetafields, applyBundle]);

  const definitionsById = useMemo(
    () => new Map(metafields.map((m) => [m.definition.id, m.definition])),
    [metafields]
  );

  const handleValueChange = (definitionId, value) => {
    setLocalValues((prev) => ({ ...prev, [definitionId]: value }));
    setHasUnsavedChanges(true);

    const definition = definitionsById.get(definitionId);
    if (!definition) return;
    setValidationErrors((prev) => ({
      ...prev,
      [definitionId]: validateSingleField(definition, value),
    }));
  };

  const handleSave = async () => {
    if (!entityId || entityId === "new") {
      shopify.toast.show("Save the details page first to set metafields.", {
        isError: true,
      });
      return;
    }

    const errors = {};
    let hasErrors = false;
    metafields.forEach((m) => {
      const val = localValues[m.definition.id] ?? "";
      const err = validateSingleField(m.definition, val);
      if (err) {
        errors[m.definition.id] = err;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setValidationErrors(errors);
      shopify.toast.show("Please fix the validation errors before saving.", {
        isError: true,
      });
      return;
    }

    setSaving(true);
    try {
      await saveMetafields(entityType, entityId, localValues, token);
      shopify.toast.show("Metafields saved successfully");
      setHasUnsavedChanges(false);
      await loadMetafields();
    } catch (err) {
      shopify.toast.show(err.message || "Failed to save metafields", {
        isError: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const openModal = (modalName) => {
    setActiveModal(modalName);
    setTimeout(() => {
      const modal =
        modalName === "add_def"
          ? addDefModalRef.current
          : viewAllModalRef.current;
      modal?.showOverlay?.();
    }, 50);
  };

  const closeModal = () => {
    const modal =
      activeModal === "add_def"
        ? addDefModalRef.current
        : viewAllModalRef.current;
    modal?.hideOverlay?.();
    setActiveModal(null);
  };

  const pinnedMetafields = metafields.filter((m) => m.definition.pinned);

  const renderInputField = (m, isActive) => (
    <MetafieldValueInput
      def={m.definition}
      value={localValues[m.definition.id] ?? ""}
      onChange={(val) => handleValueChange(m.definition.id, val)}
      disabled={entityId === "new" || !entityId}
      active={isActive}
    />
  );

  const isNew = entityId === "new" || !entityId;

  return (
    <s-section>
      <s-stack gap="base">
        <s-stack
          direction="inline"
          gap="base"
          alignItems="center"
          justifyContent="space-between"
        >
          <s-heading>{capitalize(entityType)} metafields</s-heading>
          <div className="metafield-card-actions">
            <s-button variant="tertiary" onClick={() => openModal("view_all")}>
              View all
            </s-button>
            <s-button variant="secondary" onClick={() => openModal("add_def")}>
              Add definition
            </s-button>
          </div>
        </s-stack>

        <div className="metafield-card-container" ref={containerRef}>
          {loading ? null : (
            <>
              {isNew && (
                <div className="metafield-card-row__new-msg">
                  Metafield values can be added after saving this {entityType}.
                </div>
              )}

              {pinnedMetafields.length === 0 ? (
                <div className="metafield-card-empty-msg">
                  No pinned metafields. Click "Add definition" or "View all" to
                  customize fields.
                </div>
              ) : (
                pinnedMetafields.map((m) => {
                  const def = m.definition;
                  const isActive = activeId === def.id;
                  const hasValue = String(localValues[def.id] ?? "") !== "";
                  return (
                    <div
                      key={def.id}
                      data-mf-row={def.id}
                      className={`metafield-card-row ${
                        isActive ? "is-active" : ""
                      }`}
                      onClick={() => {
                        if (!isNew) setActiveId(def.id);
                      }}
                    >
                      <div className="metafield-card-row__label-container">
                        <span className="metafield-card-row__label">
                          {def.name}
                        </span>
                        {isActive ? (
                          <div className="metafield-card-row__desc">
                            {def.typeLabel}
                          </div>
                        ) : (
                          def.description && (
                            <div className="metafield-card-row__desc">
                              {def.description}
                            </div>
                          )
                        )}
                      </div>
                      <div className="metafield-card-row__field">
                        {renderInputField(m, isActive)}

                        {validationErrors[def.id] && (
                          <div
                            className="metafield-input-error"
                            style={{
                              color: "#d72c0d",
                              fontSize: "12px",
                              marginTop: "4px",
                            }}
                          >
                            {validationErrors[def.id]}
                          </div>
                        )}
                      </div>
                      {isActive && (
                        <div
                          className="metafield-card-row__actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="metafield-clear-btn"
                            disabled={!hasValue}
                            onClick={() => handleValueChange(def.id, "")}
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {hasUnsavedChanges && !isNew && (
                <div className="metafield-card-footer">
                  <s-button
                    variant="primary"
                    onClick={handleSave}
                    {...(saving ? { loading: true } : {})}
                  >
                    Save metafields
                  </s-button>
                </div>
              )}
            </>
          )}
        </div>
      </s-stack>

      {activeModal === "add_def" && (
        <AddMetafieldDefinitionModal
          modalRef={addDefModalRef}
          entityType={entityType}
          token={token}
          preloadedTypeOptions={typeOptions}
          onClose={closeModal}
          onSaved={() => {
            closeModal();
            loadMetafields();
          }}
          shopify={shopify}
        />
      )}

      {activeModal === "view_all" && (
        <ViewAllMetafieldsModal
          modalRef={viewAllModalRef}
          entityType={entityType}
          entityId={entityId}
          metafields={metafields}
          token={token}
          onClose={closeModal}
          onReload={loadMetafields}
          shopify={shopify}
        />
      )}
    </s-section>
  );
}
