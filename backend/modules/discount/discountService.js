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
  const response = await client.get({ path: "price_rules" });
  const priceRules = response.body?.price_rules || [];
  const syncedShopifyIds = [];

  for (const rule of priceRules) {
    const shopifyId = `gid://shopify/PriceRule/${rule.id}`;
    syncedShopifyIds.push(shopifyId);

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
      console.warn(
        `Could not fetch discount codes for price rule ${rule.id}:`,
        err.message
      );
    }

    const existing = await Discount.findOne({
      where: { shopId: shop.id, shopifyId },
    });

    const type =
      existing?.type ||
      (rule.target_type === TARGET_TYPE.SHIPPING_LINE
        ? DISCOUNT_TYPE.FREE_SHIPPING
        : rule.prerequisite_to_entitlement_purchase_quantity != null
        ? DISCOUNT_TYPE.BUY_X_GET_Y
        : rule.allocation_method === "across"
        ? DISCOUNT_TYPE.AMOUNT_OFF_ORDER
        : DISCOUNT_TYPE.AMOUNT_OFF_PRODUCT);

    const eligibility =
      rule.customer_selection === "prerequisite"
        ? ELIGIBILITY.SPECIFIC_CUSTOMERS
        : ELIGIBILITY.ALL_CUSTOMERS;
    const status = computeStatus(rule.starts_at, rule.ends_at);

    const combines = rule.combines_with || {};
    const combinesWithProduct = existing
      ? existing.combinesWithProduct
      : !!combines.product_discounts;
    const combinesWithOrder = existing
      ? existing.combinesWithOrder
      : !!combines.order_discounts;
    const combinesWithShipping = existing
      ? existing.combinesWithShipping
      : !!combines.shipping_discounts;

    const summary = buildSummary({
      valueType: rule.value_type,
      value: rule.value,
      type,
    });

    const appliesTo =
      existing?.appliesTo ||
      (rule.entitled_product_ids?.length || rule.entitled_variant_ids?.length
        ? APPLIES_TO.PRODUCTS
        : rule.entitled_collection_ids?.length
        ? APPLIES_TO.COLLECTIONS
        : APPLIES_TO.ALL);

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

    if (existing) await existing.update(discountRecord);
    else await Discount.create(discountRecord);
  }

  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
  await Discount.destroy({
    where: {
      shopId: shop.id,
      shopifyId: { [Op.notIn]: syncedShopifyIds },
      updatedAt: { [Op.lt]: twoMinutesAgo },
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
