const { getRestClient } = require("../../utils/shopify");
const Discount = require("./model");
const { Op } = require("sequelize");
const {
  DISCOUNT_TYPE,
  DISCOUNT_METHOD,
  TARGET_TYPE,
  APPLIES_TO,
  PURCHASE_TYPE,
  ELIGIBILITY,
} = require("./constants");
const { computeStatus, buildSummary } = require("./discountMappers");

async function syncDiscountsFromShopify(shop) {
  const client = getRestClient(shop);

  // Fetch price rules via REST
  const response = await client.get({
    path: "price_rules",
  });
  const priceRules = response.body?.price_rules || [];
  const syncedShopifyIds = [];

  for (const rule of priceRules) {
    const shopifyId = `gid://shopify/PriceRule/${rule.id}`;
    syncedShopifyIds.push(shopifyId);

    // Fetch discount codes for this price rule
    let title = rule.title || "";
    let method = DISCOUNT_METHOD.AUTOMATIC;

    try {
      const codesResponse = await client.get({
        path: `price_rules/${rule.id}/discount_codes`,
      });
      const codes = codesResponse.body?.discount_codes || [];
      if (codes.length > 0) {
        title = codes[0].code;
        method = DISCOUNT_METHOD.CODE;
      }
    } catch (err) {
      console.warn(`Could not fetch discount codes for price rule ${rule.id}:`, err.message);
    }

    const existing = await Discount.findOne({
      where: { shopId: shop.id, shopifyId }
    });

    // The create/update flow is the source of truth for `type` (Shopify's
    // price-rule fields can't reliably distinguish product vs order, and BXGY
    // detection is fragile). Only derive a type for discounts we are seeing for
    // the first time (e.g. created directly in the Shopify admin).
    let type = existing?.type;
    if (!type) {
      type = DISCOUNT_TYPE.AMOUNT_OFF_PRODUCT;
      if (rule.target_type === TARGET_TYPE.SHIPPING_LINE) {
        type = DISCOUNT_TYPE.FREE_SHIPPING;
      } else if (rule.prerequisite_to_entitlement_purchase_quantity != null) {
        type = DISCOUNT_TYPE.BUY_X_GET_Y;
      } else if (rule.allocation_method === "across") {
        type = DISCOUNT_TYPE.AMOUNT_OFF_ORDER;
      }
    }

    // Eligibility
    let eligibility = ELIGIBILITY.ALL_CUSTOMERS;
    if (rule.customer_selection === "prerequisite") {
      eligibility = ELIGIBILITY.SPECIFIC_CUSTOMERS;
    }

    const status = computeStatus(rule.starts_at, rule.ends_at);

    // Combinations: the Shopify REST price-rule API does NOT support
    // `combines_with` (it's GraphQL-only), so `rule.combines_with` is always
    // undefined here. The local DB is the source of truth — keep its values for
    // known discounts and only fall back to Shopify for first-seen ones.
    const combines = rule.combines_with || {};
    const combinesWithProduct = existing
      ? existing.combinesWithProduct
      : Boolean(combines.product_discounts);
    const combinesWithOrder = existing
      ? existing.combinesWithOrder
      : Boolean(combines.order_discounts);
    const combinesWithShipping = existing
      ? existing.combinesWithShipping
      : Boolean(combines.shipping_discounts);

    const summary = buildSummary({
      valueType: rule.value_type,
      value: rule.value,
      type,
    });

    const appliesTo = existing?.appliesTo || (
      (rule.entitled_product_ids?.length || rule.entitled_variant_ids?.length) ? APPLIES_TO.PRODUCTS :
        (rule.entitled_collection_ids?.length ? APPLIES_TO.COLLECTIONS : APPLIES_TO.ALL)
    );

    const discountRecord = {
      shopId: shop.id,
      shopifyId,
      title,
      summary,
      status,
      method,
      eligibility,
      type,
      combinesWithProduct,
      combinesWithOrder,
      combinesWithShipping,
      usedCount: 0,
      appliesTo,
      purchaseType: existing?.purchaseType || PURCHASE_TYPE.ONE_TIME,
      selectedItems: existing?.selectedItems || null,
    };

    if (existing) {
      await existing.update(discountRecord);
    } else {
      await Discount.create(discountRecord);
    }
  }

  // Clean up deleted ones (excluding those created/updated in the last 2 minutes to prevent Shopify API replication lag deletion)
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
  await Discount.destroy({
    where: {
      shopId: shop.id,
      shopifyId: {
        [Op.notIn]: syncedShopifyIds,
      },
      updatedAt: {
        [Op.lt]: twoMinutesAgo,
      },
    },
  });
}

async function removeDiscounts(shop, ids) {
  const discounts = await Discount.findAll({
    where: { id: ids, shopId: shop.id },
  });

  const client = getRestClient(shop);
  const deletedIds = [];

  for (const discount of discounts) {
    const priceRuleId = discount.shopifyId.split("/").pop();
    try {
      await client.delete({ path: `price_rules/${priceRuleId}` });
    } catch (shopifyError) {
      console.warn(
        `Could not delete price rule ${priceRuleId} on Shopify:`,
        shopifyError.message
      );
    }
    await discount.destroy();
    deletedIds.push(discount.id);
  }

  return { deletedIds };
}

module.exports = { syncDiscountsFromShopify, removeDiscounts };
