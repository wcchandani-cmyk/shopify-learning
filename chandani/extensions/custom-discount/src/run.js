// @ts-check

/**
 * Unified Discount API function.
 *
 * Two run targets, both belonging to the single Discount API:
 *   - cart.lines.discounts.generate.run        -> PRODUCT + ORDER discounts
 *   - cart.delivery-options.discounts.generate.run -> SHIPPING discounts
 *
 * Which class a discount applies to is driven by `discount.discountClasses`
 * (set on the discount node by the backend). The merchant's configuration is
 * read from the app-reserved metafield ($app:custom-discount /
 * function-configuration).
 */

const NO_CART_OPERATIONS = { operations: [] };
const NO_DELIVERY_OPERATIONS = { operations: [] };

/**
 * Evaluates a single rule condition against the cart.
 * @param {any} condition
 * @param {any} cart
 * @returns {boolean}
 */
function evaluateCondition(condition, cart) {
  if (!condition || !condition.type || !condition.value) return false;

  const customer = cart?.buyerIdentity?.customer;
  const billingAddress = cart?.billingAddress;
  const operator = condition.operator || "equals";
  const valStr = String(condition.value).trim().toLowerCase();

  /**
   * @param {number} actual
   * @param {number} target
   * @returns {boolean}
   */
  const compareNumeric = (actual, target) => {
    if (operator === "greater_than_or_equals") return actual >= target;
    if (operator === "less_than_or_equals") return actual <= target;
    return actual === target;
  };

  switch (condition.type) {
    case "total_amount":
    case "subtotal_amount": {
      const subtotal = parseFloat(cart?.cost?.subtotalAmount?.amount ?? "0");
      return compareNumeric(subtotal, parseFloat(condition.value));
    }
    case "total_weight": {
      const totalWeight = (cart?.lines || []).reduce((sum, line) => {
        const unitWeight =
          line?.merchandise?.__typename === "ProductVariant"
            ? line.merchandise.weight ?? 0
            : 0;
        return sum + unitWeight * (line.quantity ?? 0);
      }, 0);
      return compareNumeric(totalWeight, parseFloat(condition.value));
    }
    case "country_code": {
      const country = String(billingAddress?.countryCode || "").trim().toLowerCase();
      const hasCountry = Boolean(country) && country === valStr;
      return operator === "not_contains" ? !hasCountry : hasCountry;
    }
    case "province_code": {
      const province = String(billingAddress?.provinceCode || "").trim().toLowerCase();
      const hasProvince = Boolean(province) && province === valStr;
      return operator === "not_contains" ? !hasProvince : hasProvince;
    }
    case "zip_code": {
      const zip = String(billingAddress?.zip || "").trim().toLowerCase();
      const hasZip = Boolean(zip) && zip === valStr;
      return operator === "not_contains" ? !hasZip : hasZip;
    }
    case "city": {
      const city = String(billingAddress?.city || "").trim().toLowerCase();
      const hasCity = Boolean(city) && city === valStr;
      return operator === "not_contains" ? !hasCity : hasCity;
    }
    case "address_line": {
      const line1 = String(billingAddress?.address1 || "").toLowerCase();
      const line2 = String(billingAddress?.address2 || "").toLowerCase();
      const hasAddress =
        Boolean(valStr) && (line1.includes(valStr) || line2.includes(valStr));
      return operator === "not_contains" ? !hasAddress : hasAddress;
    }
    case "total_orders": {
      const orders = customer?.numberOfOrders ?? 0;
      return compareNumeric(orders, parseInt(condition.value, 10));
    }
    case "total_spend": {
      const spend = parseFloat(customer?.amountSpent?.amount ?? "0");
      return compareNumeric(spend, parseFloat(condition.value));
    }
    case "customer_tag": {
      const tagsStr = customer?.metafield?.value || "";
      const customerTags = tagsStr.split(",").map((t) => t.trim().toLowerCase());
      const wantedTags = (Array.isArray(condition.value)
        ? condition.value
        : String(condition.value).split(",")
      )
        .map((t) => String(t).trim().toLowerCase())
        .filter(Boolean);
      const hasTag = wantedTags.some((tag) => customerTags.includes(tag));
      return operator === "not_contains" ? !hasTag : hasTag;
    }
    case "sku": {
      const hasSku = (cart?.lines || []).some((line) => {
        if (line?.merchandise?.__typename === "ProductVariant") {
          const variantSku = line.merchandise.sku?.trim()?.toLowerCase() || "";
          return variantSku.includes(valStr);
        }
        return false;
      });
      return operator === "not_contains" ? !hasSku : hasSku;
    }
    case "product": {
      const wantedProducts = (Array.isArray(condition.value)
        ? condition.value
        : String(condition.value).split(",")
      )
        .map((p) => String(p).trim().toLowerCase())
        .filter(Boolean);
      const hasProduct = (cart?.lines || []).some((line) => {
        if (line?.merchandise?.__typename === "ProductVariant") {
          const prodId = line.merchandise.product?.id || "";
          return wantedProducts.includes(prodId.toLowerCase());
        }
        return false;
      });
      return operator === "not_contains" ? !hasProduct : hasProduct;
    }
    case "collection":
      // Collection membership can't be evaluated from the function input.
      return false;
    default:
      return false;
  }
}

