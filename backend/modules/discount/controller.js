const { successResponse, errorResponse } = require("../../utils/response");
const { getRestClient, getGraphQLClient } = require("../../utils/shopify");
const { parsePageSize, handleError } = require("../../utils/controllerHelper");
const Discount = require("./model");
const Comment = require("../comment/model");
const { createCommentHandlers } = require("../comment/controller");
const {
  syncDiscountsFromShopify,
  removeDiscounts,
} = require("./discountService");
const {
  DISCOUNT_TYPE,
  DISCOUNT_METHOD,
  VALUE_TYPE,
  TARGET_TYPE,
  ALLOCATION_METHOD,
  TARGET_SELECTION,
  APPLIES_TO,
  PURCHASE_TYPE,
  ELIGIBILITY,
} = require("./constants");
const {
  computeStatus,
  buildSummary,
  serializeSelectedItems,
  validateDiscountPayload,
} = require("./discountMappers");

const bxgySummaryInput = (body) => ({
  customerBuysQuantity: body.bxgyCustomerBuysQuantity,
  customerGetsQuantity: body.bxgyCustomerGetsQuantity,
  customerGetsDiscountType: body.bxgyCustomerGetsDiscountType,
  customerGetsDiscountValue: body.bxgyCustomerGetsDiscountValue,
});

const getShopifyCountryIds = async (client, isoCodes) => {
  if (!isoCodes?.length) return [];
  try {
    const response = await client.get({ path: "countries" });
    const countries = response.body?.countries || [];
    const upperCodes = new Set(isoCodes.map((code) => code.toUpperCase()));
    return countries
      .filter((country) => upperCodes.has(country.code.toUpperCase()))
      .map((country) => country.id);
  } catch (err) {
    console.error("Error fetching country IDs from Shopify:", err.message);
    return [];
  }
};

const getShopRecord = (req) => req.shop;

