import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTotalInventory,
  getVariantDisplayName,
  getVariantRowKey,
  findVariantIndex,
} from "../../utils/productVariants";
import { getInputEventValue } from "../../utils/fieldEvent";
import ProductOptionsSection from "./ProductOptionsSection";
import "../../styles/ProductVariants.css";

import { exclusiveFieldLabel } from "../../utils/formFields";

function Chevron({ open }) {
  return (
    <svg
      className={`variant-group__chevron${open ? " variant-group__chevron--open" : ""}`}
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 8l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VariantThumb({ imageUrl }) {
  if (imageUrl) {
    return (
      <span className="variant-row__thumb">
        <img src={imageUrl} alt="" />
      </span>
    );
  }
  return (
    <span className="variant-row__thumb variant-row__thumb--placeholder">
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect
          x="2.5"
          y="3.5"
          width="15"
          height="13"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        <circle cx="7" cy="8" r="1.4" fill="currentColor" />
        <path
          d="M4 15l4-4 3 3 2-2 3 3"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function NewBadge() {
  return <span className="variant-row__badge">New</span>;
}

const isNewVariant = (variant) =>
  variant.isNew === true || variant.isNew === "true" || !variant.id;

const optionFieldKey = (option, index) =>
  `option${option?.position ?? index + 1}`;

/** Label for a variant from every option except the one we grouped by. */
function variantChildLabel(variant, options, groupByIndex) {
  const label = (options || [])
    .map((option, index) => ({ option, index }))
    .filter(({ index }) => index !== groupByIndex)
    .map(({ option, index }) =>
      String(variant[optionFieldKey(option, index)] || "").trim(),
    )
    .filter(Boolean)
    .join(" / ");
  return label || getVariantDisplayName(variant);
}

function groupVariantsByKey(variants, key) {
  const groups = [];
  const indexByValue = new Map();

  variants.forEach((variant) => {
    const value = String(variant[key] || "").trim() || "—";
    if (!indexByValue.has(value)) {
      indexByValue.set(value, groups.length);
      groups.push({ value, items: [] });
    }
    groups[indexByValue.get(value)].items.push(variant);
  });

  return groups;
}

function commonGroupValue(items, field) {
  if (!items.length) return "";
  const first = String(items[0][field] ?? "");
  return items.every((item) => String(item[field] ?? "") === first)
    ? first
    : "";
}

function groupPriceLabel(items) {
  const prices = items.map((item) =>
    item.price != null && item.price !== "" ? Number(item.price) : null,
  );
  const valid = prices.filter((price) => price != null && !Number.isNaN(price));
  if (!valid.length) return "—";
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  if (min === max) return `$${min.toFixed(2)}`;
  return `$${min.toFixed(2)} – $${max.toFixed(2)}`;
}

export default function ProductVariantSection({
  productId,
  isNew = false,
  productTitle,
  productStatus,
  imageUrl,
  variants,
  options,
  onOptionsChange,
  onOptionEditCommit,
  onOptionsReorder,
  onVariantChange,
  draftNavigationState,
}) {
  const navigate = useNavigate();
  const [collapsedGroups, setCollapsedGroups] = useState(() => new Set());
  const [groupByIndex, setGroupByIndex] = useState(0);

  const totalInventory = useMemo(
    () => getTotalInventory(variants),
    [variants],
  );

  const hasNestedOptions = useMemo(
    () =>
      variants.some(
        (variant) =>
          String(variant.option2 || "").trim() ||
          String(variant.option3 || "").trim(),
      ),
    [variants],
  );

  const safeGroupByIndex =
    options && options.length
      ? Math.min(groupByIndex, options.length - 1)
      : 0;

  const groupByKey = options?.[safeGroupByIndex]
    ? optionFieldKey(options[safeGroupByIndex], safeGroupByIndex)
    : "option1";

  const groups = useMemo(
    () => groupVariantsByKey(variants, groupByKey),
    [variants, groupByKey],
  );

  const toggleGroup = (value) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  // Editing a group's Price/Available applies the value to every variant in it.
  const applyGroupField = (items, field, value) => {
    items.forEach((item) => {
      const index = findVariantIndex(variants, item);
      if (index >= 0) onVariantChange(index, field, value);
    });
  };

  const openAddVariantPage = () => {
    const path = isNew
      ? "/products/new/variants/new"
      : `/products/${productId}/variants/new`;

    navigate(path, {
      state: {
        product: {
          id: productId,
          title: productTitle,
          status: productStatus,
          imageUrl,
        },
        draft: draftNavigationState?.draft,
        draftVariants: variants,
        draftOptions: options,
        productTypes: draftNavigationState?.productTypes,
      },
    });
  };

  return (
    <div className="product-variants">
      <div className="product-variants__header">
        <span className="product-variants__title">Variants</span>
        <s-button variant="tertiary" onClick={openAddVariantPage}>
          + Add variant
        </s-button>
      </div>

      <ProductOptionsSection
        options={options}
        variants={variants}
        onOptionsChange={onOptionsChange}
        onOptionEditCommit={onOptionEditCommit}
        onOptionsReorder={onOptionsReorder}
      />

      {variants.length === 0 ? (
        <p className="product-variants__empty">
          No variants yet. Add an option or variant.
        </p>
      ) : hasNestedOptions ? (
        <>
          <div className="variant-toolbar">
            <span className="variant-toolbar__label">Group by</span>
            <div className="variant-toolbar__select">
              <s-select
                label="Group by"
                {...exclusiveFieldLabel}
                value={String(safeGroupByIndex)}
                onChange={(event) =>
                  setGroupByIndex(Number(getInputEventValue(event)) || 0)
                }
              >
                {(options || []).map((option, index) => (
                  <s-option key={index} value={String(index)}>
                    {option.name || `Option ${index + 1}`}
                  </s-option>
                ))}
              </s-select>
            </div>
          </div>
          <div className="variant-table-head">
            <span className="variant-table-head__variant">Variant</span>
            <span className="variant-table-head__price">Price</span>
            <span className="variant-table-head__available">Available</span>
          </div>
          <div className="variant-groups">
            {groups.map((group) => {
              const isCollapsed = collapsedGroups.has(group.value);
              const groupInventory = getTotalInventory(group.items);
              return (
                <div className="variant-group" key={group.value}>
                  <div className="variant-group__header">
                    <button
                      type="button"
                      className="variant-group__toggle"
                      aria-expanded={!isCollapsed}
                      onClick={() => toggleGroup(group.value)}
                    >
                      <Chevron open={!isCollapsed} />
                      <VariantThumb imageUrl={imageUrl} />
                      <span className="variant-group__title">
                        <span className="variant-group__name">
                          {group.value}
                        </span>
                        <span className="variant-group__count">
                          {group.items.length}{" "}
                          {group.items.length === 1 ? "variant" : "variants"}
                        </span>
                      </span>
                    </button>
                    <div className="variant-row__price">
                      <s-money-field
                        label="Price"
                        {...exclusiveFieldLabel}
                        value={commonGroupValue(group.items, "price")}
                        placeholder={groupPriceLabel(group.items)}
                        onInput={(event) =>
                          applyGroupField(
                            group.items,
                            "price",
                            getInputEventValue(event),
                          )
                        }
                      />
                    </div>
                    <div className="variant-row__available">
                      <s-text-field
                        label="Available"
                        {...exclusiveFieldLabel}
                        value={commonGroupValue(group.items, "inventoryQuantity")}
                        placeholder={String(groupInventory)}
                        inputMode="numeric"
                        onInput={(event) =>
                          applyGroupField(
                            group.items,
                            "inventoryQuantity",
                            getInputEventValue(event),
                          )
                        }
                        onChange={(event) =>
                          applyGroupField(
                            group.items,
                            "inventoryQuantity",
                            getInputEventValue(event),
                          )
                        }
                      />
                    </div>
                  </div>

                  {!isCollapsed ? (
                    <div className="variant-group__children">
                      {group.items.map((variant) => {
                        const index = findVariantIndex(variants, variant);
                        const rowKey = getVariantRowKey(variant);
                        return (
                          <div className="variant-row" key={rowKey}>
                            <VariantThumb imageUrl={imageUrl} />
                            <span className="variant-row__label">
                              {variantChildLabel(
                                variant,
                                options,
                                safeGroupByIndex,
                              )}
                              {isNewVariant(variant) ? <NewBadge /> : null}
                            </span>
                            <div className="variant-row__price">
                              <s-money-field
                                label="Price"
                                {...exclusiveFieldLabel}
                                value={variant.price}
                                onInput={(event) =>
                                  onVariantChange(
                                    index,
                                    "price",
                                    getInputEventValue(event),
                                  )
                                }
                              />
                            </div>
                            <div className="variant-row__available">
                              <s-text-field
                                label="Available"
                                {...exclusiveFieldLabel}
                                value={variant.inventoryQuantity}
                                inputMode="numeric"
                                onInput={(event) =>
                                  onVariantChange(
                                    index,
                                    "inventoryQuantity",
                                    getInputEventValue(event),
                                  )
                                }
                                onChange={(event) =>
                                  onVariantChange(
                                    index,
                                    "inventoryQuantity",
                                    getInputEventValue(event),
                                  )
                                }
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <p className="product-variants__footer">
            Total inventory across all locations: {totalInventory} available
          </p>
        </>
      ) : (
        <>
          <div className="variant-groups">
            {variants.map((variant) => {
              const index = findVariantIndex(variants, variant);
              const rowKey = getVariantRowKey(variant);
              return (
                <div className="variant-row variant-row--flat" key={rowKey}>
                  <VariantThumb imageUrl={imageUrl} />
                  <span className="variant-row__label">
                    {getVariantDisplayName(variant)}
                    {isNewVariant(variant) ? <NewBadge /> : null}
                  </span>
                  <div className="variant-row__price">
                    <s-money-field
                      label="Price"
                      {...exclusiveFieldLabel}
                      value={variant.price}
                      onInput={(event) =>
                        onVariantChange(
                          index,
                          "price",
                          getInputEventValue(event),
                        )
                      }
                    />
                  </div>
                  <div className="variant-row__available">
                    <s-text-field
                      label="Available"
                      {...exclusiveFieldLabel}
                      value={variant.inventoryQuantity}
                      inputMode="numeric"
                      onInput={(event) =>
                        onVariantChange(
                          index,
                          "inventoryQuantity",
                          getInputEventValue(event),
                        )
                      }
                      onChange={(event) =>
                        onVariantChange(
                          index,
                          "inventoryQuantity",
                          getInputEventValue(event),
                        )
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="product-variants__footer">
            Total inventory: {totalInventory} available
          </p>
        </>
      )}
    </div>
  );
}
