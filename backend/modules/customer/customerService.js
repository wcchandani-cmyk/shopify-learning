const Customer = require("./model");
const Comment = require("../comment/model");
const { getRestClient } = require("../../utils/shopify");

const trimOrNull = (value) => {
  const str = String(value ?? "").trim();
  return str || null;
};

const assignFields = (body, mapping, { includeEmpty }) => {
  Object.entries(mapping).forEach(([key, value]) => {
    const trimmed = String(value ?? "").trim();
    if (trimmed) body[key] = trimmed;
    else if (includeEmpty) body[key] = "";
  });
  return body;
};

const toAddressRestId = (value) => {
  if (value === undefined || value === null) return null;
  const match = String(value)
    .split("?")[0]
    .match(/(\d+)\s*$/);
  return match ? match[1] : null;
};

const buildDisplayName = (firstName, lastName, email) => {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  return name || email || "No name";
};

const mapRestCustomer = (node) => {
  const shopifyId = node?.id != null ? String(node.id) : null;
  if (!shopifyId) return null;

  const address =
    node.default_address ||
    (Array.isArray(node.addresses)
      ? node.addresses.find((a) => a?.default) || node.addresses[0]
      : null) ||
    {};

  return {
    shopifyId,
    firstName: node.first_name || null,
    lastName: node.last_name || null,
    displayName: buildDisplayName(node.first_name, node.last_name, node.email),
    email: node.email || null,
    phone: node.phone || null,
    emailSubscribed: node.email_marketing_consent?.state === "subscribed",
    smsSubscribed: node.sms_marketing_consent?.state === "subscribed",
    taxExempt: Boolean(node.tax_exempt),
    note: node.note || null,
    tags: node.tags || null,
    numberOfOrders: Number(node.orders_count || 0),
    amountSpent: node.total_spent != null ? node.total_spent : 0,
    currencyCode: node.currency || null,
    addressId: address.id != null ? String(address.id) : null,
    company: address.company || null,
    address1: address.address1 || null,
    address2: address.address2 || null,
    city: address.city || null,
    province: address.province || null,
    country: address.country || null,
    zip: address.zip || null,
    addressPhone: address.phone || null,
    shopifyUpdatedAt: node.updated_at || null,
  };
};

const isStaleUpdate = (incoming, current) => {
  if (!incoming || !current) return false;
  const incomingTime = new Date(incoming).getTime();
  const currentTime = new Date(current).getTime();
  if (Number.isNaN(incomingTime) || Number.isNaN(currentTime)) return false;
  return incomingTime <= currentTime;
};

const upsertCustomer = async (shop, node, { guardStale = false } = {}) => {
  if (!node?.shopifyId) return null;

  const payload = { ...node, shopId: shop.id };
  const existing = await Customer.findOne({
    where: { shopId: shop.id, shopifyId: node.shopifyId },
  });

  if (existing) {
    if (
      guardStale &&
      isStaleUpdate(node.shopifyUpdatedAt, existing.shopifyUpdatedAt)
    ) {
      return null;
    }
    await existing.update(payload);
    return existing;
  }

  return Customer.create(payload);
};

const buildLocation = (row) =>
  [row.city, row.province, row.country].filter(Boolean).join(", ");

const toCustomerDTO = (row) => ({
  id: row.id,
  shopifyId: String(row.shopifyId),
  name: row.displayName || "No name",
  email: row.email || null,
  emailSubscribed: Boolean(row.emailSubscribed),
  location: buildLocation(row),
  ordersCount: Number(row.numberOfOrders || 0),
  amountSpent: row.amountSpent != null ? String(row.amountSpent) : "0",
  currencyCode: row.currencyCode || null,
});

const taxSettingFromRow = (row) => (row.taxExempt ? "dont_collect" : "collect");

