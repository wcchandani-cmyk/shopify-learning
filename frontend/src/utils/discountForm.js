import { Country } from "country-state-city";

export const getInitialDiscountForm = () => ({
  title: "",
  method: "Code", // "Code" | "Automatic"
  valueType: "percentage", // "percentage" | "fixed_amount"
  value: "",
  appliesTo: "all", // "all" | "collections" | "products"
  purchaseType: "one_time", // "one_time" | "subscription" | "both"
  searchQuery: "",
  selectedItems: [],
  bxgyCustomerBuysType: "quantity", // "quantity" | "amount"
  bxgyCustomerBuysQuantity: "1",
  bxgyCustomerBuysAmount: "",
  bxgyCustomerBuysAppliesTo: "products", // "products" | "collections"
  bxgyCustomerBuysPurchaseType: "one_time", // "one_time" | "subscription" | "both"
  bxgyCustomerBuysSelectedItems: [],
  bxgyCustomerGetsQuantity: "1",
  bxgyCustomerGetsAppliesTo: "products", // "products" | "collections"
  bxgyCustomerGetsSelectedItems: [],
  bxgyCustomerGetsDiscountType: "free", // "percentage" | "fixed_amount" | "free"
  bxgyCustomerGetsDiscountValue: "",
  bxgySetMaxUsesPerOrder: false,
  bxgyMaxUsesPerOrderValue: "",
  eligibility: "All customers",
  selectedCustomers: [],
  selectedSegments: [],
  selectedMarkets: [],
  minimumRequirementType: "none", // "none" | "amount" | "quantity"
  minimumRequirementValue: "",
  limitTotalUses: false,
  limitTotalUsesValue: "",
  limitOnePerCustomer: false,
  combinesWithProduct: false,
  combinesWithOrder: false,
  combinesWithShipping: false,
  startDate: new Date().toISOString().substring(0, 10), // "YYYY-MM-DD"
  startTime: "12:00 AM",
  hasEndDate: false,
  endDate: "",
  endTime: "12:00 AM",
  allowFeaturedChannels: false,
  selectedChannels: ["pos", "shop", "graphiql"],
  tags: "",
  shippingCountries: "all",
  selectedCountries: [],
});

export const combineDateTime = (dateStr, timeStr) => {
  if (!dateStr) return null;
  let hours = 0;
  let minutes = 0;
  if (/am|pm/i.test(timeStr)) {
    const match = timeStr.match(/(\d+):(\d+)\s*(am|pm)/i);
    if (match) {
      hours = parseInt(match[1], 10);
      minutes = parseInt(match[2], 10);
      const meridiem = match[3].toLowerCase();
      if (meridiem === "pm" && hours < 12) hours += 12;
      if (meridiem === "am" && hours === 12) hours = 0;
    }
  } else {
    const parts = timeStr.split(":");
    if (parts.length >= 2) {
      hours = parseInt(parts[0], 10);
      minutes = parseInt(parts[1], 10);
    }
  }
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day, hours, minutes);
  return isNaN(date.getTime()) ? null : date.toISOString();
};

export const generateRandomDiscountCode = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let index = 0; index < 8; index++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

export const getSummaryHeader = (form) => {
  if (form.title.trim()) {
    return form.title;
  }
  return form.method === "Code" ? "No discount code yet" : "Untitled discount";
};

