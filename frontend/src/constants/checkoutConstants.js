export const CONTENT_TYPES = [
  { id: "banner", label: "Banner", icon: "flag" },
  { id: "benefits", label: "Benefits", icon: "list-bulleted" },
  { id: "button", label: "Button", icon: "note" },
  { id: "divider", label: "Divider", icon: "minus" },
  { id: "heading", label: "Heading", icon: "text-bold" },
  { id: "image", label: "Image", icon: "image" },
  { id: "spacer", label: "Spacer", icon: "drag-handle" },
  { id: "text", label: "Text", icon: "text" },
];

export const FIELD_TYPES = [
  { id: "checkbox", label: "Checkbox", icon: "checkbox" },
  { id: "choice_list", label: "Choice List", icon: "list-bulleted" },
  { id: "date_picker", label: "Date Picker", icon: "calendar" },
  { id: "date_of_birth", label: "Date of Birth", icon: "calendar" },
  { id: "dropdown", label: "Dropdown", icon: "select" },
  { id: "phone_field", label: "Phone Field", icon: "phone" },
  { id: "text_input", label: "Text Input", icon: "text" },
];

export const CREATION_CARDS = [
  {
    id: "custom-field",
    image: "/assets/checkout_custom_field_card.png",
    title: "Custom Field",
    description:
      "Optimize checkout with tailored fields, gathering more customer information.",
    path: "/checkout-customization/custom-field/new",
  },
  {
    id: "custom-content",
    image: "/assets/checkout_custom_content_card.png",
    title: "Custom Content",
    description:
      "Highlight messages and essential details effortlessly in the checkout process.",
    path: "/checkout-customization/custom-content/new",
  },
  {
    id: "line-item-actions",
    image: "/assets/checkout_line_item_card.png",
    title: "Line Item Actions",
    description:
      "Enable cart modifications and the ability to personalize settings at checkout.",
    path: "/checkout-customization/line-item-actions/new",
  },
];

export const LIST_TABS = [
  "All",
  "Custom Field",
  "Custom Content",
  "Line Item Actions",
  "Checkout Upsell",
  "Checkbox Upsell",
];

export const TYPE_META = {
  custom_field: {
    label: "Custom Field",
    tab: "Custom Field",
    editPath: "/checkout-customization/custom-field",
  },
  custom_content: {
    label: "Custom Content",
    tab: "Custom Content",
    editPath: "/checkout-customization/custom-content",
  },
  line_item_actions: {
    label: "Line Item Actions",
    tab: "Line Item Actions",
    editPath: "/checkout-customization/line-item-actions",
  },
};

export const EMPTY_CONTENT_FORM = {
  internalName: "",
  blockVisibility: "Dynamic",
  displayRule: "all",
  displayConditions: { combination: "all", conditions: [] },
  heading: "",
  contents: [],
  isActive: true,
};

export const EMPTY_FIELD_FORM = {
  internalName: "",
  blockVisibility: "Dynamic",
  displayRule: "all",
  displayConditions: { combination: "all", conditions: [] },
  orderFieldSetting: "order_metafield",
  heading: "",
  subheading: "",
  fields: [],
  isActive: true,
};

export const EMPTY_LINE_ITEM_FORM = {
  internalName: "",
  displayRule: "all",
  displayConditions: { combination: "all", conditions: [] },
  showActionsExpanded: true,
  subscriptionSelector: false,
  variantSelector: true,
  quantity: true,
  removeButton: true,
  isActive: true,
};

export const BLOCK_VISIBILITY_OPTIONS = [
  "Dynamic",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
];
