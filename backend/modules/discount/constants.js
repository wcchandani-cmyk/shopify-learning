const DISCOUNT_TYPE = {
  AMOUNT_OFF_PRODUCT: "Amount off product",
  AMOUNT_OFF_ORDER: "Amount off order",
  FREE_SHIPPING: "Free shipping",
  BUY_X_GET_Y: "Buy X get Y",
};

const DISCOUNT_METHOD = {
  CODE: "Code",
  AUTOMATIC: "Automatic",
};

const DISCOUNT_STATUS = {
  ACTIVE: "active",
  SCHEDULED: "scheduled",
  EXPIRED: "expired",
};

const VALUE_TYPE = {
  PERCENTAGE: "percentage",
  FIXED_AMOUNT: "fixed_amount",
};

const TARGET_TYPE = {
  LINE_ITEM: "line_item",
  SHIPPING_LINE: "shipping_line",
};

const ALLOCATION_METHOD = {
  ACROSS: "across",
  EACH: "each",
};

const TARGET_SELECTION = {
  ALL: "all",
  ENTITLED: "entitled",
};

const APPLIES_TO = {
  ALL: "all",
  PRODUCTS: "products",
  COLLECTIONS: "collections",
};

const PURCHASE_TYPE = {
  ONE_TIME: "one_time",
  SUBSCRIPTION: "subscription",
  BOTH: "both",
};

const ELIGIBILITY = {
  ALL_CUSTOMERS: "All customers",
  SPECIFIC_CUSTOMERS: "Specific customers",
  SPECIFIC_SEGMENTS: "Specific customer segments",
};

module.exports = {
  DISCOUNT_TYPE,
  DISCOUNT_METHOD,
  DISCOUNT_STATUS,
  VALUE_TYPE,
  TARGET_TYPE,
  ALLOCATION_METHOD,
  TARGET_SELECTION,
  APPLIES_TO,
  PURCHASE_TYPE,
  ELIGIBILITY,
};