/**
 * Reads and parses the merchant configuration from the discount metafield.
 * @param {any} input
 * @returns {any|null}
 */
function parseConfig(input) {
  const raw = input?.discount?.metafield?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse function configuration JSON:", err);
    return null;
  }
}

/**
 * Returns true when the configured conditions pass for the cart.
 * @param {any} config
 * @param {any} cart
 * @returns {boolean}
 */
function conditionsPass(config, cart) {
  const conditions = config.conditions || [];
  if (conditions.length === 0) return true;
  const results = conditions.map((cond) => evaluateCondition(cond, cart));
  return (config.combination || "all") === "any"
    ? results.some(Boolean)
    : results.every(Boolean);
}

/**
 * Resolves the numeric discount value and message for the cart, handling both
 * conditional and tiered campaigns. Returns null when no value applies.
 * @param {any} config
 * @param {any} cart
 * @returns {{ value: number, message: string }|null}
 */
function resolveAmount(config, cart) {
  const campaignType = config.campaignType || "conditional_discount";

  if (campaignType === "tiered_discount") {
    const tiers = config.tiers || [];
    const conditions = config.conditions || [];
    const hasProductOrSku = conditions.some(
      (c) => c.type === "product" || c.type === "sku"
    );

    let qtyToEvaluate = 0;
    if (hasProductOrSku) {
      qtyToEvaluate = (cart.lines || []).reduce((total, line) => {
        let matches = false;
        if (line?.merchandise?.__typename === "ProductVariant") {
          const prodId = line.merchandise.product?.id || "";
          const variantSku = line.merchandise.sku?.trim()?.toLowerCase() || "";
          matches = conditions.some((cond) => {
            const v = String(cond.value).trim().toLowerCase();
            if (cond.type === "product" && prodId.toLowerCase() === v) return true;
            if (cond.type === "sku" && variantSku === v) return true;
            return false;
          });
        }
        return matches ? total + line.quantity : total;
      }, 0);
    } else {
      qtyToEvaluate = (cart.lines || []).reduce(
        (total, line) => total + line.quantity,
        0
      );
    }

    const sorted = [...tiers].sort(
      (a, b) => parseInt(b.quantity, 10) - parseInt(a.quantity, 10)
    );
    const active = sorted.find((t) => qtyToEvaluate >= parseInt(t.quantity, 10));
    if (!active) return null;

    return {
      value: parseFloat(active.discountValue || "0"),
      message:
        active.message || config.discountMessage || config.title || "Tiered Discount",
    };
  }

  return {
    value: parseFloat(config.discountValue || "0"),
    message: config.discountMessage || config.title || "Custom Rule Discount",
  };
}

/**
 * Builds a discount candidate value object from the config.
 * @param {any} config
 * @param {number} amount
 * @returns {any}
 */
function buildValue(config, amount) {
  return config.discountType === "percentage"
    ? { percentage: { value: amount } }
    : { fixedAmount: { amount } };
}

