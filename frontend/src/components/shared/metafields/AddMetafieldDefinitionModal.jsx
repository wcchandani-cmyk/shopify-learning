import React, { useState, useEffect, useRef } from "react";
import {
  createDefinition,
  getMetafieldTypes,
} from "../../../services/metafieldService";
import {
  getInputEventValue,
  getCheckboxChecked,
} from "../../../utils/fieldEvent";
import { exclusiveFieldLabel } from "../../../utils/formFields";
import MetafieldTypeIcon from "./MetafieldTypeIcon";
import { capitalize, findTypeItem, filterTypeGroups } from "../../../utils/metafields";
import "../../../styles/Metafields.css";

const ONE_LIST_OPTIONS = [
  { value: false, label: "One value", icon: "bullet" },
  { value: true, label: "List of values", icon: "list-bulleted" },
];

export default function AddMetafieldDefinitionModal({
  modalRef,
  entityType,
  token,
  onClose,
  onSaved,
  shopify,
  preloadedTypeOptions = null,
}) {
  const hasPreloaded =
    Array.isArray(preloadedTypeOptions) && preloadedTypeOptions.length > 0;
  const [name, setName] = useState("");
  const [namespace, setNamespace] = useState("custom");
  const [key, setKey] = useState("");
  const [type, setType] = useState("single_line_text_field");
  const [isList, setIsList] = useState(false);
  const [description, setDescription] = useState("");
  const [storefrontApiAccess, setStorefrontApiAccess] = useState(false);
  const [pinned, setPinned] = useState(true);

  // Start from the prefetched type list so the modal opens with options ready.
  const [typeOptions, setTypeOptions] = useState(
    hasPreloaded ? preloadedTypeOptions : []
  );
  const [loadingTypes, setLoadingTypes] = useState(!hasPreloaded);

  const [showDescription, setShowDescription] = useState(false);
  const [popoverSearch, setPopoverSearch] = useState("");

  const [vValues, setVValues] = useState({});
  const [uniqueValues, setUniqueValues] = useState(false);
  const [validationExpanded, setValidationExpanded] = useState(false);

  const setV = (name, value) =>
    setVValues((prev) => ({ ...prev, [name]: value }));

  const [useAsCollectionFilter, setUseAsCollectionFilter] = useState(false);
  const [useAsAnalyticsFilter, setUseAsAnalyticsFilter] = useState(false);
  const [useAsSmartCollectionCondition, setUseAsSmartCollectionCondition] =
    useState(false);

  const searchInputRef = useRef(null);

  useEffect(() => {
    setVValues({});
    setUniqueValues(false);
  }, [type]);

  useEffect(() => {
    if (!token || hasPreloaded) return;
    setLoadingTypes(true);
    getMetafieldTypes(token, entityType)
      .then((groups) => {
        setTypeOptions(groups);
      })
      .catch((err) => {
        console.error("Failed to load metafield types:", err);
      })
      .finally(() => {
        setLoadingTypes(false);
      });
  }, [token, entityType, hasPreloaded]);

  const selectedTypeObj = findTypeItem(typeOptions, type);
  const baseType = selectedTypeObj?.baseType || type;

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedKey = key.trim();
    if (!trimmedName || !trimmedKey) {
      shopify.toast.show("Name and Key are required", { isError: true });
      return;
    }

    const currentTypeInfo = selectedTypeObj;

    const saveType = currentTypeInfo?.baseType || type;
    const supported = currentTypeInfo?.validations || [];
    const valNames = supported.map((v) => v.name);
    const validationRules = [];

    const pushScalar = (name) => {
      const raw = vValues[name];
      if (raw !== undefined && String(raw).trim() !== "") {
        validationRules.push({ name, value: String(raw).trim() });
      }
    };
    const pushList = (name) => {
      const raw = (vValues[name] || "").trim();
      if (raw) {
        const arr = raw
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
        if (arr.length)
          validationRules.push({ name, value: JSON.stringify(arr) });
      }
    };

    ["min", "max", "scale_min", "scale_max", "max_precision"].forEach((n) => {
      if (valNames.includes(n)) pushScalar(n);
    });
    if (valNames.includes("regex") || valNames.includes("regular_expression")) {
      const r = (vValues.regex || "").trim();
      if (r) validationRules.push({ name: "regex", value: r });
    }
    if (valNames.includes("schema")) pushScalar("schema");
    ["allowed_domains", "file_type_options"].forEach((n) => {
      if (valNames.includes(n)) pushList(n);
    });
    if (isList) {
      ["list.min", "list.max"].forEach((n) => {
        if (valNames.includes(n)) pushScalar(n);
      });
    }
    if (uniqueValues) {
      validationRules.push({ name: "unique_values", value: "true" });
    }

    // Only persist capabilities the API marked eligible for this type + owner.
    const eligibleFields = new Set(
      (currentTypeInfo?.options || []).map((o) => o.field)
    );

    const payload = {
      entityType,
      namespace: namespace.trim() || "custom",
      key: trimmedKey,
      name: trimmedName,
      type: isList ? `list.${saveType}` : saveType,
      description: description.trim(),
      storefrontApiAccess: eligibleFields.has("storefrontApiAccess")
        ? storefrontApiAccess
        : false,
      pinned,
      validationRulesJson:
        validationRules.length > 0 ? JSON.stringify(validationRules) : null,
      useAsCollectionFilter: eligibleFields.has("useAsCollectionFilter")
        ? useAsCollectionFilter
        : false,
      useAsAnalyticsFilter: eligibleFields.has("useAsAnalyticsFilter")
        ? useAsAnalyticsFilter
        : false,
      useAsSmartCollectionCondition: eligibleFields.has(
        "useAsSmartCollectionCondition"
      )
        ? useAsSmartCollectionCondition
        : false,
    };

    try {
      await createDefinition(payload, token);
      shopify.toast.show("Definition created successfully");
      setName("");
      setNamespace("custom");
      setKey("");
      setType("single_line_text_field");
      setIsList(false);
      setDescription("");
      setStorefrontApiAccess(false);
      setPinned(true);
      setShowDescription(false);
      setVValues({});
      setUniqueValues(false);
      setUseAsCollectionFilter(false);
      setUseAsAnalyticsFilter(false);
      setUseAsSmartCollectionCondition(false);
      onSaved();
    } catch (err) {
      shopify.toast.show(err.message || "Failed to create definition", {
        isError: true,
      });
    }
  };

  const supportedValidations = selectedTypeObj?.validations || [];
  const valNames = supportedValidations.map((v) => v.name);
  const hasVal = (n) => valNames.includes(n);

  const isTextType = [
    "single_line_text_field",
    "multi_line_text_field",
  ].includes(baseType);
  const minValidation = supportedValidations.find((v) => v.name === "min");
  const minMaxIsDate =
    (!!minValidation &&
      (minValidation.type === "date" || minValidation.type === "date_time")) ||
    baseType === "date" ||
    baseType === "date_time";
  const minMaxLabel = isTextType
    ? "Character limit"
    : minMaxIsDate
    ? "Date range"
    : "Value range";
  const minMaxInputType = minMaxIsDate ? "date" : "number";
  const minMaxPlaceholder = minMaxIsDate ? "YYYY-MM-DD" : "";
  const uniqueApplicable =
    isTextType ||
    ["number_integer", "number_decimal", "integer", "decimal"].includes(
      baseType
    );

  const showValidationCard =
    !loadingTypes && (supportedValidations.length > 0 || uniqueApplicable);

  const optionList = selectedTypeObj?.options || [];
  const hasAnyOption = optionList.length > 0;

  const capabilityValues = {
    useAsCollectionFilter,
    useAsAnalyticsFilter,
    useAsSmartCollectionCondition,
    storefrontApiAccess,
  };
  const capabilitySetters = {
    useAsCollectionFilter: setUseAsCollectionFilter,
    useAsAnalyticsFilter: setUseAsAnalyticsFilter,
    useAsSmartCollectionCondition: setUseAsSmartCollectionCondition,
    storefrontApiAccess: setStorefrontApiAccess,
  };

  const filteredGroups = filterTypeGroups(typeOptions, popoverSearch);

  return (
    <s-modal
      id="add-metafield-definition-modal"
      ref={modalRef}
      size="base"
      heading={`Add ${
        entityType ? capitalize(entityType) : ""
      } metafield definition`}
    >
      <div className="metafield-modal-body">
        <div className="metafield-modal-card">
          <s-text-field
            label="Name"
            placeholder="e.g. Snowboard length"
            value={name}
            onInput={(e) => {
              const val = getInputEventValue(e);
              setName(val);
              setKey(
                val
                  .toLowerCase()
                  .replace(/[^a-z0-9]/g, "_")
                  .replace(/_+/g, "_")
              );
            }}
          />

          <div
            className="metafield-type-selector-wrapper"
            style={{ marginTop: "16px" }}
          >
            <label className="metafield-type-selector-label">Type</label>

            <div className="metafield-type-selector-trigger-container">
              <button
                type="button"
                className="metafield-type-selector-value-type"
                commandFor="one-list-popover"
                command="--toggle"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span>{isList ? "List" : "One"}</span>
                <span className="metafield-one-list-chevron" aria-hidden="true">
                  <s-icon type="chevron-down" />
                </span>
              </button>

              <button
                type="button"
                className="metafield-type-selector-placeholder-btn"
                commandFor="type-select-popover"
                command="--toggle"
                onClick={() => {
                  setPopoverSearch("");
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
              >
                <span
                  className={`metafield-type-selector-placeholder ${
                    type ? "has-value" : ""
                  }`}
                >
                  {selectedTypeObj && (
                    <span className="value-type-icon">
                      <MetafieldTypeIcon name={selectedTypeObj.icon} />
                    </span>
                  )}
                  {selectedTypeObj?.label || "Select type"}
                  {selectedTypeObj?.annotation && (
                    <span className="metafield-type-annotation">
                      {" "}
                      ({selectedTypeObj.annotation})
                    </span>
                  )}
                </span>
                <span
                  className="metafield-type-selector-chevron"
                  aria-hidden="true"
                >
                  <s-icon type="select" color="subdued" />
                </span>
              </button>
            </div>

            <s-popover id="one-list-popover" maxBlockSize="150px">
              <div className="searchable-select__list" role="listbox">
                {ONE_LIST_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    className={`searchable-select__option ${
                      isList === opt.value
                        ? "searchable-select__option--selected"
                        : ""
                    }`}
                    command="--hide"
                    commandFor="one-list-popover"
                    onClick={() => setIsList(opt.value)}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span className="value-type-icon">
                        <s-icon type={opt.icon} size="small" color="subdued" />
                      </span>
                      <span>{opt.label}</span>
                    </div>
                    {isList === opt.value && (
                      <span className="searchable-select__check">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </s-popover>

            <s-popover id="type-select-popover" maxBlockSize="340px">
              <div className="searchable-select__search-wrap">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="searchable-select__search"
                  placeholder="Search"
                  value={popoverSearch}
                  onChange={(e) => setPopoverSearch(e.target.value)}
                  aria-label="Search metafield types"
                />
              </div>

              <div className="searchable-select__list" role="listbox">
                {loadingTypes ? (
                  <div className="searchable-select__empty">
                    Loading types...
                  </div>
                ) : (
                  <>
                    {filteredGroups.map((group) => (
                      <div key={group.group}>
                        <div className="metafield-type-popover__group-title">
                          {group.group}
                        </div>
                        {group.items.map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            className={`searchable-select__option ${
                              type === item.value
                                ? "searchable-select__option--selected"
                                : ""
                            }`}
                            role="option"
                            aria-selected={type === item.value}
                            command="--hide"
                            commandFor="type-select-popover"
                            onClick={() => setType(item.value)}
                          >
                            <div
                              style={{ display: "flex", alignItems: "center" }}
                            >
                              <span className="value-type-icon">
                                <MetafieldTypeIcon name={item.icon} />
                              </span>
                              <span>
                                {item.label}
                                {item.annotation && (
                                  <span className="metafield-type-annotation">
                                    {" "}
                                    ({item.annotation})
                                  </span>
                                )}
                              </span>
                            </div>
                            {type === item.value && (
                              <span className="searchable-select__check">
                                ✓
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    ))}
                    {filteredGroups.length === 0 && (
                      <div className="searchable-select__empty">
                        No matches found
                      </div>
                    )}
                  </>
                )}
              </div>
            </s-popover>
          </div>

          <div style={{ marginTop: "16px" }}>
            {!showDescription ? (
              <div className="metafield-add-desc-wrapper">
                <button
                  type="button"
                  className="metafield-add-desc-link"
                  onClick={() => setShowDescription(true)}
                >
                  Add description
                </button>
              </div>
            ) : (
              <s-text-field
                label="Description"
                placeholder="Add description"
                value={description}
                onInput={(e) => setDescription(getInputEventValue(e))}
              />
            )}
          </div>
        </div>

        {showValidationCard && (
          <div className="metafield-modal-card">
            <button
              type="button"
              className="metafield-accordion-trigger"
              onClick={() => setValidationExpanded(!validationExpanded)}
            >
              <span>Validation</span>
              <span className="metafield-accordion-icon" aria-hidden="true">
                <s-icon
                  type={validationExpanded ? "chevron-up" : "chevron-down"}
                />
              </span>
            </button>

            {validationExpanded && (
              <div className="metafield-validation-box">
                {hasVal("min") && hasVal("max") && (
                  <div className="metafield-validation-group">
                    <div className="metafield-validation-group__label">
                      {minMaxLabel}
                    </div>
                    <div className="metafield-modal-flex-row">
                      <div className="metafield-modal-flex-row__item-1">
                        <s-text-field
                          label="Min"
                          {...exclusiveFieldLabel}
                          type={minMaxInputType}
                          placeholder={minMaxPlaceholder || "Min"}
                          value={vValues.min || ""}
                          onInput={(e) => setV("min", getInputEventValue(e))}
                        />
                      </div>
                      <div className="metafield-modal-flex-row__item-2">
                        <s-text-field
                          label="Max"
                          {...exclusiveFieldLabel}
                          type={minMaxInputType}
                          placeholder={minMaxPlaceholder || "Max"}
                          value={vValues.max || ""}
                          onInput={(e) => setV("max", getInputEventValue(e))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {hasVal("scale_min") && hasVal("scale_max") && (
                  <div className="metafield-validation-group">
                    <div className="metafield-validation-group__label">
                      Range
                    </div>
                    <div className="metafield-modal-flex-row">
                      <div className="metafield-modal-flex-row__item-1">
                        <s-text-field
                          label="Scale minimum"
                          {...exclusiveFieldLabel}
                          type="number"
                          placeholder="e.g. 1"
                          value={vValues.scale_min || ""}
                          onInput={(e) =>
                            setV("scale_min", getInputEventValue(e))
                          }
                        />
                      </div>
                      <div className="metafield-modal-flex-row__item-2">
                        <s-text-field
                          label="Scale maximum"
                          {...exclusiveFieldLabel}
                          type="number"
                          placeholder="e.g. 5"
                          value={vValues.scale_max || ""}
                          onInput={(e) =>
                            setV("scale_max", getInputEventValue(e))
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {hasVal("max_precision") && (
                  <div className="metafield-validation-group">
                    <div className="metafield-validation-group__label">
                      Maximum number of decimals
                    </div>
                    <s-text-field
                      label="Maximum number of decimals"
                      {...exclusiveFieldLabel}
                      type="number"
                      placeholder="e.g. 2"
                      value={vValues.max_precision || ""}
                      onInput={(e) =>
                        setV("max_precision", getInputEventValue(e))
                      }
                    />
                  </div>
                )}

                {(hasVal("regex") || hasVal("regular_expression")) && (
                  <div className="metafield-validation-group">
                    <div className="metafield-validation-group__label">
                      Regular expression
                    </div>
                    <s-text-field
                      label="Regular expression"
                      {...exclusiveFieldLabel}
                      placeholder="e.g. ^[a-zA-Z0-9]+$"
                      value={vValues.regex || ""}
                      onInput={(e) => setV("regex", getInputEventValue(e))}
                    />
                  </div>
                )}

                {hasVal("allowed_domains") && (
                  <div className="metafield-validation-group">
                    <div className="metafield-validation-group__label">
                      Allowed domains (one per line)
                    </div>
                    <s-text-area
                      label="Allowed domains (one per line)"
                      {...exclusiveFieldLabel}
                      placeholder={"example.com"}
                      value={vValues.allowed_domains || ""}
                      onInput={(e) =>
                        setV("allowed_domains", getInputEventValue(e))
                      }
                    />
                  </div>
                )}

                {hasVal("file_type_options") && (
                  <div className="metafield-validation-group">
                    <div className="metafield-validation-group__label">
                      Accepted file types (one per line)
                    </div>
                    <s-text-area
                      label="Accepted file types (one per line)"
                      {...exclusiveFieldLabel}
                      placeholder={"Image\nVideo"}
                      value={vValues.file_type_options || ""}
                      onInput={(e) =>
                        setV("file_type_options", getInputEventValue(e))
                      }
                    />
                  </div>
                )}

                {hasVal("schema") && (
                  <div className="metafield-validation-group">
                    <div className="metafield-validation-group__label">
                      JSON schema
                    </div>
                    <s-text-area
                      label="JSON schema"
                      {...exclusiveFieldLabel}
                      placeholder='{ "type": "object" }'
                      value={vValues.schema || ""}
                      onInput={(e) => setV("schema", getInputEventValue(e))}
                    />
                  </div>
                )}

                {isList && hasVal("list.min") && hasVal("list.max") && (
                  <div className="metafield-validation-group">
                    <div className="metafield-validation-group__label">
                      Number of values
                    </div>
                    <div className="metafield-modal-flex-row">
                      <div className="metafield-modal-flex-row__item-1">
                        <s-text-field
                          label="Min"
                          {...exclusiveFieldLabel}
                          type="number"
                          placeholder="Min"
                          value={vValues["list.min"] || ""}
                          onInput={(e) =>
                            setV("list.min", getInputEventValue(e))
                          }
                        />
                      </div>
                      <div className="metafield-modal-flex-row__item-2">
                        <s-text-field
                          label="Max"
                          {...exclusiveFieldLabel}
                          type="number"
                          placeholder="Max"
                          value={vValues["list.max"] || ""}
                          onInput={(e) =>
                            setV("list.max", getInputEventValue(e))
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {uniqueApplicable && (
                  <div style={{ marginTop: "12px" }}>
                    <s-checkbox
                      label="Unique values only"
                      checked={uniqueValues}
                      onChange={(e) => setUniqueValues(getCheckboxChecked(e))}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="metafield-modal-card">
          <div className="metafield-modal-card__title">
            Options
            <span style={{ cursor: "help" }}>
              <s-icon type="info" size="small" color="subdued" />
            </span>
          </div>

          {loadingTypes ? (
            <p className="metafield-options-empty">Loading options…</p>
          ) : hasAnyOption ? (
            <div className="metafield-options-box">
              {optionList.map((opt) => (
                <div className="metafield-options-row" key={opt.key}>
                  <span className="metafield-options-row__label">
                    {opt.label}
                  </span>
                  <s-switch
                    checked={capabilityValues[opt.field] || undefined}
                    onChange={(e) =>
                      capabilitySetters[opt.field](getCheckboxChecked(e))
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="metafield-options-empty">
              The selected type doesn't support additional options.
            </p>
          )}

          <div style={{ marginTop: "16px" }}>
            <s-checkbox
              label="Pin definition"
              checked={pinned}
              onChange={(e) => setPinned(getCheckboxChecked(e))}
            />
          </div>
        </div>
      </div>

      <s-button slot="primary-action" variant="primary" onClick={handleSave}>
        Save definition
      </s-button>
      <s-button slot="secondary-actions" onClick={onClose}>
        Cancel
      </s-button>
    </s-modal>
  );
}