export const getSummaryDetails = (form, type) => {
  const details = [];

  let eligibilityText = "All customers";
  if (form.eligibility === "Markets" && form.selectedMarkets && form.selectedMarkets.length > 0) {
    eligibilityText = `For ${form.selectedMarkets.length} market${form.selectedMarkets.length !== 1 ? "s" : ""}`;
  } else if (form.eligibility === "Customer segments" && form.selectedSegments && form.selectedSegments.length > 0) {
    eligibilityText = `For ${form.selectedSegments.length} segment${form.selectedSegments.length !== 1 ? "s" : ""}`;
  } else if (form.eligibility === "Specific customers" && form.selectedCustomers && form.selectedCustomers.length > 0) {
    eligibilityText = `For ${form.selectedCustomers.length} customer${form.selectedCustomers.length !== 1 ? "s" : ""}`;
  } else {
    eligibilityText = form.eligibility || "All customers";
  }
  details.push(eligibilityText);

  let channelAccess = "For Online Store";
  if (form.allowFeaturedChannels && form.selectedChannels && form.selectedChannels.length > 0) {
    channelAccess += ` and ${form.selectedChannels.length} sales channels`;
  }
  details.push(channelAccess);

  if (type === "Free shipping" && form.applyOnPosProLocations) {
    details.push("POS Pro included");
  }

  const formatPrettyDate = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      if (!isNaN(date.getTime())) {
        const day = date.getDate();
        const month = date.toLocaleString("en-US", { month: "short" });
        return `${day} ${month}`;
      }
    }
    return dateStr;
  };

  if (type === "Buy X get Y") {
    // 1. Customer buys
    let buysText = "";
    if (form.bxgyCustomerBuysType === "amount") {
      const amount = parseFloat(form.bxgyCustomerBuysAmount || 0);
      buysText = `Spend $${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      const qty = parseInt(form.bxgyCustomerBuysQuantity || 1, 10);
      buysText = `Buy ${qty} item${qty !== 1 ? "s" : ""}`;
    }
    details.push(buysText);

    // 2. Purchase type
    let purchaseTypeText = "As a one-time purchase";
    if (form.bxgyCustomerBuysPurchaseType === "subscription") {
      purchaseTypeText = "As a subscription";
    } else if (form.bxgyCustomerBuysPurchaseType === "both") {
      purchaseTypeText = "As a one-time purchase or subscription";
    }
    details.push(purchaseTypeText);

    // 3. Customer gets
    const getsQty = parseInt(form.bxgyCustomerGetsQuantity || 1, 10);
    let discountValText = " free";
    if (form.bxgyCustomerGetsDiscountType === "percentage") {
      const pctVal = parseFloat(form.bxgyCustomerGetsDiscountValue || 0);
      discountValText = ` at ${pctVal}% off`;
    } else if (form.bxgyCustomerGetsDiscountType === "fixed_amount") {
      const amtVal = parseFloat(form.bxgyCustomerGetsDiscountValue || 0);
      discountValText = ` at $${amtVal.toFixed(2)} off each`;
    }
    const getsText = `Get ${getsQty} item${getsQty !== 1 ? "s" : ""}${discountValText}`;
    details.push(getsText);

    // 4. Max uses per order
    if (form.bxgySetMaxUsesPerOrder && form.bxgyMaxUsesPerOrderValue) {
      const maxUses = parseInt(form.bxgyMaxUsesPerOrderValue || 1, 10);
      details.push(`${maxUses} use${maxUses !== 1 ? "s" : ""} per order`);
    }
  } else if (type === "Free shipping") {
    let countryText = "All countries";
    if (form.shippingCountries === "selected" && form.selectedCountries && form.selectedCountries.length > 0) {
      const countryNames = form.selectedCountries.map((code) => {
        const countryObj = Country.getCountryByCode(code.toUpperCase());
        return countryObj ? countryObj.name : code;
      });
      countryText = `Restricted to shipping in ${countryNames.join(", ")}`;
    }
    let purchaseTypeText = "One-time purchase";
    if (form.purchaseType === "subscription") {
      purchaseTypeText = "Subscription";
    } else if (form.purchaseType === "both") {
      purchaseTypeText = "One-time and subscription purchases";
    }
    details.push(`${countryText} (${purchaseTypeText.toLowerCase()})`);

    if (form.excludeShippingRates) {
      const val = parseFloat(form.excludeShippingRatesValue || "1000.00");
      const formattedVal = isNaN(val) ? "1,000.00" : val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      details.push(`Exclude shipping rates over $${formattedVal}`);
    }
  } else {
    let appliesToText = "Applies to all products";
    if (form.appliesTo === "collections") {
      appliesToText = "Applies to specific collections";
    } else if (form.appliesTo === "products") {
      appliesToText = "Applies to specific products";
    }

    let purchaseTypeText = "One-time purchase";
    if (form.purchaseType === "subscription") {
      purchaseTypeText = "Subscription";
    } else if (form.purchaseType === "both") {
      purchaseTypeText = "One-time and subscription purchases";
    }
    details.push(`${appliesToText} (${purchaseTypeText.toLowerCase()})`);
  }

  if (type !== "Buy X get Y") {
    if (form.minimumRequirementType === "none" || !form.minimumRequirementType) {
      details.push("No minimum purchase requirement");
    } else if (form.minimumRequirementType === "amount") {
      details.push(`Minimum purchase of $${parseFloat(form.minimumRequirementValue || 0).toFixed(2)}`);
    } else if (form.minimumRequirementType === "quantity") {
      details.push(`Minimum quantity of ${form.minimumRequirementValue || 0} items`);
    }
  }

  if (form.limitTotalUses && form.limitTotalUsesValue) {
    details.push(`Limit of ${form.limitTotalUsesValue} uses`);
  }
  if (form.limitOnePerCustomer) {
    details.push("One use per customer");
  }
  if (!form.limitTotalUses && !form.limitOnePerCustomer) {
    details.push("No usage limits");
  }

  const combined = [];
  if (form.combinesWithProduct) combined.push("Product");
  if (form.combinesWithOrder) combined.push("Order");
  if (form.combinesWithShipping) combined.push("Shipping");
  if (combined.length > 0) {
    details.push(`Combines with ${combined.join(", ")} discounts`);
  } else {
    details.push("Can't combine with other discounts");
  }

  let dateText = `Active from ${formatPrettyDate(form.startDate)}`;
  if (form.hasEndDate && form.endDate) {
    dateText += ` to ${formatPrettyDate(form.endDate)}`;
  }
  details.push(dateText);

  return details;
};
