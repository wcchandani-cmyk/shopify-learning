const Customer = require("./model");
const Comment = require("../comment/model");
const { getRestClient } = require("../../utils/shopify");

const trimOrNull = (v) => String(v ?? "").trim() || null;

const assignFields = (body, mapping, { includeEmpty }) => {
  Object.entries(mapping).forEach(([k, v]) => {
    const val = String(v ?? "").trim();
    if (val || includeEmpty) body[k] = val;
  });
  return body;
};

const toAddressRestId = (val) =>
  val == null
    ? null
    : String(val)
        .split("?")[0]
        .match(/(\d+)\s*$/)?.[1] || null;

const buildDisplayName = (first, last, email) =>
  [first, last].filter(Boolean).join(" ").trim() || email || "No name";

const mapRestCustomer = (node) => {
  const shopifyId = node?.id != null ? String(node.id) : null;
  if (!shopifyId) return null;

  const addr =
    node.default_address ||
    (Array.isArray(node.addresses)
      ? node.addresses.find((addrItem) => addrItem?.default) || node.addresses[0]
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
    taxExempt: !!node.tax_exempt,
    note: node.note || null,
    tags: node.tags || null,
    numberOfOrders: Number(node.orders_count || 0),
    amountSpent: node.total_spent ?? 0,
    currencyCode: node.currency || null,
    addressId: addr.id != null ? String(addr.id) : null,
    company: addr.company || null,
    address1: addr.address1 || null,
    address2: addr.address2 || null,
    city: addr.city || null,
    province: addr.province || null,
    country: addr.country || null,
    zip: addr.zip || null,
    addressPhone: addr.phone || null,
    shopifyUpdatedAt: node.updated_at || null,
  };
};

const isStaleUpdate = (inc, curr) =>
  inc && curr && new Date(inc).getTime() <= new Date(curr).getTime();

const upsertCustomer = async (shop, node, { guardStale = false } = {}) => {
  if (!node?.shopifyId) return null;
  const existing = await Customer.findOne({
    where: { shopId: shop.id, shopifyId: node.shopifyId },
  });
  if (existing) {
    if (
      guardStale &&
      isStaleUpdate(node.shopifyUpdatedAt, existing.shopifyUpdatedAt)
    )
      return null;
    return existing.update({ ...node, shopId: shop.id });
  }
  return Customer.create({ ...node, shopId: shop.id });
};

const toCustomerDTO = (row) => ({
  id: row.id,
  shopifyId: String(row.shopifyId),
  name: row.displayName || "No name",
  email: row.email || null,
  emailSubscribed: !!row.emailSubscribed,
  location: [row.city, row.province, row.country].filter(Boolean).join(", "),
  ordersCount: Number(row.numberOfOrders || 0),
  amountSpent: row.amountSpent != null ? String(row.amountSpent) : "0",
  currencyCode: row.currencyCode || null,
});

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
  emailSubscribed: !!row.emailSubscribed,
  smsSubscribed: !!row.smsSubscribed,
  taxSetting: row.taxExempt ? "dont_collect" : "collect",
  note: row.note || "",
  tags: row.tags || "",
  numberOfOrders: Number(row.numberOfOrders || 0),
  amountSpent: row.amountSpent != null ? String(row.amountSpent) : "0",
  currencyCode: row.currencyCode || null,
  address: {
    id: row.addressId || null,
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

const buildRestConsent = (sub, { isUpdate }) => ({
  state: sub ? "subscribed" : isUpdate ? "unsubscribed" : "not_subscribed",
  opt_in_level: "single_opt_in",
});

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
  if (
    !existingId &&
    !ADDRESS_MEANINGFUL_KEYS.some((keyName) => trimOrNull(address[keyName]))
  )
    return null;

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
      first_name: payload.firstName,
      last_name: payload.lastName,
    },
    { includeEmpty: isUpdate }
  );

  if (!body.country) {
    const country = trimOrNull(address.countryCode);
    if (country) body.country = country;
  }
  if (existingId) body.id = Number(existingId);
  return body;
};

const buildRestCustomer = (payload = {}, { id, isUpdate = false } = {}) => {
  const body = id ? { id: Number(id) } : {};
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
  body.tags = String(payload.tags ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .join(", ");

  if (trimOrNull(payload.email)) {
    body.email_marketing_consent = buildRestConsent(!!payload.emailSubscribed, {
      isUpdate,
    });
  }
  if (trimOrNull(payload.phone)) {
    body.sms_marketing_consent = buildRestConsent(!!payload.smsSubscribed, {
      isUpdate,
    });
  }
  if (!isUpdate) {
    const address = buildAddressBody(payload, { isUpdate: false });
    if (address) body.addresses = [address];
  }
  return body;
};

const restError = (response, fallback) => {
  const errors = response?.body?.errors;
  let message = fallback;
  if (typeof errors === "string") message = errors;
  else if (errors && typeof errors === "object") {
    message = Object.entries(errors)
      .map(
        ([f, msgs]) => `${f}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`
      )
      .join("; ");
  }
  const err = new Error(message || fallback);
  err.statusCode = 422;
  return err;
};

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
  const body = buildRestCustomer(payload, { id: shopifyId, isUpdate: true });

  const response = await client.put({
    path: `customers/${shopifyId}`,
    type: "application/json",
    data: { customer: body },
  });

  const node = response?.body?.customer;
  if (!node?.id) throw restError(response, "Shopify rejected the customer");

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

  await Comment.destroy({ where: { customerId: deletedIds, shopId: shop.id } });
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