const SHIPPING_COUNTRIES_QUERY = `
  query shippingZoneCountries {
    deliveryProfiles(first: 50) {
      edges {
        node {
          profileLocationGroups {
            locationGroupZones(first: 100) {
              edges {
                node {
                  zone {
                    countries {
                      code { countryCode restOfWorld }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const getShippableCountries = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const { graphqlClient } = getGraphQLClient({
      shopDomain: shop.myshopifyDomain,
      accessToken: shop.token,
    });
    const response = await graphqlClient.request(SHIPPING_COUNTRIES_QUERY);
    const profiles = response.data?.deliveryProfiles?.edges || [];

    const codeSet = new Set();
    let includeRestOfWorld = false;

    for (const edge of profiles) {
      for (const group of edge.node?.profileLocationGroups || []) {
        for (const zone of group.locationGroupZones?.edges || []) {
          for (const country of zone.node?.zone?.countries || []) {
            if (country.code?.restOfWorld) includeRestOfWorld = true;
            else if (country.code?.countryCode)
              codeSet.add(country.code.countryCode.toLowerCase());
          }
        }
      }
    }

    successResponse(res, 200, "Shippable countries fetched successfully", {
      countryCodes: Array.from(codeSet),
      includeRestOfWorld,
    });
  } catch (error) {
    console.error("Error fetching shippable countries:", error.message);
    handleError(res, error, "Failed to fetch shippable countries");
  }
};

const resolveShopDiscount = async (req) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1)
    return { error: [400, "Invalid discount id"] };
  const discount = await Discount.findOne({
    where: { id, shopId: req.shop.id },
  });
  return discount
    ? { shop: req.shop, discount }
    : { error: [404, "Discount not found"] };
};

const extractNumericId = (gid) => {
  if (!gid) return null;
  const clean = String(gid).replace(/^customer-/, "");
  const id = parseInt(clean.split("/").pop(), 10);
  return isNaN(id) ? null : id;
};

const mapEntitledFields = (priceRule, appliesTo, selectedItems) => {
  if (appliesTo === APPLIES_TO.PRODUCTS && Array.isArray(selectedItems)) {
    priceRule.target_selection = TARGET_SELECTION.ENTITLED;
    priceRule.entitled_product_ids = [];
    priceRule.entitled_variant_ids = [];
    for (const item of selectedItems) {
      const pId = extractNumericId(item.id);
      if (!pId) continue;
      const variants = item.variants || [];
      const selected = variants.filter((variant) => variant.selected);
      if (selected.length > 0 && selected.length < variants.length) {
        selected.forEach((variant) => {
          const vId = extractNumericId(variant.id);
          if (vId) priceRule.entitled_variant_ids.push(vId);
        });
      } else {
        priceRule.entitled_product_ids.push(pId);
      }
    }
  } else if (
    appliesTo === APPLIES_TO.COLLECTIONS &&
    Array.isArray(selectedItems)
  ) {
    priceRule.target_selection = TARGET_SELECTION.ENTITLED;
    priceRule.entitled_collection_ids = selectedItems
      .map((item) => extractNumericId(item.id))
      .filter(Boolean);
  } else if (priceRule.target_type !== TARGET_TYPE.SHIPPING_LINE) {
    priceRule.target_selection = TARGET_SELECTION.ALL;
  }
};

const mapBxgyFields = (priceRule, body) => {
  const {
    bxgyCustomerBuysType,
    bxgyCustomerBuysQuantity,
    bxgyCustomerBuysAmount,
    bxgyCustomerBuysAppliesTo,
    bxgyCustomerBuysSelectedItems,
    bxgyCustomerGetsQuantity,
    bxgyCustomerGetsAppliesTo,
    bxgyCustomerGetsSelectedItems,
    bxgyCustomerGetsDiscountType,
    bxgyCustomerGetsDiscountValue,
    bxgySetMaxUsesPerOrder,
    bxgyMaxUsesPerOrderValue,
  } = body;

  priceRule.target_selection = TARGET_SELECTION.ENTITLED;
  priceRule.allocation_method = ALLOCATION_METHOD.EACH;

  const buysQty = parseInt(bxgyCustomerBuysQuantity || 1, 10);
  const getsQty = parseInt(bxgyCustomerGetsQuantity || 1, 10);

  priceRule.prerequisite_product_ids = [];
  priceRule.prerequisite_variant_ids = [];
  priceRule.prerequisite_collection_ids = [];

  if (bxgyCustomerBuysType === "amount") {
    priceRule.prerequisite_to_entitlement_subtotal = {
      amount: String(parseFloat(bxgyCustomerBuysAmount || 0)),
    };
    priceRule.prerequisite_to_entitlement_quantity_ratio = null;
  } else {
    priceRule.prerequisite_to_entitlement_quantity_ratio = {
      prerequisite_quantity: buysQty,
      entitled_quantity: getsQty,
    };
    priceRule.prerequisite_to_entitlement_subtotal = null;

    if (
      bxgyCustomerBuysAppliesTo === APPLIES_TO.PRODUCTS &&
      Array.isArray(bxgyCustomerBuysSelectedItems)
    ) {
      for (const item of bxgyCustomerBuysSelectedItems) {
        const pId = extractNumericId(item.id);
        if (!pId) continue;
        const variants = item.variants || [];
        const selected = variants.filter((variant) => variant.selected);
        if (selected.length > 0 && selected.length < variants.length) {
          selected.forEach((variant) => {
            const vId = extractNumericId(variant.id);
            if (vId) priceRule.prerequisite_variant_ids.push(vId);
          });
        } else {
          priceRule.prerequisite_product_ids.push(pId);
        }
      }
    } else if (
      bxgyCustomerBuysAppliesTo === APPLIES_TO.COLLECTIONS &&
      Array.isArray(bxgyCustomerBuysSelectedItems)
    ) {
      priceRule.prerequisite_collection_ids = bxgyCustomerBuysSelectedItems
        .map((item) => extractNumericId(item.id))
        .filter(Boolean);
    }
  }

  priceRule.value_type =
    bxgyCustomerGetsDiscountType === VALUE_TYPE.FIXED_AMOUNT
      ? VALUE_TYPE.FIXED_AMOUNT
      : VALUE_TYPE.PERCENTAGE;
  priceRule.value = `-${Math.abs(
    parseFloat(
      bxgyCustomerGetsDiscountType === "free"
        ? 100
        : bxgyCustomerGetsDiscountValue || 0
    )
  )}`;
  priceRule.allocation_limit =
    bxgySetMaxUsesPerOrder && bxgyMaxUsesPerOrderValue
      ? parseInt(bxgyMaxUsesPerOrderValue, 10)
      : null;

  priceRule.entitled_product_ids = [];
  priceRule.entitled_variant_ids = [];
  priceRule.entitled_collection_ids = [];

  if (
    bxgyCustomerGetsAppliesTo === APPLIES_TO.PRODUCTS &&
    Array.isArray(bxgyCustomerGetsSelectedItems)
  ) {
    for (const item of bxgyCustomerGetsSelectedItems) {
      const pId = extractNumericId(item.id);
      if (!pId) continue;
      const variants = item.variants || [];
      const selected = variants.filter((variant) => variant.selected);
      if (selected.length > 0 && selected.length < variants.length) {
        selected.forEach((variant) => {
          const vId = extractNumericId(variant.id);
          if (vId) priceRule.entitled_variant_ids.push(vId);
        });
      } else {
        priceRule.entitled_product_ids.push(pId);
      }
    }
  } else if (
    bxgyCustomerGetsAppliesTo === APPLIES_TO.COLLECTIONS &&
    Array.isArray(bxgyCustomerGetsSelectedItems)
  ) {
    priceRule.entitled_collection_ids = bxgyCustomerGetsSelectedItems
      .map((item) => extractNumericId(item.id))
      .filter(Boolean);
  }
};

const listDiscounts = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    try {
      await syncDiscountsFromShopify(shop);
    } catch (syncError) {
      console.error(
        "Error syncing discounts from Shopify REST API:",
        syncError.message
      );
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = parsePageSize(req.query.limit, 10, 50);

    const { count: total, rows: discounts } = await Discount.findAndCountAll({
      where: { shopId: shop.id },
      order: [["updatedAt", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    });

    const totalPages = Math.max(1, Math.ceil(total / limit));

    successResponse(res, 200, "Discounts fetched successfully", {
      returnedCount: discounts.length,
      discounts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    handleError(res, error, "Failed to list discounts");
  }
};

const createDiscount = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const {
      title,
      method,
      type,
      valueType,
      value,
      combinesWithProduct,
      combinesWithOrder,
      combinesWithShipping,
      startsAt,
      endsAt,
      minimumRequirementType,
      minimumRequirementValue,
      limitTotalUses,
      limitTotalUsesValue,
      limitOnePerCustomer,
      appliesTo,
      purchaseType,
      selectedItems,
      eligibility,
    } = req.body;

    const validationError = validateDiscountPayload(req.body);
    if (validationError) return errorResponse(res, 400, validationError);

    const client = getRestClient(shop);

    let targetType = TARGET_TYPE.LINE_ITEM;
    let targetSelection = TARGET_SELECTION.ALL;
    let allocationMethod = ALLOCATION_METHOD.ACROSS;
    let shopifyValueType =
      valueType === VALUE_TYPE.FIXED_AMOUNT
        ? VALUE_TYPE.FIXED_AMOUNT
        : VALUE_TYPE.PERCENTAGE;
    let shopifyValue = `-${Math.abs(parseFloat(value || 0))}`;

    let entitledCountryIds = [];

    if (type === DISCOUNT_TYPE.FREE_SHIPPING) {
      targetType = TARGET_TYPE.SHIPPING_LINE;
      allocationMethod = ALLOCATION_METHOD.EACH;
      shopifyValueType = VALUE_TYPE.PERCENTAGE;
      shopifyValue = "-100.0";
      if (
        req.body.shippingCountries === "selected" &&
        Array.isArray(req.body.selectedCountries)?.length
      ) {
        entitledCountryIds = await getShopifyCountryIds(
          client,
          req.body.selectedCountries
        );
        if (entitledCountryIds.length)
          targetSelection = TARGET_SELECTION.ENTITLED;
      }
    } else if (type === DISCOUNT_TYPE.BUY_X_GET_Y) {
      shopifyValueType = VALUE_TYPE.PERCENTAGE;
      shopifyValue = "-100.0";
    }

    const priceRule = {
      title,
      target_type: targetType,
      target_selection: targetSelection,
      allocation_method: allocationMethod,
      value_type: shopifyValueType,
      value: shopifyValue,
      customer_selection:
        eligibility === "Specific customers" &&
        req.body.selectedCustomers?.length
          ? "prerequisite"
          : "all",
      starts_at: startsAt || new Date().toISOString(),
      ends_at: endsAt || null,
      combines_with: {
        product_discounts: !!combinesWithProduct,
        order_discounts: !!combinesWithOrder,
        shipping_discounts: !!combinesWithShipping,
      },
      once_per_customer: !!limitOnePerCustomer,
    };

    if (priceRule.customer_selection === "prerequisite") {
      priceRule.prerequisite_customer_ids = req.body.selectedCustomers
        .map((customer) => extractNumericId(customer.id))
        .filter(Boolean);
    }

    if (
      type === DISCOUNT_TYPE.FREE_SHIPPING &&
      targetSelection === TARGET_SELECTION.ENTITLED
    ) {
      priceRule.entitled_country_ids = entitledCountryIds;
    } else if (type === DISCOUNT_TYPE.BUY_X_GET_Y) {
      mapBxgyFields(priceRule, req.body);
    } else {
      mapEntitledFields(priceRule, appliesTo, selectedItems);
    }

    if (type === DISCOUNT_TYPE.FREE_SHIPPING && req.body.excludeShippingRates) {
      priceRule.prerequisite_shipping_price_range = {
        less_than_or_equal_to: parseFloat(
          String(req.body.excludeShippingRatesValue || "").replace(/,/g, "") ||
            0
        ),
      };
    }

    if (limitTotalUses && limitTotalUsesValue)
      priceRule.usage_limit = parseInt(limitTotalUsesValue, 10);

    if (minimumRequirementType === "amount" && minimumRequirementValue) {
      priceRule.prerequisite_subtotal_range = {
        greater_than_or_equal_to: parseFloat(minimumRequirementValue),
      };
    } else if (
      minimumRequirementType === "quantity" &&
      minimumRequirementValue
    ) {
      priceRule.prerequisite_quantity_range = {
        greater_than_or_equal_to: parseInt(minimumRequirementValue, 10),
      };
    }

    const prResponse = await client.post({
      path: "price_rules",
      type: "application/json",
      data: { price_rule: priceRule },
    });

    const createdPriceRule = prResponse.body?.price_rule;
    if (!createdPriceRule?.id)
      throw new Error("Failed to create price rule on Shopify");

    const priceRuleId = createdPriceRule.id;
    const shopifyId = `gid://shopify/PriceRule/${priceRuleId}`;

    let finalTitle = title;
    if (method === DISCOUNT_METHOD.CODE) {
      const codeResponse = await client.post({
        path: `price_rules/${priceRuleId}/discount_codes`,
        type: "application/json",
        data: { discount_code: { code: title } },
      });
      if (codeResponse.body?.discount_code?.code)
        finalTitle = codeResponse.body.discount_code.code;
    }

    const summary = buildSummary({
      valueType: shopifyValueType,
      value: shopifyValue,
      type,
      bxgy: bxgySummaryInput(req.body),
    });

    const status = computeStatus(
      createdPriceRule.starts_at,
      createdPriceRule.ends_at
    );
    const finalSelectedItems = serializeSelectedItems(type, req.body);

    const discount = await Discount.create({
      shopId: shop.id,
      shopifyId,
      title: finalTitle,
      summary,
      status,
      method,
      eligibility: eligibility || ELIGIBILITY.ALL_CUSTOMERS,
      type,
      combinesWithProduct: !!combinesWithProduct,
      combinesWithOrder: !!combinesWithOrder,
      combinesWithShipping: !!combinesWithShipping,
      usedCount: 0,
      appliesTo: appliesTo || APPLIES_TO.ALL,
      purchaseType: purchaseType || PURCHASE_TYPE.ONE_TIME,
      selectedItems: finalSelectedItems,
    });

    successResponse(res, 201, "Discount created successfully", discount);
  } catch (error) {
    handleError(res, error, "Failed to create discount");
  }
};

