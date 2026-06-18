import { useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTotalInventory,
  getVariantDisplayName,
  getVariantRowKey,
  findVariantIndex,
  isNewVariant,
  variantChildLabel,
  groupVariantsByKey,
  commonGroupValue,
  groupPriceLabel,
  getOptionValueKey,
} from "../../utils/productVariants";
import { getInputEventValue } from "../../utils/fieldEvent";
import ProductOptionsSection from "./ProductOptionsSection";
import ProductThumbnail from "./ProductThumbnail";
import MetafieldsCard from "../shared/metafields/MetafieldsCard";
import "../../styles/ProductVariants.css";

import { exclusiveFieldLabel } from "../../utils/formFields";

function NewBadge() {
  return <span className="variant-row__badge">New</span>;
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

  const variantMetafieldsModalRef = useRef(null);
  const [activeVariantId, setActiveVariantId] = useState(null);

  const openVariantMetafields = (variant) => {
    setActiveVariantId(variant.id || variant.shopifyId || "new");
    setTimeout(() => {
      variantMetafieldsModalRef.current?.showOverlay?.();
    }, 50);
  };

  const closeVariantMetafields = () => {
    variantMetafieldsModalRef.current?.hideOverlay?.();
    setActiveVariantId(null);
  };

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
    ? getOptionValueKey(options[safeGroupByIndex], safeGroupByIndex)
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
                      <s-icon
                        type="chevron-down"
                        className={`variant-group__chevron${!isCollapsed ? " variant-group__chevron--open" : ""}`}
                      />
                      <ProductThumbnail imageUrl={imageUrl} size={28} title={group.value} />
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
                            <ProductThumbnail imageUrl={imageUrl} size={28} title="Variant" />
                            <span className="variant-row__label" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                              <span>
                                {variantChildLabel(
                                  variant,
                                  options,
                                  safeGroupByIndex,
                                )}
                              </span>
                              {isNewVariant(variant) ? <NewBadge /> : null}
                              <s-button
                                variant="tertiary"
                                onClick={() => openVariantMetafields(variant)}
                              >
                                Metafields
                              </s-button>
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
                  <ProductThumbnail imageUrl={imageUrl} size={28} title="Variant" />
                  <span className="variant-row__label" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span>{getVariantDisplayName(variant)}</span>
                    {isNewVariant(variant) ? <NewBadge /> : null}
                    <s-button
                      variant="tertiary"
                      onClick={() => openVariantMetafields(variant)}
                    >
                      Metafields
                    </s-button>
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
      {activeVariantId && (
        <s-modal
          id="variant-metafields-modal"
          ref={variantMetafieldsModalRef}
          heading="Variant Metafields"
        >
          <div style={{ padding: "16px 0" }}>
            <MetafieldsCard
              entityType="variant"
              entityId={activeVariantId}
            />
          </div>
          <s-button slot="secondary-actions" onClick={closeVariantMetafields}>
            Close
          </s-button>
        </s-modal>
      )}
    </div>
  );
}