/** Full record used to hydrate the create/update form. */
const toCustomerDetail = (row) => ({
  id: row.id,
  shopifyId: String(row.shopifyId),
  createdAt: row.createdAt || null,
  firstName: row.firstName || "",
  lastName: row.lastName || "",
  displayName: row.displayName || "",
  email: row.email || "",
  phone: row.phone || "",
  locale: row.locale || "en",
  emailSubscribed: Boolean(row.emailSubscribed),
  smsSubscribed: Boolean(row.smsSubscribed),
  taxSetting: taxSettingFromRow(row),
  note: row.note || "",
  tags: row.tags || "",
  numberOfOrders: Number(row.numberOfOrders || 0),
  amountSpent: row.amountSpent != null ? String(row.amountSpent) : "0",
  currencyCode: row.currencyCode || null,
  address: {
    id: row.addressId || null,
    // The address recipient mirrors the customer's own name.
    firstName: row.firstName || "",
    lastName: row.lastName || "",
    company: row.company || "",
    address1: row.address1 || "",
    address2: row.address2 || "",
    city: row.city || "",
    province: row.province || "",
    country: row.country || "",
    zip: row.zip || "",
    phone: row.addressPhone || "",
  },
});

const buildRestConsent = (subscribed, { isUpdate }) =>
  subscribed
    ? { state: "subscribed", opt_in_level: "single_opt_in" }
    : {
        state: isUpdate ? "unsubscribed" : "not_subscribed",
        opt_in_level: "single_opt_in",
      };

const ADDRESS_MEANINGFUL_KEYS = [
  "company",
  "address1",
  "address2",
  "city",
  "zip",
  "phone",
  "provinceCode",
];

const buildAddressBody = (payload, { isUpdate = false } = {}) => {
  const address = payload.address || {};
  const existingId = toAddressRestId(address.id);

  const hasContent = ADDRESS_MEANINGFUL_KEYS.some((key) =>
    trimOrNull(address[key])
  );
  if (!hasContent && !existingId) return null;

  const body = assignFields(
    {},
    {
      company: address.company,
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      zip: address.zip,
      phone: address.phone,
      province: address.provinceCode,
      country: address.countryCode,
      // The address recipient mirrors the customer's own name.
      first_name: payload.firstName,
      last_name: payload.lastName,
    },
    { includeEmpty: isUpdate }
  );

  // Country must be present so Shopify can recompute country_code.
  if (!body.country) {
    const country = trimOrNull(address.countryCode);
    if (country) body.country = country;
  }

  if (existingId) body.id = Number(existingId);

  return body;
};