const formatTimeFromISO = (iso) => {
  if (!iso || !iso.includes("T")) return "12:00 AM";
  const [_, timePart] = iso.split("T");
  const [hoursStr, minutesStr] = timePart.split(":");
  let hours = parseInt(hoursStr, 10) || 0;
  const minutes = parseInt(minutesStr, 10) || 0;
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes < 10 ? "0" + minutes : minutes} ${ampm}`;
};

const getDiscount = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const { id } = req.params;

    const discount = await Discount.findOne({ where: { id, shopId: shop.id } });
    if (!discount)
      return errorResponse(res, 404, "Discount not found in local database.");

    const priceRuleId = discount.shopifyId.split("/").pop();
    const client = getRestClient(shop);

    const shopifyResponse = await client.get({
      path: `price_rules/${priceRuleId}`,
    });
    const rule = shopifyResponse.body?.price_rule;
    if (!rule)
      return errorResponse(
        res,
        404,
        "Discount price rule not found on Shopify."
      );

    let discountTitle = rule.title;
    if (discount.method === DISCOUNT_METHOD.CODE) {
      try {
        const codesResponse = await client.get({
          path: `price_rules/${priceRuleId}/discount_codes`,
        });
        if (codesResponse.body?.discount_codes?.length)
          discountTitle = codesResponse.body.discount_codes[0].code;
      } catch (err) {
        console.warn(
          `Could not fetch discount codes for ${priceRuleId}:`,
          err.message
        );
      }
    }

    const value = rule.value ? String(Math.abs(parseFloat(rule.value))) : "";
    const valueType =
      rule.value_type === VALUE_TYPE.PERCENTAGE
        ? VALUE_TYPE.PERCENTAGE
        : VALUE_TYPE.FIXED_AMOUNT;

    let minimumRequirementType = "none";
    let minimumRequirementValue = "";
    if (rule.prerequisite_subtotal_range) {
      minimumRequirementType = "amount";
      minimumRequirementValue = String(
        rule.prerequisite_subtotal_range.greater_than_or_equal_to || ""
      );
    } else if (rule.prerequisite_quantity_range) {
      minimumRequirementType = "quantity";
      minimumRequirementValue = String(
        rule.prerequisite_quantity_range.greater_than_or_equal_to || ""
      );
    }

    let shippingCountries = "all";
    let selectedCountries = [];
    if (
      discount.type === DISCOUNT_TYPE.FREE_SHIPPING &&
      rule.target_selection === TARGET_SELECTION.ENTITLED
    ) {
      shippingCountries = "selected";
      const countryIds = rule.entitled_country_ids || [];
      if (countryIds.length) {
        try {
          const countriesResponse = await client.get({ path: "countries" });
          selectedCountries = (countriesResponse.body?.countries || [])
            .filter((country) => countryIds.includes(country.id))
            .map((country) => country.code.toLowerCase());
        } catch (err) {
          console.warn("Could not fetch countries to map IDs:", err.message);
        }
      }
    }

    let excludeShippingRates = false;
    let excludeShippingRatesValue = "";
    if (
      discount.type === DISCOUNT_TYPE.FREE_SHIPPING &&
      rule.prerequisite_shipping_price_range
    ) {
      excludeShippingRates = true;
      excludeShippingRatesValue = String(
        rule.prerequisite_shipping_price_range.less_than_or_equal_to || ""
      );
    }

    let parsedSelectedItems = [];
    let bxgyFields = {};
    let selectedCustomers = [];
    let selectedSegments = [];
    let selectedMarkets = [];

    if (discount.selectedItems) {
      try {
        const parsed = JSON.parse(discount.selectedItems);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          parsedSelectedItems = parsed.selectedItems || [];
          selectedCustomers = parsed.selectedCustomers || [];
          selectedSegments = parsed.selectedSegments || [];
          selectedMarkets = parsed.selectedMarkets || [];

          bxgyFields = {
            bxgyCustomerBuysType: parsed.bxgyCustomerBuysType || "quantity",
            bxgyCustomerBuysQuantity: parsed.bxgyCustomerBuysQuantity || "1",
            bxgyCustomerBuysAmount: parsed.bxgyCustomerBuysAmount || "",
            bxgyCustomerBuysAppliesTo:
              parsed.bxgyCustomerBuysAppliesTo || "products",
            bxgyCustomerBuysPurchaseType:
              parsed.bxgyCustomerBuysPurchaseType || "one_time",
            bxgyCustomerBuysSelectedItems:
              parsed.bxgyCustomerBuysSelectedItems || [],
            bxgyCustomerGetsQuantity: parsed.bxgyCustomerGetsQuantity || "1",
            bxgyCustomerGetsAppliesTo:
              parsed.bxgyCustomerGetsAppliesTo || "products",
            bxgyCustomerGetsSelectedItems:
              parsed.bxgyCustomerGetsSelectedItems || [],
            bxgyCustomerGetsDiscountType:
              parsed.bxgyCustomerGetsDiscountType || "free",
            bxgyCustomerGetsDiscountValue:
              parsed.bxgyCustomerGetsDiscountValue || "",
            bxgySetMaxUsesPerOrder: parsed.bxgySetMaxUsesPerOrder || false,
            bxgyMaxUsesPerOrderValue: parsed.bxgyMaxUsesPerOrderValue || "",
          };
        } else {
          parsedSelectedItems = Array.isArray(parsed) ? parsed : [];
        }
      } catch (e) {
        console.error("Error parsing selectedItems JSON in getDiscount:", e);
      }
    }

    successResponse(res, 200, "Discount fetched successfully", {
      id: discount.id,
      shopifyId: discount.shopifyId,
      title: discountTitle,
      status: computeStatus(rule.starts_at, rule.ends_at),
      method: discount.method,
      type: discount.type,
      valueType,
      value,
      combinesWithProduct: discount.combinesWithProduct,
      combinesWithOrder: discount.combinesWithOrder,
      combinesWithShipping: discount.combinesWithShipping,
      startDate: rule.starts_at ? rule.starts_at.substring(0, 10) : "",
      startTime: rule.starts_at
        ? formatTimeFromISO(rule.starts_at)
        : "12:00 AM",
      hasEndDate: !!rule.ends_at,
      endDate: rule.ends_at ? rule.ends_at.substring(0, 10) : "",
      endTime: rule.ends_at ? formatTimeFromISO(rule.ends_at) : "12:00 AM",
      limitTotalUses: !!rule.usage_limit,
      limitTotalUsesValue: rule.usage_limit ? String(rule.usage_limit) : "",
      limitOnePerCustomer: rule.once_per_customer || false,
      eligibility: discount.eligibility || ELIGIBILITY.ALL_CUSTOMERS,
      selectedCustomers,
      selectedSegments,
      selectedMarkets,
      appliesTo: discount.appliesTo || APPLIES_TO.ALL,
      purchaseType: discount.purchaseType || PURCHASE_TYPE.ONE_TIME,
      selectedItems: parsedSelectedItems,
      ...bxgyFields,
      allowFeaturedChannels: false,
      tags: "",
      shippingCountries,
      selectedCountries,
      excludeShippingRates,
      excludeShippingRatesValue,
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch discount");
  }
};

const updateDiscount = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const { id } = req.params;
    const {
      title,
      valueType,
      value,
      combinesWithProduct,
      combinesWithOrder,
      combinesWithShipping,
      startsAt,
      endsAt,
      minimumRequirementType,
      minimumRequirementValue,
      limitTotalUses,
      limitTotalUsesValue,
      limitOnePerCustomer,
      shippingCountries,
      selectedCountries,
      appliesTo,
      purchaseType,
      selectedItems,
      eligibility,
    } = req.body;

    const discount = await Discount.findOne({ where: { id, shopId: shop.id } });
    if (!discount) return errorResponse(res, 404, "Discount not found.");

    const validationError = validateDiscountPayload({
      ...req.body,
      type: req.body.type || discount.type,
    });
    if (validationError) return errorResponse(res, 400, validationError);

    const priceRuleId = discount.shopifyId.split("/").pop();
    const client = getRestClient(shop);

    let shopifyValueType =
      valueType === VALUE_TYPE.FIXED_AMOUNT
        ? VALUE_TYPE.FIXED_AMOUNT
        : VALUE_TYPE.PERCENTAGE;
    let shopifyValue = `-${Math.abs(parseFloat(value || 0))}`;

    const priceRule = {
      title,
      value_type: shopifyValueType,
      value: shopifyValue,
      starts_at: startsAt || new Date().toISOString(),
      ends_at: endsAt || null,
      combines_with: {
        product_discounts: !!combinesWithProduct,
        order_discounts: !!combinesWithOrder,
        shipping_discounts: !!combinesWithShipping,
      },
      once_per_customer: !!limitOnePerCustomer,
      customer_selection:
        eligibility === "Specific customers" &&
        req.body.selectedCustomers?.length
          ? "prerequisite"
          : "all",
    };

    if (priceRule.customer_selection === "prerequisite") {
      priceRule.prerequisite_customer_ids = req.body.selectedCustomers
        .map((customer) => extractNumericId(customer.id))
        .filter(Boolean);
    } else {
      priceRule.prerequisite_customer_ids = [];
    }

    if (discount.type === DISCOUNT_TYPE.FREE_SHIPPING) {
      priceRule.target_type = TARGET_TYPE.SHIPPING_LINE;
      priceRule.allocation_method = ALLOCATION_METHOD.EACH;
      priceRule.value_type = VALUE_TYPE.PERCENTAGE;
      priceRule.value = "-100.0";
      const wantsSelected =
        shippingCountries === "selected" && selectedCountries?.length;
      const ids = wantsSelected
        ? await getShopifyCountryIds(client, selectedCountries)
        : [];

      if (ids.length) {
        priceRule.target_selection = TARGET_SELECTION.ENTITLED;
        priceRule.entitled_country_ids = ids;
      } else {
        priceRule.target_selection = TARGET_SELECTION.ALL;
        priceRule.entitled_country_ids = [];
      }

      if (req.body.excludeShippingRates) {
        priceRule.prerequisite_shipping_price_range = {
          less_than_or_equal_to: parseFloat(
            String(req.body.excludeShippingRatesValue || "").replace(
              /,/g,
              ""
            ) || 0
          ),
        };
      } else {
        priceRule.prerequisite_shipping_price_range = null;
      }
    } else if (discount.type === DISCOUNT_TYPE.BUY_X_GET_Y) {
      mapBxgyFields(priceRule, req.body);
    } else {
      mapEntitledFields(priceRule, appliesTo, selectedItems);
    }

    if (limitTotalUses && limitTotalUsesValue) {
      priceRule.usage_limit = parseInt(limitTotalUsesValue, 10);
    } else {
      priceRule.usage_limit = null;
    }

    if (minimumRequirementType === "amount" && minimumRequirementValue) {
      priceRule.prerequisite_subtotal_range = {
        greater_than_or_equal_to: parseFloat(minimumRequirementValue),
      };
      priceRule.prerequisite_quantity_range = null;
    } else if (
      minimumRequirementType === "quantity" &&
      minimumRequirementValue
    ) {
      priceRule.prerequisite_quantity_range = {
        greater_than_or_equal_to: parseInt(minimumRequirementValue, 10),
      };
      priceRule.prerequisite_subtotal_range = null;
    } else {
      priceRule.prerequisite_subtotal_range = null;
      priceRule.prerequisite_quantity_range = null;
    }

    const prResponse = await client.put({
      path: `price_rules/${priceRuleId}`,
      type: "application/json",
      data: { price_rule: priceRule },
    });

    const updatedPriceRule = prResponse.body?.price_rule;
    if (!updatedPriceRule)
      throw new Error("Failed to update price rule on Shopify");

    let finalTitle = title;
    if (discount.method === DISCOUNT_METHOD.CODE) {
      try {
        const codesResponse = await client.get({
          path: `price_rules/${priceRuleId}/discount_codes`,
        });
        const codes = codesResponse.body?.discount_codes || [];
        if (codes.length) {
          const codeId = codes[0].id;
          const putCodeResponse = await client.put({
            path: `price_rules/${priceRuleId}/discount_codes/${codeId}`,
            type: "application/json",
            data: { discount_code: { code: title } },
          });
          if (putCodeResponse.body?.discount_code?.code)
            finalTitle = putCodeResponse.body.discount_code.code;
        }
      } catch (err) {
        console.warn(
          `Could not update discount code for ${priceRuleId}:`,
          err.message
        );
      }
    }

    const summary = buildSummary({
      valueType: shopifyValueType,
      value: shopifyValue,
      type: discount.type,
      bxgy: bxgySummaryInput(req.body),
    });

    const status = computeStatus(
      updatedPriceRule.starts_at,
      updatedPriceRule.ends_at
    );
    const finalSelectedItems = serializeSelectedItems(discount.type, req.body);

    await discount.update({
      title: finalTitle,
      summary,
      status,
      eligibility: eligibility || ELIGIBILITY.ALL_CUSTOMERS,
      combinesWithProduct: !!combinesWithProduct,
      combinesWithOrder: !!combinesWithOrder,
      combinesWithShipping: !!combinesWithShipping,
      appliesTo: appliesTo || APPLIES_TO.ALL,
      purchaseType: purchaseType || PURCHASE_TYPE.ONE_TIME,
      selectedItems: finalSelectedItems,
    });

    successResponse(res, 200, "Discount updated successfully", discount);
  } catch (error) {
    handleError(res, error, "Failed to update discount");
  }
};

const deleteDiscounts = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    if (!ids.length)
      return errorResponse(res, 400, "No discount ids provided.");
    const result = await removeDiscounts(shop, ids);
    successResponse(res, 200, "Discounts deleted successfully", result);
  } catch (error) {
    handleError(res, error, "Failed to delete discounts");
  }
};

const { listComments, createComment, deleteComment } = createCommentHandlers({
  resolveParent: async (req) => {
    const { shop, discount, error } = await resolveShopDiscount(req);
    return { shop, parent: discount, error };
  },
  foreignKey: "discountId",
  entityName: "discount",
});

const getMarkets = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const { graphqlClient } = getGraphQLClient({
      shopDomain: shop.myshopifyDomain,
      accessToken: shop.token,
    });
    const response = await graphqlClient.request(`
      query {
        markets(first: 50) {
          nodes { id name }
        }
      }
    `);
    const markets = (response.data?.markets?.nodes || []).map((market) => ({
      id: market.id,
      title: market.name || market.id,
    }));
    successResponse(res, 200, "Markets fetched successfully", { markets });
  } catch (error) {
    console.warn(
      "GraphQL markets query failed or unsupported, using mock fallback:",
      error.message
    );
    const mockMarkets = [
      { id: "market-us", title: "United States" },
      { id: "market-ca", title: "Canada" },
      { id: "market-uk", title: "United Kingdom" },
      { id: "market-au", title: "Australia" },
      { id: "market-eu", title: "European Union" },
      { id: "market-in", title: "India" },
      { id: "market-jp", title: "Japan" },
    ];
    successResponse(res, 200, "Markets fetched successfully (fallback)", {
      markets: mockMarkets,
    });
  }
};

const getSegments = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const { graphqlClient } = getGraphQLClient({
      shopDomain: shop.myshopifyDomain,
      accessToken: shop.token,
    });
    const response = await graphqlClient.request(`
      query {
        segments(first: 50) {
          nodes { id name }
        }
      }
    `);
    const segments = (response.data?.segments?.nodes || []).map((segment) => ({
      id: segment.id,
      title: segment.name || segment.id,
    }));
    successResponse(res, 200, "Segments fetched successfully", { segments });
  } catch (error) {
    console.warn(
      "GraphQL segments query failed or unsupported, using mock fallback:",
      error.message
    );
    const mockSegments = [
      { id: "segment-returning", title: "Returning customers" },
      { id: "segment-abandoned", title: "Abandoned checkouts (last 30 days)" },
      { id: "segment-subscribers", title: "Email subscribers" },
      { id: "segment-high-value", title: "High value customers" },
      { id: "segment-new", title: "New customers (last 30 days)" },
      { id: "segment-inactive", title: "Inactive customers" },
    ];
    successResponse(res, 200, "Segments fetched successfully (fallback)", {
      segments: mockSegments,
    });
  }
};

module.exports = {
  listDiscounts,
  getMarkets,
  getSegments,
  getShippableCountries,
  createDiscount,
  getDiscount,
  updateDiscount,
  deleteDiscounts,
  listComments,
  createComment,
  deleteComment,
};
