export const DISCOUNT_TYPE = {
  AMOUNT_OFF_PRODUCT: "Amount off product",
  AMOUNT_OFF_ORDER: "Amount off order",
  FREE_SHIPPING: "Free shipping",
  BUY_X_GET_Y: "Buy X get Y",
};

export const DISCOUNT_SLUG = {
  AMOUNT_OFF_PRODUCT: "amount-off-product",
  AMOUNT_OFF_ORDER: "amount-off-order",
  FREE_SHIPPING: "free-shipping",
  BUY_X_GET_Y: "buy-x-get-y",
};

export const DEFAULT_DISCOUNT_TYPE = DISCOUNT_TYPE.AMOUNT_OFF_PRODUCT;

const SLUG_TO_TYPE = {
  [DISCOUNT_SLUG.AMOUNT_OFF_PRODUCT]: DISCOUNT_TYPE.AMOUNT_OFF_PRODUCT,
  [DISCOUNT_SLUG.AMOUNT_OFF_ORDER]: DISCOUNT_TYPE.AMOUNT_OFF_ORDER,
  [DISCOUNT_SLUG.FREE_SHIPPING]: DISCOUNT_TYPE.FREE_SHIPPING,
  [DISCOUNT_SLUG.BUY_X_GET_Y]: DISCOUNT_TYPE.BUY_X_GET_Y,
};

export const slugToDiscountType = (slug) =>
  SLUG_TO_TYPE[slug] || DEFAULT_DISCOUNT_TYPE;

export const DEFAULT_CHANNELS = [
  { id: "pos", name: "Point of Sale", icon: "store" },
  { id: "shop", name: "Shop", icon: "shop" },
  { id: "graphiql", name: "Shopify GraphiQL App", icon: "apps" },
];
