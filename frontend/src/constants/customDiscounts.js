export const OPERATORS = [
  { value: "greater_than_or_equals", label: "Greater than or equals" },
  { value: "less_than_or_equals", label: "Less than or equals" },
  { value: "equals", label: "Equals" },
];

export const CAMPAIGN_OPTIONS = [
  { value: "conditional_discount", label: "Conditional Discount" },
  { value: "tiered_discount", label: "Tiered Discount" },
  {
    value: "discount_code_pattern_discount",
    label: "Discount Code Pattern Discount",
  },
];

export const DISCOUNT_VALUE_TYPES = [
  { value: "percentage", label: "Percentage" },
  { value: "fixed_amount", label: "Fixed Amount" },
];

export const CAMPAIGN_LABELS = {
  conditional_discount: "Conditional Discount",
  tiered_discount: "Tiered Discount",
  discount_code_pattern_discount: "Discount Code Pattern Discount",
};

export const DISCOUNT_TYPE_LABELS = {
  percentage: "Percentage",
  fixed_amount: "Fixed amount",
};

export const FUNCTION_TYPE_LABELS = {
  1: "Product Discount",
  2: "Shipping Discount",
  3: "Order Discount",
};

export const SHIPPING_METHOD_OPTIONS = [
  "Standard",
  "Express",
  "Economy",
  "Local Delivery",
  "Store Pickup",
  "International",
];
