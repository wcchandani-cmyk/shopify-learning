/**
 * Product options + variant helpers (Shopify-style variants section).
 */

export function parseProductOptions(product, variants = []) {
  let options = [];
  if (product?.optionsJson) {
    try {
      const parsed = JSON.parse(product.optionsJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        options = parsed;
      }
    } catch {
      /* fall through */
    }
  }
  if (!options.length) {
    options = deriveProductOptionsFromVariants(variants);
  }
  return options;
}

export function variantCombinationKey(option1, option2, option3) {
  return [option1, option2, option3]
    .map((value) => String(value || "").trim().toLowerCase())
    .join("|");
}

export function buildVariantCombinations(options = []) {
  const sorted = [...options].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );

  let combos = [[]];
  for (const option of sorted) {
    const values = (option.values || [])
      .map((value) => String(value).trim())
      .filter(Boolean);
    if (!values.length) continue;

    const next = [];
    for (const combo of combos) {
      for (const value of values) {
        next.push([...combo, value]);
      }
    }
    combos = next;
  }

  return combos.filter((combo) => combo.length > 0);
}

/** Rebuild variant rows when option values are added or removed. */
export function syncVariantsWithOptions(options, variants = []) {
  const combos = buildVariantCombinations(options);
  if (!combos.length) {
    const hasAnyValues = options.some((option) => (option.values || []).length > 0);
    if (!hasAnyValues && variants.length > 0) {
      const template = variants[0];
      return [
        {
          ...template,
          isNew: !template.id,
          clientId: template.clientId || `new-${Date.now()}`,
          title: "Default Title",
          option1: "Default Title",
          option2: "",
          option3: "",
          sku: template.sku || "",
          price: template.price || "0.00",
          inventoryQuantity: template.inventoryQuantity ?? "0",
        },
      ];
    }
    return variants;
  }

  const existingByKey = new Map();
  for (const variant of variants) {
    existingByKey.set(
      variantCombinationKey(variant.option1, variant.option2, variant.option3),
      variant,
    );
  }

  const template = variants[0];
  const defaultPrice = template?.price || "0.00";
  const defaultInventory = template?.inventoryQuantity ?? "0";

  return combos.map((values) => {
    const option1 = values[0] || "";
    const option2 = values[1] || "";
    const option3 = values[2] || "";
    const key = variantCombinationKey(option1, option2, option3);
    const label = values.filter(Boolean).join(" / ");
    const existing = existingByKey.get(key);

    if (existing) {
      return {
        ...existing,
        option1,
        option2,
        option3,
        title: label || existing.title,
      };
    }

    return createNewVariantDraft({
      name: label,
      price: defaultPrice,
      inventoryQuantity: defaultInventory,
      optionValues: values,
    });
  });
}

/** Keep option tags in sync when new variants are added in the UI. */
export function mergeOptionValuesFromVariants(options, variants = []) {
  if (!options.length) return options;

  return options.map((option, index) => {
    const position = option.position ?? index + 1;
    const key = `option${position}`;
    const values = [
      ...new Set([
        ...(option.values || []),
        ...variants
          .map((variant) => String(variant[key] || "").trim())
          .filter(Boolean),
      ]),
    ];
    return { ...option, position, values };
  });
}

export function deriveProductOptionsFromVariants(variants = []) {
  const options = [];
  for (let index = 1; index <= 3; index += 1) {
    const key = `option${index}`;
    const values = [
      ...new Set(
        variants
          .map((variant) => String(variant[key] || "").trim())
          .filter(Boolean),
      ),
    ];
    if (!values.length) continue;

    const nameKey = `${key}Name`;
    const nameFromVariant = variants.find((v) => v[nameKey])?.[nameKey];
    options.push({
      name: nameFromVariant || `Option ${index}`,
      values,
      position: index,
    });
  }
  return options;
}

export function getVariantDisplayName(variant) {
  const parts = [variant.option1, variant.option2, variant.option3]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  if (parts.length) return parts.join(" / ");
  return variant.title?.trim() || variant.sku?.trim() || "Variant";
}

export function getTotalInventory(variants = []) {
  return variants.reduce(
    (sum, variant) => sum + (Number(variant.inventoryQuantity) || 0),
    0,
  );
}

export function filterVariantsBySearch(variants, search) {
  const query = search.trim().toLowerCase();
  if (!query) return variants;

  return variants.filter((variant) => {
    const haystack = [
      getVariantDisplayName(variant),
      variant.sku,
      variant.title,
      variant.option1,
      variant.option2,
      variant.option3,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}

export const MAX_PRODUCT_OPTIONS = 3;

export function serializeProductOptions(options = []) {
  const normalized = options
    .slice(0, MAX_PRODUCT_OPTIONS)
    .map((option, index) => ({
      name: String(option.name || `Option ${index + 1}`).trim(),
      values: [...new Set((option.values || []).map((v) => String(v).trim()).filter(Boolean))],
      position: option.position ?? index + 1,
    }))
    .filter((option) => option.name && option.values.length > 0);

  return normalized.length ? JSON.stringify(normalized) : null;
}

export function createNewVariantDraft({
  name,
  price,
  inventoryQuantity,
  optionValues,
}) {
  const values = Array.isArray(optionValues)
    ? optionValues.map((v) => String(v || "").trim())
    : [];
  const title =
    values.filter(Boolean).join(" / ") ||
    String(name || "").trim() ||
    "Variant";

  return {
    isNew: true,
    clientId: `new-${Date.now()}`,
    id: null,
    title,
    sku: "",
    price: price != null && price !== "" ? String(price) : "0.00",
    inventoryQuantity:
      inventoryQuantity != null && inventoryQuantity !== ""
        ? String(inventoryQuantity)
        : "0",
    option1: values[0] || title,
    option2: values[1] || "",
    option3: values[2] || "",
  };
}

export function getVariantRowKey(variant) {
  return variant.clientId || String(variant.id);
}

export function findVariantIndex(variants, variant) {
  const key = getVariantRowKey(variant);
  return variants.findIndex((item) => getVariantRowKey(item) === key);
}

export function getOptionValueKey(option, optionIndex) {
  return `option${option.position ?? optionIndex + 1}`;
}

export function findVariantsForOptionValue(
  variants,
  option,
  optionIndex,
  value,
) {
  const optionKey = getOptionValueKey(option, optionIndex);
  const needle = String(value || "").trim();
  return variants
    .map((variant, index) => ({ variant, index }))
    .filter(
      ({ variant }) => String(variant[optionKey] || "").trim() === needle,
    );
}