const buildRestCustomer = (payload = {}, { id, isUpdate = false } = {}) => {
  const body = {};
  if (id) body.id = Number(id);

  assignFields(
    body,
    {
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      note: payload.note,
    },
    { includeEmpty: isUpdate }
  );

  body.tax_exempt = payload.taxSetting === "dont_collect";
  // Always sent (empty string clears all tags).
  body.tags = String(payload.tags ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .join(", ");

  if (trimOrNull(payload.email)) {
    body.email_marketing_consent = buildRestConsent(
      Boolean(payload.emailSubscribed),
      { isUpdate }
    );
  }
  if (trimOrNull(payload.phone)) {
    body.sms_marketing_consent = buildRestConsent(
      Boolean(payload.smsSubscribed),
      { isUpdate }
    );
  }

  if (!isUpdate) {
    const address = buildAddressBody(payload, { isUpdate: false });
    if (address) body.addresses = [address];
  }

  return body;
};

const restError = (response, fallback) => {
  const body = response?.body;
  const errors = body?.errors;
  let message = fallback;
  if (typeof errors === "string") {
    message = errors;
  } else if (errors && typeof errors === "object") {
    message = Object.entries(errors)
      .map(
        ([field, msgs]) =>
          `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`
      )
      .join("; ");
  }
  const err = new Error(message || fallback);
  err.statusCode = 422;
  return err;
};

// REST has no locale; keep the form value working by storing it locally only.
const persistLocaleLocally = async (row, payload) => {
  const locale = trimOrNull(payload.locale);
  if (locale && row.locale !== locale) {
    row.locale = locale;
    await row.save();
  }
};

const createCustomer = async (shop, payload) => {
  const client = getRestClient(shop);
  const body = buildRestCustomer(payload, { isUpdate: false });

  const response = await client.post({
    path: "customers",
    type: "application/json",
    data: { customer: body },
  });

  const node = response?.body?.customer;
  if (!node?.id)
    throw restError(response, "Shopify did not return the customer");

  const row = await upsertCustomer(shop, mapRestCustomer(node));
  await persistLocaleLocally(row, payload);

  try {
    await Comment.create({
      shopId: shop.id,
      customerId: row.id,
      authorName: shop.shopOwner || shop.name || "Staff",
      body: "Customer was created.",
    });
  } catch (error) {
    console.error("Failed to seed creation comment:", error.message);
  }

  return toCustomerDetail(row);
};

const applyDefaultAddress = async (client, customerId, payload, dbRow) => {
  const addressBody = buildAddressBody(payload, { isUpdate: true });
  if (!addressBody) return;

  const existingId = addressBody.id || toAddressRestId(dbRow.addressId);

  if (existingId) {
    await client.put({
      path: `customers/${customerId}/addresses/${existingId}`,
      type: "application/json",
      data: { address: { ...addressBody, id: Number(existingId) } },
    });
    return;
  }

  // No address yet: create one, then promote it to the default.
  const created = await client.post({
    path: `customers/${customerId}/addresses`,
    type: "application/json",
    data: { address: addressBody },
  });
  const newId = created?.body?.customer_address?.id;
  if (newId) {
    await client.put({
      path: `customers/${customerId}/addresses/${newId}/default`,
      type: "application/json",
      data: {},
    });
  }
};

const updateCustomer = async (shop, dbRow, payload) => {
  const client = getRestClient(shop);
  const shopifyId = dbRow.shopifyId;

  // 1) Core customer fields. Addresses are handled separately (see below).
  const body = buildRestCustomer(payload, { id: shopifyId, isUpdate: true });

  const response = await client.put({
    path: `customers/${shopifyId}`,
    type: "application/json",
    data: { customer: body },
  });

  const node = response?.body?.customer;
  if (!node?.id) throw restError(response, "Shopify rejected the customer");

  // 2) Address through its own endpoint.
  await applyDefaultAddress(client, shopifyId, payload, dbRow);

  const fresh = await client.get({ path: `customers/${shopifyId}` });
  const freshNode = fresh?.body?.customer || node;

  const row = await upsertCustomer(shop, mapRestCustomer(freshNode));
  await persistLocaleLocally(row, payload);

  return toCustomerDetail(row);
};

const deleteCustomers = async (shop, customerIds) => {
  const ids = Array.isArray(customerIds)
    ? [
        ...new Set(
          customerIds.map((id) => parseInt(id, 10)).filter((id) => id > 0)
        ),
      ]
    : [];

  if (!ids.length) {
    const err = new Error("No valid customer ids to delete");
    err.statusCode = 400;
    throw err;
  }

  const customers = await Customer.findAll({
    where: { id: ids, shopId: shop.id },
  });

  if (!customers.length) {
    const err = new Error("No matching customers found");
    err.statusCode = 404;
    throw err;
  }

  const client = getRestClient(shop);
  const deletedIds = [];
  for (const customer of customers) {
    await client.delete({ path: `customers/${customer.shopifyId}` });
    deletedIds.push(customer.id);
  }

  // Remove timeline comments first (FK may not be ON DELETE CASCADE), then rows.
  await Comment.destroy({
    where: { customerId: deletedIds, shopId: shop.id },
  });
  await Customer.destroy({ where: { id: deletedIds, shopId: shop.id } });

  return { deletedCount: deletedIds.length, deletedIds };
};

module.exports = {
  mapRestCustomer,
  upsertCustomer,
  toCustomerDTO,
  toCustomerDetail,
  createCustomer,
  updateCustomer,
  deleteCustomers,
};
