const { DISCOUNT_TYPE, DISCOUNT_STATUS, VALUE_TYPE, APPLIES_TO, ELIGIBILITY } = require("./constants");

const computeStatus = (startsAt, endsAt) => {
  const now = new Date();
  const start = startsAt ? new Date(startsAt) : null;
  const end = endsAt ? new Date(endsAt) : null;

  if (start && now < start) return DISCOUNT_STATUS.SCHEDULED;
  if (end && now > end) return DISCOUNT_STATUS.EXPIRED;
  return DISCOUNT_STATUS.ACTIVE;
};

const buildSummary = ({ valueType, value, type, bxgy = null }) => {
  let summary;
  if (valueType === VALUE_TYPE.PERCENTAGE) {
    summary = `${Math.abs(parseFloat(value || 0))}% off`;
  } else {
    summary = `$${Math.abs(parseFloat(value || 0)).toFixed(2)} off`;
  }

  if (type === DISCOUNT_TYPE.FREE_SHIPPING) {
    summary = "Free shipping on all products";
  } else if (type === DISCOUNT_TYPE.BUY_X_GET_Y && bxgy) {
    const {
      customerBuysQuantity,
      customerGetsQuantity,
      customerGetsDiscountType,
      customerGetsDiscountValue,
    } = bxgy;

    let getsVal;
    if (customerGetsDiscountType === "free") {
      getsVal = "free";
    } else if (customerGetsDiscountType === VALUE_TYPE.PERCENTAGE) {
      getsVal = `${customerGetsDiscountValue}% off`;
    } else {
      getsVal = `$${customerGetsDiscountValue} off`;
    }
    summary = `Buy ${customerBuysQuantity} get ${customerGetsQuantity} ${getsVal}`;
  }

  return summary;
};

const serializeSelectedItems = (type, body) => {
  const eligibilityData = {
    selectedCustomers: body.selectedCustomers || [],
    selectedSegments: body.selectedSegments || [],
    selectedMarkets: body.selectedMarkets || [],
  };

  if (type === DISCOUNT_TYPE.BUY_X_GET_Y) {
    return JSON.stringify({
      ...eligibilityData,
      bxgyCustomerBuysType: body.bxgyCustomerBuysType,
      bxgyCustomerBuysQuantity: body.bxgyCustomerBuysQuantity,
      bxgyCustomerBuysAmount: body.bxgyCustomerBuysAmount,
      bxgyCustomerBuysAppliesTo: body.bxgyCustomerBuysAppliesTo,
      bxgyCustomerBuysPurchaseType: body.bxgyCustomerBuysPurchaseType,
      bxgyCustomerBuysSelectedItems: body.bxgyCustomerBuysSelectedItems || [],
      bxgyCustomerGetsQuantity: body.bxgyCustomerGetsQuantity,
      bxgyCustomerGetsAppliesTo: body.bxgyCustomerGetsAppliesTo,
      bxgyCustomerGetsSelectedItems: body.bxgyCustomerGetsSelectedItems || [],
      bxgyCustomerGetsDiscountType: body.bxgyCustomerGetsDiscountType,
      bxgyCustomerGetsDiscountValue: body.bxgyCustomerGetsDiscountValue,
      bxgySetMaxUsesPerOrder: body.bxgySetMaxUsesPerOrder,
      bxgyMaxUsesPerOrderValue: body.bxgyMaxUsesPerOrderValue,
    });
  }

  return JSON.stringify({
    ...eligibilityData,
    selectedItems: body.selectedItems || [],
    excludeShippingRates: type === DISCOUNT_TYPE.FREE_SHIPPING ? Boolean(body.excludeShippingRates) : undefined,
    excludeShippingRatesValue: type === DISCOUNT_TYPE.FREE_SHIPPING ? body.excludeShippingRatesValue || "" : undefined,
  });
};

const validateDiscountPayload = (body) => {
  const { title, method, type, appliesTo, selectedItems, eligibility } = body;

  if (!title || !title.trim()) {
    return method === "Code" ? "Discount code is required" : "Title is required";
  }

  if (type === DISCOUNT_TYPE.FREE_SHIPPING && body.shippingCountries === "selected") {
    if (!body.selectedCountries || body.selectedCountries.length === 0) {
      return "Please select at least one country for free shipping.";
    }
  }

  if (type === DISCOUNT_TYPE.AMOUNT_OFF_PRODUCT) {
    if (appliesTo === APPLIES_TO.PRODUCTS && (!selectedItems || selectedItems.length === 0)) {
      return "Please select at least one product.";
    }
    if (appliesTo === APPLIES_TO.COLLECTIONS && (!selectedItems || selectedItems.length === 0)) {
      return "Please select at least one collection.";
    }
  }

  if (type === DISCOUNT_TYPE.BUY_X_GET_Y) {
    if (body.bxgyCustomerBuysAppliesTo === APPLIES_TO.PRODUCTS && (!body.bxgyCustomerBuysSelectedItems || body.bxgyCustomerBuysSelectedItems.length === 0)) {
      return "Please select at least one product for what the customer buys.";
    }
    if (body.bxgyCustomerBuysAppliesTo === APPLIES_TO.COLLECTIONS && (!body.bxgyCustomerBuysSelectedItems || body.bxgyCustomerBuysSelectedItems.length === 0)) {
      return "Please select at least one collection for what the customer buys.";
    }
    if (body.bxgyCustomerGetsAppliesTo === APPLIES_TO.PRODUCTS && (!body.bxgyCustomerGetsSelectedItems || body.bxgyCustomerGetsSelectedItems.length === 0)) {
      return "Please select at least one product for what the customer gets.";
    }
    if (body.bxgyCustomerGetsAppliesTo === APPLIES_TO.COLLECTIONS && (!body.bxgyCustomerGetsSelectedItems || body.bxgyCustomerGetsSelectedItems.length === 0)) {
      return "Please select at least one collection for what the customer gets.";
    }
  }

  if (eligibility === ELIGIBILITY.SPECIFIC_CUSTOMERS && (!body.selectedCustomers || body.selectedCustomers.length === 0)) {
    return "Please select at least one customer.";
  }

  if (eligibility === ELIGIBILITY.SPECIFIC_SEGMENTS && (!body.selectedSegments || body.selectedSegments.length === 0)) {
    return "Please select at least one customer segment.";
  }

  return null;
};

module.exports = { computeStatus, buildSummary, serializeSelectedItems, validateDiscountPayload };