/**
 * cart.lines.discounts.generate.run — handles PRODUCT and ORDER classes.
 * @param {any} input
 * @returns {any}
 */
export function cartLinesDiscountsGenerateRun(input) {
  const config = parseConfig(input);
  if (!config) return NO_CART_OPERATIONS;

  const classes = input?.discount?.discountClasses || [];
  const hasOrder = classes.includes("ORDER");
  const hasProduct = classes.includes("PRODUCT");
  if (!hasOrder && !hasProduct) return NO_CART_OPERATIONS;

  const cart = input?.cart;
  if (!cart || !cart.lines || cart.lines.length === 0) {
    return NO_CART_OPERATIONS;
  }

  if (!conditionsPass(config, cart)) return NO_CART_OPERATIONS;

  const computed = resolveAmount(config, cart);
  if (!computed || computed.value <= 0) return NO_CART_OPERATIONS;

  const value = buildValue(config, computed.value);
  const operations = [];

  if (hasOrder) {
    operations.push({
      orderDiscountsAdd: {
        selectionStrategy: "FIRST",
        candidates: [
          {
            message: computed.message,
            targets: [{ orderSubtotal: { excludedCartLineIds: [] } }],
            value,
          },
        ],
      },
    });
  }

  if (hasProduct) {
    operations.push({
      productDiscountsAdd: {
        selectionStrategy: "FIRST",
        candidates: [
          {
            message: computed.message,
            targets: cart.lines.map((line) => ({ cartLine: { id: line.id } })),
            value,
          },
        ],
      },
    });
  }

  return { operations };
}

/**
 * cart.delivery-options.discounts.generate.run — handles the SHIPPING class.
 * @param {any} input
 * @returns {any}
 */
export function cartDeliveryOptionsDiscountsGenerateRun(input) {
  const config = parseConfig(input);
  if (!config) return NO_DELIVERY_OPERATIONS;

  const classes = input?.discount?.discountClasses || [];
  if (!classes.includes("SHIPPING")) return NO_DELIVERY_OPERATIONS;

  const cart = input?.cart;
  const groups = cart?.deliveryGroups || [];
  if (groups.length === 0) return NO_DELIVERY_OPERATIONS;

  // At the delivery step the cart-level billingAddress is usually null; the
  // address the customer entered is the delivery group's shipping address.
  // Evaluate address-based conditions (country/province/zip/city/address) against
  // that shipping address so they actually match.
  const shippingAddress =
    groups.find((group) => group.deliveryAddress)?.deliveryAddress || null;
  const cartForConditions = shippingAddress
    ? { ...cart, billingAddress: shippingAddress }
    : cart;

  if (!conditionsPass(config, cartForConditions)) return NO_DELIVERY_OPERATIONS;

  const isFreeShipping = config.shippingDiscountType === "free_shipping";

  let value;
  let message;
  if (isFreeShipping) {
    value = { percentage: { value: 100 } };
    message = config.discountMessage || config.title || "Free shipping";
  } else {
    const computed = resolveAmount(config, cart);
    if (!computed || computed.value <= 0) return NO_DELIVERY_OPERATIONS;
    value = buildValue(config, computed.value);
    message = computed.message;
  }

  let targets;
  if (
    config.shippingMethodScope === "specific" &&
    (config.shippingMethods || []).length > 0
  ) {
    const wanted = config.shippingMethods.map((m) => String(m).toLowerCase());
    targets = groups.flatMap((group) =>
      (group.deliveryOptions || [])
        .filter((option) =>
          wanted.some((w) => (option.title || "").toLowerCase().includes(w))
        )
        .map((option) => ({ deliveryOption: { handle: option.handle } }))
    );
    if (targets.length === 0) return NO_DELIVERY_OPERATIONS;
  } else {
    targets = groups.map((group) => ({ deliveryGroup: { id: group.id } }));
  }

  return {
    operations: [
      {
        deliveryDiscountsAdd: {
          selectionStrategy: "ALL",
          candidates: [
            {
              message,
              targets,
              value,
            },
          ],
        },
      },
    ],
  };
}
