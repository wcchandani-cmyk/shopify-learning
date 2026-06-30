export function formatOrderDateShort(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const dateStr = date.toLocaleDateString("en", {
    day: "numeric",
    month: "short",
  });
  const timeStr = date.toLocaleTimeString("en", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).toLowerCase();

  return { dateStr, timeStr };
}

export function formatOrderDateLong(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const day = date.getDate();
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const time = date.toLocaleTimeString("en", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).toLowerCase();

  return `${day} ${month} ${year} at ${time}`;
}

const PAYMENT_BADGES = {
  paid: { tone: "success", label: "Paid" },
  pending: { tone: "warning", label: "Pending" },
  refunded: { tone: "info", label: "Refunded" },
  voided: { tone: "critical", label: "Voided" },
};

export function getPaymentBadge(status) {
  const badge = PAYMENT_BADGES[String(status || "pending").toLowerCase()];
  if (!badge) return <s-badge size="large">{status}</s-badge>;
  return <s-badge size="large" tone={badge.tone}>{badge.label}</s-badge>;
}

const FULFILLMENT_DISPLAY = {
  fulfilled: { label: "Fulfilled", tone: "success", icon: "check" },
  "in progress": { label: "In progress", tone: "info", icon: "delivery" },
  "on hold": { label: "On hold", tone: "attention", icon: "clock" },
  partial: { label: "Partially fulfilled", tone: "attention", icon: "package" },
  unfulfilled: { label: "Unfulfilled", tone: "warning", icon: "package" },
};

function normalizeFulfillment(status) {
  return String(status || "unfulfilled")
    .toLowerCase()
    .replace(/_/g, " ");
}

export function getFulfillmentDisplay(status) {
  return (
    FULFILLMENT_DISPLAY[normalizeFulfillment(status)] ||
    FULFILLMENT_DISPLAY.unfulfilled
  );
}

const FULFILLMENT_ACTIONS = [
  { label: "Mark as in progress", status: "in progress" },
  { label: "Mark as on hold", status: "on hold" },
  { label: "Mark as unfulfilled", status: "unfulfilled" },
];

export function getFulfillmentMenuOptions(status) {
  const normalized = normalizeFulfillment(status);
  const current = FULFILLMENT_ACTIONS.some((action) => action.status === normalized)
    ? normalized
    : "unfulfilled";
  return FULFILLMENT_ACTIONS.filter((action) => action.status !== current);
}

export function getFulfillmentBadge(status) {
  const display = FULFILLMENT_DISPLAY[normalizeFulfillment(status)];
  if (!display) return <s-badge size="large">{status}</s-badge>;
  return <s-badge size="large" tone={display.tone}>{display.label}</s-badge>;
}

export function currencyLabel(code) {
  if (!code) return "";
  try {
    const name = new Intl.DisplayNames(["en"], { type: "currency" }).of(code);
    const symbol =
      new Intl.NumberFormat("en", { style: "currency", currency: code })
        .formatToParts(0)
        .find((part) => part.type === "currency")?.value || code;
    return `${name} (${code} ${symbol})`;
  } catch {
    return code;
  }
}

export function getOrdinalSuffix(num) {
  const n = parseInt(num, 10) || 0;
  if (n <= 0) return "th";
  const lastDigit = n % 10;
  const lastTwoDigits = n % 100;
  if (lastDigit === 1 && lastTwoDigits !== 11) return "st";
  if (lastDigit === 2 && lastTwoDigits !== 12) return "nd";
  if (lastDigit === 3 && lastTwoDigits !== 13) return "rd";
  return "th";
}

export function matchesOrderSearch(order, search) {
  const term = search.trim().toLowerCase();
  if (!term) return true;
  return (
    String(order.orderNumber || "").toLowerCase().includes(term) ||
    String(order.name || "").toLowerCase().includes(term) ||
    String(order.draftName || "").toLowerCase().includes(term) ||
    String(order.email || "").toLowerCase().includes(term) ||
    String(order.tags || "").toLowerCase().includes(term)
  );
}


