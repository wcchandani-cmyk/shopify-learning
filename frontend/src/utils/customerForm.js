import { Country, State } from "country-state-city";
import ISO6391 from "iso-639-1";

const DEFAULT_COUNTRY_CODE = "US";

// The DB stores full names; the dropdowns work in ISO codes, so convert.
function nameToCountryCode(name) {
  if (!name) return DEFAULT_COUNTRY_CODE;
  const match = Country.getAllCountries().find(
    (country) => country.name === name
  );
  return match?.isoCode || DEFAULT_COUNTRY_CODE;
}

function nameToProvinceCode(countryCode, name) {
  if (!name || !countryCode) return "";
  const match = State.getStatesOfCountry(countryCode).find(
    (state) => state.name === name
  );
  return match?.isoCode || "";
}

// Human-readable language name from a locale code (e.g. "fr" -> "French").
export function languageLabel(locale, primary = false) {
  let name = locale;
  try {
    name =
      new Intl.DisplayNames(["en"], { type: "language" }).of(locale) || locale;
  } catch {
    name = locale;
  }
  name = name.charAt(0).toUpperCase() + name.slice(1);
  return primary ? `${name} [Default]` : name;
}

/** Build the Language select options from the store's enabled locales. */
export function buildLanguageOptions(locales = []) {
  return locales.map((item) => ({
    value: item.locale,
    label: languageLabel(item.locale, item.primary),
  }));
}

export const FALLBACK_LANGUAGE_OPTIONS = ISO6391.getAllCodes()
  .map((code) => ({ value: code, label: languageLabel(code, code === "en") }))
  .sort((a, b) => a.label.localeCompare(b.label));

export const TAX_SETTING_OPTIONS = [
  { value: "collect", label: "Collect tax" },
  { value: "dont_collect", label: "Don't collect tax" },
];

export const EMPTY_ADDRESS = {
  id: null,
  company: "",
  address1: "",
  address2: "",
  city: "",
  provinceCode: "",
  countryCode: "US",
  zip: "",
  phone: "",
};

export const EMPTY_CUSTOMER = {
  id: null,
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  locale: "en",
  emailSubscribed: false,
  smsSubscribed: false,
  taxSetting: "collect",
  note: "",
  tags: "",
  address: { ...EMPTY_ADDRESS },
};

export function customerToFormState(customer) {
  if (!customer) return { ...EMPTY_CUSTOMER, address: { ...EMPTY_ADDRESS } };

  const incoming = customer.address || {};
  const countryCode = incoming.country
    ? nameToCountryCode(incoming.country)
    : DEFAULT_COUNTRY_CODE;
  const provinceCode = nameToProvinceCode(countryCode, incoming.province);

  return {
    id: customer.id ?? null,
    firstName: customer.firstName || "",
    lastName: customer.lastName || "",
    email: customer.email || "",
    phone: customer.phone || "",
    locale: customer.locale || "en",
    emailSubscribed: Boolean(customer.emailSubscribed),
    smsSubscribed: Boolean(customer.smsSubscribed),
    taxSetting: customer.taxSetting || "collect",
    note: customer.note || "",
    tags: customer.tags || "",
    address: {
      id: incoming.id || null,
      company: incoming.company || "",
      address1: incoming.address1 || "",
      address2: incoming.address2 || "",
      city: incoming.city || "",
      provinceCode,
      countryCode,
      zip: incoming.zip || "",
      phone: incoming.phone || "",
    },
  };
}

/** Build the payload the backend create/update endpoints expect. */
export function buildCustomerPayload(form) {
  const address = form.address || {};
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    locale: form.locale || "en",
    emailSubscribed: Boolean(form.emailSubscribed),
    smsSubscribed: Boolean(form.smsSubscribed),
    taxSetting: form.taxSetting || "collect",
    note: form.note.trim(),
    tags: form.tags.trim(),
    address: {
      id: address.id || null,
      company: (address.company || "").trim(),
      address1: (address.address1 || "").trim(),
      address2: (address.address2 || "").trim(),
      city: (address.city || "").trim(),
      provinceCode: (address.provinceCode || "").trim(),
      countryCode: (address.countryCode || "").trim(),
      zip: (address.zip || "").trim(),
      phone: (address.phone || "").trim(),
    },
  };
}

export function formatMoney(
  amount,
  currencyCode,
  { locale, fallbackCurrency } = {}
) {
  const value = Number(amount || 0);
  const currency = currencyCode || fallbackCurrency;
  if (currency) {
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
      }).format(value);
    } catch {
      // Fall through to a plain number when the currency code is unknown.
    }
  }
  return value.toFixed(2);
}

export function parseTags(tags) {
  if (Array.isArray(tags))
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  return String(tags || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function formatTags(tags) {
  return parseTags(tags).join(", ");
}

export function countryName(code) {
  if (!code) return "";
  return Country.getCountryByCode(code)?.name || code;
}

export function provinceName(countryCode, stateCode) {
  if (!countryCode || !stateCode) return stateCode || "";
  return (
    State.getStateByCodeAndCountry(stateCode, countryCode)?.name || stateCode
  );
}

export function addressLines(address, recipientName = "") {
  if (!customerHasAddress(address)) return [];
  const name = recipientName.trim();
  const cityLine = [
    address.city,
    provinceName(address.countryCode, address.provinceCode),
    address.zip,
  ]
    .filter(Boolean)
    .join(" ");
  return [
    name,
    address.company,
    address.address1,
    address.address2,
    cityLine,
    countryName(address.countryCode),
  ].filter(Boolean);
}

export function customerHasAddress(address) {
  if (!address) return false;
  return Boolean(
    address.address1 || address.city || address.zip || address.company
  );
}

export function formatAddressSummary(address, recipientName = "") {
  if (!customerHasAddress(address)) return "";
  const name = recipientName.trim();
  const cityLine = [address.city, address.provinceCode, address.zip]
    .filter(Boolean)
    .join(" ");
  return [name, address.company, address.address1, address.address2, cityLine]
    .filter(Boolean)
    .join(", ");
}
