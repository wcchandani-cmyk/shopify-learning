const Order = require("./model");
const Customer = require("../customer/model");
const Comment = require("../comment/model");
const Product = require("../product/model");
const {
  getRestClient,
  getGraphQLClient,
  extractGraphqlError,
} = require("../../utils/shopify");
const {
  ORDER_CANCEL_MUTATION,
  ORDER_FULFILLMENT_ORDERS_QUERY,
  FULFILLMENT_ORDER_RELEASE_HOLD_MUTATION,
  FULFILLMENT_ORDER_CANCEL_MUTATION,
  JOB_STATUS_QUERY,
  PAYMENT_TERMS_TEMPLATES_QUERY,
  DRAFT_ORDER_CREATE_MUTATION,
  DRAFT_ORDER_COMPLETE_MUTATION,
  ORDER_MARK_AS_PAID_MUTATION,
  FULFILLMENT_CREATE_MUTATION,
  FULFILLMENT_ORDER_HOLD_MUTATION,
} = require("./query");

const waitForJob = async (
  graphqlClient,
  jobId,
  { tries = 6, delayMs = 700 } = {}
) => {
  for (let i = 0; i < tries; i += 1) {
    try {
      const resp = await graphqlClient.request(JOB_STATUS_QUERY, {
        variables: { id: jobId },
      });
      if (resp?.data?.job?.done) return true;
    } catch (error) {
      console.warn("Job poll failed:", extractGraphqlError(error));
      return false;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
};

const mapRestOrder = async (shop, node) => {
  const shopifyId = node?.id != null ? String(node.id) : null;
  if (!shopifyId) return null;

  let customerId = null;
  if (node.customer?.id) {
    const cust = await Customer.findOne({
      where: { shopId: shop.id, shopifyId: String(node.customer.id) },
    });
    if (cust) {
      customerId = cust.id;
    }
  }

  let totalShipping = 0;
  if (Array.isArray(node.shipping_lines)) {
    totalShipping = node.shipping_lines.reduce(
      (sum, line) => sum + parseFloat(line.price || 0),
      0
    );
  }

  let itemsCount = 0;
  if (Array.isArray(node.line_items)) {
    itemsCount = node.line_items.reduce(
      (sum, item) => sum + parseInt(item.quantity || 0, 10),
      0
    );
  }

  return {
    shopifyId,
    shopId: shop.id,
    customerId,
    orderNumber: node.order_number || null,
    name: node.name || null,
    email: node.email || null,
    phone: node.phone || null,
    totalPrice: parseFloat(node.total_price || 0),
    subtotalPrice: parseFloat(node.subtotal_price || 0),
    totalTax: parseFloat(node.total_tax || 0),
    totalShipping,
    currency: node.currency || null,
    financialStatus: node.financial_status || "pending",
    fulfillmentStatus: node.fulfillment_status || "unfulfilled",
    shopifyCreatedAt: node.created_at || null,
    shopifyUpdatedAt: node.updated_at || null,
    lineItems: node.line_items ? JSON.stringify(node.line_items) : null,
    shippingAddress: node.shipping_address
      ? JSON.stringify(node.shipping_address)
      : null,
    billingAddress: node.billing_address
      ? JSON.stringify(node.billing_address)
      : null,
    note: node.note || null,
    tags:
      node.financial_status === "pending" &&
      !(node.tags || "").includes("Draft")
        ? node.tags
          ? `${node.tags}, Draft`
          : "Draft"
        : node.tags || null,
    channel:
      node.source_name && node.source_name !== "web"
        ? node.source_name === "pos"
          ? "POS"
          : shop.name || shop.shopOwner || "Admin"
        : "Online Store",
    testOrder: Boolean(node.test),
  };
};

const upsertOrder = async (shop, mappedNode) => {
  if (!mappedNode?.shopifyId) return null;

  const existing = await Order.findOne({
    where: { shopId: shop.id, shopifyId: mappedNode.shopifyId },
  });

  if (existing) {
    const updates = { ...mappedNode };
    if (!updates.customerId && existing.customerId) {
      updates.customerId = existing.customerId;
    }

    // Preserve the Draft tag and DraftNumber:X tag if they exist locally
    const existingTags = (existing.tags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (existingTags.includes("Draft")) {
      const incomingTags = (updates.tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (!incomingTags.includes("Draft")) {
        incomingTags.push("Draft");
      }
      const draftNumTag = existingTags.find((t) =>
        t.startsWith("DraftNumber:")
      );
      if (
        draftNumTag &&
        !incomingTags.some((t) => t.startsWith("DraftNumber:"))
      ) {
        incomingTags.push(draftNumTag);
      }
      updates.tags = incomingTags.join(", ");
    }

    await existing.update(updates);
    return existing;
  }

  return Order.create(mappedNode);
};

const removeLocalOrder = async (shop, shopifyId) => {
  const local = await Order.findOne({
    where: { shopId: shop.id, shopifyId },
  });
  if (!local) return false;
  await Comment.destroy({ where: { shopId: shop.id, orderId: local.id } });
  await local.destroy();
  return true;
};

const toOrderDTO = (row) => {
  let itemsCount = 0;
  try {
    const items = row.lineItems ? JSON.parse(row.lineItems) : [];
    itemsCount = items.reduce(
      (sum, item) => sum + parseInt(item.quantity || 0, 10),
      0
    );
  } catch {
    itemsCount = 0;
  }

  const customer = row.customer;
  const customerName = customer
    ? customer.displayName ||
      [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim()
    : "";

  const match = (row.tags || "").match(/DraftNumber:(\d+)/);
  const draftName = match
    ? `D${match[1]}`
    : (row.tags || "").includes("Draft")
    ? `D${row.id}`
    : null;
  const displayName = row.name || `#${row.orderNumber}`;

  return {
    id: row.id,
    shopifyId: String(row.shopifyId),
    orderNumber: row.orderNumber,
    name: displayName,
    draftName,
    createdAt: row.shopifyCreatedAt || row.createdAt,
    email: row.email,
    phone: row.phone,
    totalPrice: String(row.totalPrice),
    currency: row.currency || "USD",
    financialStatus: row.financialStatus || "pending",
    fulfillmentStatus: row.fulfillmentStatus || "unfulfilled",
    itemsCount,
    testOrder: Boolean(row.testOrder),
    tags: row.tags || "",
    channel: row.channel || "Online Store",
    customerName: customerName || null,
    customerEmail: customer?.email || null,
  };
};

const toOrderDetail = async (row) => {
  let lineItems = [];
  try {
    lineItems = row.lineItems ? JSON.parse(row.lineItems) : [];
  } catch {
    lineItems = [];
  }

  const productIds = [
    ...new Set(
      lineItems
        .map((item) => item.product_id)
        .filter((pid) => pid != null)
        .map((pid) => String(pid))
    ),
  ];

  let productImageMap = {};
  if (productIds.length) {
    const products = await Product.findAll({
      where: { shopId: row.shopId, shopifyId: productIds },
      attributes: ["shopifyId", "imageUrl", "imageAlt"],
    });
    productImageMap = products.reduce((acc, product) => {
      acc[String(product.shopifyId)] = {
        imageUrl: product.imageUrl,
        imageAlt: product.imageAlt,
      };
      return acc;
    }, {});
  }

  lineItems = lineItems.map((item) => {
    const image =
      item.product_id != null ? productImageMap[String(item.product_id)] : null;
    const variantTitle =
      item.variant_title && item.variant_title !== "Default Title"
        ? item.variant_title
        : null;
    return {
      ...item,
      imageUrl: image?.imageUrl || null,
      imageAlt: image?.imageAlt || item.title || "",
      variantTitle,
    };
  });

  let shippingAddress = null;
  try {
    shippingAddress = row.shippingAddress
      ? JSON.parse(row.shippingAddress)
      : null;
  } catch {
    shippingAddress = null;
  }

  let billingAddress = null;
  try {
    billingAddress = row.billingAddress ? JSON.parse(row.billingAddress) : null;
  } catch {
    billingAddress = null;
  }

  let customerDetails = null;
  if (row.customerId) {
    const customer = await Customer.findByPk(row.customerId);
    if (customer) {
      const localOrderCount = await Order.count({
        where: { shopId: row.shopId, customerId: row.customerId },
      });

      customerDetails = {
        id: customer.id,
        shopifyId: String(customer.shopifyId),
        displayName:
          customer.displayName || `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        phone: customer.phone,
        numberOfOrders: Math.max(
          Number(customer.numberOfOrders || 0),
          localOrderCount
        ),
        company: customer.company,
      };
    }
  }

  const match = (row.tags || "").match(/DraftNumber:(\d+)/);
  const draftName = match
    ? `D${match[1]}`
    : (row.tags || "").includes("Draft")
    ? `D${row.id}`
    : null;
  const displayName = row.name || `#${row.orderNumber}`;

  return {
    id: row.id,
    shopifyId: String(row.shopifyId),
    orderNumber: row.orderNumber,
    name: displayName,
    draftName,
    createdAt: row.shopifyCreatedAt || row.createdAt,
    updatedAt: row.shopifyUpdatedAt || row.updatedAt,
    email: row.email,
    phone: row.phone,
    totalPrice: String(row.totalPrice),
    subtotalPrice: String(row.subtotalPrice),
    totalTax: String(row.totalTax),
    totalShipping: String(row.totalShipping),
    currency: row.currency || "USD",
    financialStatus: row.financialStatus || "pending",
    fulfillmentStatus: row.fulfillmentStatus || "unfulfilled",
    lineItems,
    shippingAddress,
    billingAddress,
    note: row.note || "",
    tags: row.tags || "",
    testOrder: Boolean(row.testOrder),
    channel: row.channel || "Online Store",
    customer: customerDetails,
  };
};

const syncOrdersFromShopify = async (shop) => {
  const client = getRestClient(shop);
  try {
    const response = await client.get({
      path: "orders",
      query: { status: "any", limit: 50 },
    });

    const restOrders = response.body?.orders || [];
    const syncedOrders = [];

    for (const restOrder of restOrders) {
      if (restOrder.cancelled_at) {
        await removeLocalOrder(shop, String(restOrder.id));
        continue;
      }

      const mapped = await mapRestOrder(shop, restOrder);
      if (mapped) {
        const order = await upsertOrder(shop, mapped);
        syncedOrders.push(order);
      }
    }

    return syncedOrders;
  } catch (error) {
    console.error("Failed to sync orders from Shopify:", error.message);
    throw error;
  }
};

const getPaymentTermsTemplates = async (shop) => {
  const { graphqlClient } = getGraphQLClient({
    shopDomain: shop.myshopifyDomain,
    accessToken: shop.token,
  });

  const resp = await graphqlClient.request(PAYMENT_TERMS_TEMPLATES_QUERY);
  const templates = resp?.data?.paymentTermsTemplates || [];

  return templates
    .filter((t) => t.paymentTermsType !== "FIXED")
    .map((t) => ({
      id: t.id,
      name: t.translatedName || t.name,
      type: t.paymentTermsType,
      dueInDays: t.dueInDays,
    }));
};

const toVariantGid = (variantId) => {
  const raw = String(variantId);
  return raw.startsWith("gid://") ? raw : `gid://shopify/ProductVariant/${raw}`;
};

const buildDraftLineItems = (lineItems = []) =>
  lineItems.map((item) => {
    if (item.variantId) {
      return {
        variantId: toVariantGid(item.variantId),
        quantity: parseInt(item.quantity, 10),
      };
    }
    const line = {
      title: item.title,
      originalUnitPrice: parseFloat(item.price),
      quantity: parseInt(item.quantity, 10),
    };
    if (item.requiresShipping !== undefined) {
      line.requiresShipping = Boolean(item.requiresShipping);
    }
    if (item.taxable !== undefined) {
      line.taxable = Boolean(item.taxable);
    }
    return line;
  });

const createPendingOrderViaDraft = async (shop, payload) => {
  const { graphqlClient } = getGraphQLClient({
    shopDomain: shop.myshopifyDomain,
    accessToken: shop.token,
  });

  const input = {
    lineItems: buildDraftLineItems(payload.lineItems),
  };

  if (payload.note) input.note = payload.note;
  if (payload.tags) {
    input.tags = String(payload.tags)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  if (payload.customerShopifyId) {
    input.purchasingEntity = {
      customerId: `gid://shopify/Customer/${payload.customerShopifyId}`,
    };
  }

  if (payload.shippingAddress) input.shippingAddress = payload.shippingAddress;
  if (payload.billingAddress) input.billingAddress = payload.billingAddress;

  if (payload.shipping && Number(payload.shipping.amount) > 0) {
    input.shippingLine = {
      title: payload.shipping.title || "Shipping",
      price: Number(payload.shipping.amount),
    };
  }

  if (payload.discount && Number(payload.discount.amount) > 0) {
    const isPercentage = payload.discount.type === "percentage";
    input.appliedDiscount = {
      title: payload.discount.reason || "Discount",
      description: payload.discount.reason || "Discount",
      valueType: isPercentage ? "PERCENTAGE" : "FIXED_AMOUNT",
      value: isPercentage
        ? Number(payload.discount.value)
        : Number(payload.discount.amount),
    };
  }

  const paymentTerms = {
    paymentTermsTemplateId: payload.paymentTerms.templateId,
  };

  if (payload.paymentTerms.type === "NET") {
    paymentTerms.paymentSchedules = [{ issuedAt: new Date().toISOString() }];
  }
  input.paymentTerms = paymentTerms;

  const createResp = await graphqlClient.request(DRAFT_ORDER_CREATE_MUTATION, {
    variables: { input },
  });
  const createErrors = createResp?.data?.draftOrderCreate?.userErrors || [];
  if (createErrors.length) {
    throw new Error(createErrors.map((e) => e.message).join("; "));
  }
  const draftId = createResp?.data?.draftOrderCreate?.draftOrder?.id;
  if (!draftId) throw new Error("Shopify did not return a draft order");

  const completeResp = await graphqlClient.request(
    DRAFT_ORDER_COMPLETE_MUTATION,
    { variables: { id: draftId, paymentPending: true } }
  );
  const completeErrors =
    completeResp?.data?.draftOrderComplete?.userErrors || [];
  if (completeErrors.length) {
    throw new Error(completeErrors.map((e) => e.message).join("; "));
  }
  const completedOrder =
    completeResp?.data?.draftOrderComplete?.draftOrder?.order;
  const legacyId = completedOrder?.legacyResourceId;
  if (!legacyId) {
    throw new Error("Draft order was completed but no order was returned");
  }

  const client = getRestClient(shop);
  const orderResp = await client.get({ path: `orders/${legacyId}` });
  const node = orderResp?.body?.order;
  if (!node?.id) throw new Error("Could not load the created order");

  const mapped = await mapRestOrder(shop, node);
  const row = await upsertOrder(shop, mapped);

  try {
    await Comment.create({
      shopId: shop.id,
      orderId: row.id,
      authorName: shop.shopOwner || shop.name || "Staff",
      body: "Order was created with payment due later.",
    });
  } catch (err) {
    console.error("Failed to seed creation comment:", err.message);
  }

  return toOrderDetail(row);
};

const createOrder = async (shop, payload) => {
  const existingTags = payload.tags
    ? String(payload.tags)
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
  const isDraft =
    payload.financialStatus === "pending" || existingTags.includes("Draft");

  if (isDraft) {
    const { Op } = require("sequelize");
    const draftCount = await Order.count({
      where: {
        shopId: shop.id,
        tags: { [Op.like]: "%Draft%" },
      },
    });
    const nextDraftNum = draftCount + 1;

    if (!existingTags.includes("Draft")) {
      existingTags.push("Draft");
    }
    if (!existingTags.some((t) => t.startsWith("DraftNumber:"))) {
      existingTags.push(`DraftNumber:${nextDraftNum}`);
    }
    payload.tags = existingTags.join(", ");
  }

  if (payload.paymentDueLater && payload.paymentTerms?.templateId) {
    return createPendingOrderViaDraft(shop, payload);
  }

  const client = getRestClient(shop);

  const shopifyOrder = {
    line_items: (payload.lineItems || []).map((item) => {
      const line = {
        title: item.title,
        price: parseFloat(item.price),
        quantity: parseInt(item.quantity, 10),
      };
      if (item.variantId) {
        line.variant_id = Number(item.variantId);
      }
      if (item.taxable !== undefined) {
        line.taxable = Boolean(item.taxable);
      }
      if (item.requiresShipping !== undefined) {
        line.requires_shipping = Boolean(item.requiresShipping);
      }
      if (item.weight !== undefined) {
        line.weight = parseFloat(item.weight);
        line.weight_unit = item.weightUnit || "kg";
      }
      return line;
    }),
    financial_status: payload.financialStatus || "pending",
    note: payload.note || null,
    tags: payload.tags || null,
    inventory_behaviour: "decrement_ignoring_policy",
  };

  if (payload.financialStatus === "paid" && payload.paymentMethod) {
    const saleAmount = Number(payload.totalPrice);
    if (Number.isFinite(saleAmount) && saleAmount > 0) {
      shopifyOrder.transactions = [
        {
          kind: "sale",
          status: "success",
          gateway: payload.paymentMethod,
          amount: saleAmount.toFixed(2),
        },
      ];
    }
  }

  if (payload.currency) {
    shopifyOrder.currency = payload.currency;
  }

  if (payload.shipping && Number(payload.shipping.amount) > 0) {
    shopifyOrder.shipping_lines = [
      {
        title: payload.shipping.title || "Shipping",
        price: Number(payload.shipping.amount),
      },
    ];
  }

  if (payload.discount && Number(payload.discount.amount) > 0) {
    shopifyOrder.discount_codes = [
      {
        code: payload.discount.reason || "Discount",
        amount: Number(payload.discount.amount).toFixed(2),
        type: "fixed_amount",
      },
    ];
  }

  if (payload.customerShopifyId) {
    shopifyOrder.customer = {
      id: Number(payload.customerShopifyId),
    };
  }

  if (payload.shippingAddress) {
    shopifyOrder.shipping_address = payload.shippingAddress;
  }
  if (payload.billingAddress) {
    shopifyOrder.billing_address = payload.billingAddress;
  }

  const response = await client.post({
    path: "orders",
    type: "application/json",
    data: { order: shopifyOrder },
  });

  const node = response?.body?.order;
  if (!node?.id) {
    const errors = response?.body?.errors;
    let errMsg = "Shopify rejected the order";
    if (typeof errors === "object") {
      errMsg = Object.entries(errors)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
        .join("; ");
    }
    throw new Error(errMsg);
  }

  const mapped = await mapRestOrder(shop, node);
  const row = await upsertOrder(shop, mapped);

  try {
    await Comment.create({
      shopId: shop.id,
      orderId: row.id,
      authorName: shop.shopOwner || shop.name || "Staff",
      body: `Order was placed on Online Store.`,
    });
    if (row.financialStatus === "paid") {
      await Comment.create({
        shopId: shop.id,
        orderId: row.id,
        authorName: shop.shopOwner || shop.name || "Staff",
        body: `${row.currency} ${row.totalPrice} USD was captured using direct gateway.`,
      });
    }
  } catch (err) {
    console.error("Failed to seed creation comments:", err.message);
  }

  return toOrderDetail(row);
};

const markOrderAsPaid = async (shop, order) => {
  const { graphqlClient } = getGraphQLClient({
    shopDomain: shop.myshopifyDomain,
    accessToken: shop.token,
  });

  let resp;
  try {
    resp = await graphqlClient.request(ORDER_MARK_AS_PAID_MUTATION, {
      variables: { input: { id: `gid://shopify/Order/${order.shopifyId}` } },
    });
  } catch (error) {
    throw new Error(extractGraphqlError(error));
  }

  const result = resp?.data?.orderMarkAsPaid;
  const userErrors = result?.userErrors || [];
  if (userErrors.length) {
    throw new Error(userErrors.map((e) => e.message).join("; "));
  }

  const status = (
    result?.order?.displayFinancialStatus || "PAID"
  ).toLowerCase();

  try {
    await Comment.create({
      shopId: shop.id,
      orderId: order.id,
      authorName: shop.shopOwner || shop.name || "Staff",
      body: `${order.currency || "USD"} ${
        order.totalPrice
      } was marked as paid.`,
    });
  } catch (err) {
    console.error("Failed to seed mark-as-paid comment:", err.message);
  }

  return status;
};

const VALID_CANCEL_REASONS = new Set([
  "CUSTOMER",
  "DECLINED",
  "FRAUD",
  "INVENTORY",
  "STAFF",
  "OTHER",
]);

const clearOutstandingFulfillments = async (graphqlClient, orderGid) => {
  let nodes = [];
  try {
    const resp = await graphqlClient.request(ORDER_FULFILLMENT_ORDERS_QUERY, {
      variables: { id: orderGid },
    });
    nodes = resp?.data?.order?.fulfillmentOrders?.nodes || [];
  } catch (error) {
    console.warn(
      "Could not read fulfillment orders before cancel:",
      extractGraphqlError(error)
    );
    return;
  }

  for (const fo of nodes) {
    if (fo.status === "ON_HOLD") {
      const holdIds = (fo.fulfillmentHolds || [])
        .map((hold) => hold.id)
        .filter(Boolean);
      try {
        await graphqlClient.request(FULFILLMENT_ORDER_RELEASE_HOLD_MUTATION, {
          variables: { id: fo.id, holdIds: holdIds.length ? holdIds : null },
        });
      } catch (error) {
        console.warn(
          `Could not release hold on ${fo.id}:`,
          extractGraphqlError(error)
        );
      }
    }

    if (
      fo.requestStatus === "SUBMITTED" ||
      fo.requestStatus === "CANCELLATION_REQUESTED"
    ) {
      try {
        await graphqlClient.request(FULFILLMENT_ORDER_CANCEL_MUTATION, {
          variables: { id: fo.id },
        });
      } catch (error) {
        console.warn(
          `Could not cancel fulfillment request ${fo.id}:`,
          extractGraphqlError(error)
        );
      }
    }
  }
};

const cancelOrder = async (shop, order, payload = {}) => {
  const reason = VALID_CANCEL_REASONS.has(payload.reason)
    ? payload.reason
    : "OTHER";

  const { graphqlClient } = getGraphQLClient({
    shopDomain: shop.myshopifyDomain,
    accessToken: shop.token,
  });

  const orderGid = `gid://shopify/Order/${order.shopifyId}`;

  await clearOutstandingFulfillments(graphqlClient, orderGid);

  const variables = {
    orderId: orderGid,
    reason,
    refundMethod: { originalPaymentMethodsRefund: Boolean(payload.refund) },
    restock: payload.restock !== false,
    notifyCustomer: Boolean(payload.notifyCustomer),
    staffNote: payload.staffNote
      ? String(payload.staffNote).slice(0, 255)
      : null,
  };

  let response;
  try {
    response = await graphqlClient.request(ORDER_CANCEL_MUTATION, {
      variables,
    });
  } catch (error) {
    throw new Error(extractGraphqlError(error));
  }

  const result = response?.data?.orderCancel;
  const userErrors = [
    ...(result?.orderCancelUserErrors || []),
    ...(result?.userErrors || []),
  ];
  if (userErrors.length) {
    const messages = userErrors.map((e) => e.message);
    const friendly = messages.some((m) => /outstanding fulfillment/i.test(m))
      ? "This order can't be cancelled because it has in-progress fulfillments. Open the order in Shopify and cancel or remove the fulfillment first, then try again."
      : messages.join("; ");
    throw new Error(friendly);
  }

  if (result?.job?.id) {
    await waitForJob(graphqlClient, result.job.id);
  }

  await removeLocalOrder(shop, String(order.shopifyId));
  return { id: order.id, deleted: true };
};

const fulfillOrderOnShopify = async (shop, order) => {
  const { graphqlClient } = getGraphQLClient({
    shopDomain: shop.myshopifyDomain,
    accessToken: shop.token,
  });

  const orderGid = `gid://shopify/Order/${order.shopifyId}`;

  // 1. Fetch fulfillment orders
  let resp;
  try {
    resp = await graphqlClient.request(ORDER_FULFILLMENT_ORDERS_QUERY, {
      variables: { id: orderGid },
    });
  } catch (error) {
    throw new Error(
      `Failed to fetch Shopify fulfillment orders: ${extractGraphqlError(
        error
      )}`
    );
  }

  const nodes = resp?.data?.order?.fulfillmentOrders?.nodes || [];
  const fulfillmentOrderIdsToFulfill = [];

  for (const fo of nodes) {
    let currentStatus = fo.status;

    // 2. Release hold if ON_HOLD
    if (currentStatus === "ON_HOLD") {
      const holdIds = (fo.fulfillmentHolds || [])
        .map((hold) => hold.id)
        .filter(Boolean);
      try {
        const releaseResp = await graphqlClient.request(
          FULFILLMENT_ORDER_RELEASE_HOLD_MUTATION,
          {
            variables: { id: fo.id, holdIds: holdIds.length ? holdIds : null },
          }
        );
        const releaseErrors =
          releaseResp?.data?.fulfillmentOrderReleaseHold?.userErrors || [];
        if (releaseErrors.length) {
          console.warn(
            `Failed to release hold on ${fo.id}:`,
            releaseErrors.map((e) => e.message).join("; ")
          );
        } else {
          currentStatus = "OPEN";
        }
      } catch (error) {
        console.warn(
          `Could not release hold on ${fo.id} before fulfillment:`,
          extractGraphqlError(error)
        );
      }
    }

    // 3. Fulfill if OPEN or IN_PROGRESS
    if (currentStatus === "OPEN" || currentStatus === "IN_PROGRESS") {
      fulfillmentOrderIdsToFulfill.push(fo.id);
    }
  }

  if (fulfillmentOrderIdsToFulfill.length === 0) {
    return;
  }

  // 4. Create fulfillment
  const lineItemsByFulfillmentOrder = fulfillmentOrderIdsToFulfill.map(
    (id) => ({
      fulfillmentOrderId: id,
    })
  );

  try {
    const fulfillResp = await graphqlClient.request(
      FULFILLMENT_CREATE_MUTATION,
      {
        variables: {
          fulfillment: {
            lineItemsByFulfillmentOrder,
          },
        },
      }
    );

    const userErrors = fulfillResp?.data?.fulfillmentCreate?.userErrors || [];
    if (userErrors.length) {
      throw new Error(userErrors.map((e) => e.message).join("; "));
    }
  } catch (error) {
    throw new Error(
      `Shopify fulfillment failed: ${extractGraphqlError(error)}`
    );
  }
};

const mapHoldReasonToEnum = (reason) => {
  if (!reason) return "OTHER";
  const normalized = reason.toLowerCase();
  if (normalized.includes("inventory") || normalized.includes("stock")) {
    return "INVENTORY";
  }
  if (normalized.includes("address") || normalized.includes("location")) {
    return "INCORRECT_ADDRESS";
  }
  if (normalized.includes("risk") || normalized.includes("fraud")) {
    return "HIGH_RISK";
  }
  if (normalized.includes("payment")) {
    return "AWAITING_PAYMENT";
  }
  if (normalized.includes("customer")) {
    return "CUSTOMER_REQUEST";
  }
  return "OTHER";
};

const holdOrderOnShopify = async (shop, order, reasonText) => {
  const { graphqlClient } = getGraphQLClient({
    shopDomain: shop.myshopifyDomain,
    accessToken: shop.token,
  });

  const orderGid = `gid://shopify/Order/${order.shopifyId}`;

  let resp;
  try {
    resp = await graphqlClient.request(ORDER_FULFILLMENT_ORDERS_QUERY, {
      variables: { id: orderGid },
    });
  } catch (error) {
    throw new Error(
      `Failed to fetch Shopify fulfillment orders: ${extractGraphqlError(
        error
      )}`
    );
  }

  const nodes = resp?.data?.order?.fulfillmentOrders?.nodes || [];
  const reason = mapHoldReasonToEnum(reasonText);

  for (const fo of nodes) {
    if (fo.status === "OPEN" || fo.status === "IN_PROGRESS") {
      try {
        const holdResp = await graphqlClient.request(
          FULFILLMENT_ORDER_HOLD_MUTATION,
          {
            variables: {
              id: fo.id,
              reason,
              reasonNotes: reasonText || "Placed on hold via app",
            },
          }
        );
        const userErrors =
          holdResp?.data?.fulfillmentOrderHold?.userErrors || [];
        if (userErrors.length) {
          throw new Error(userErrors.map((e) => e.message).join("; "));
        }
      } catch (error) {
        throw new Error(
          `Could not hold fulfillment order ${fo.id}: ${extractGraphqlError(
            error
          )}`
        );
      }
    }
  }
};

const releaseOrderHoldOnShopify = async (shop, order) => {
  const { graphqlClient } = getGraphQLClient({
    shopDomain: shop.myshopifyDomain,
    accessToken: shop.token,
  });

  const orderGid = `gid://shopify/Order/${order.shopifyId}`;

  let resp;
  try {
    resp = await graphqlClient.request(ORDER_FULFILLMENT_ORDERS_QUERY, {
      variables: { id: orderGid },
    });
  } catch (error) {
    throw new Error(
      `Failed to fetch Shopify fulfillment orders: ${extractGraphqlError(
        error
      )}`
    );
  }

  const nodes = resp?.data?.order?.fulfillmentOrders?.nodes || [];

  for (const fo of nodes) {
    if (fo.status === "ON_HOLD") {
      const holdIds = (fo.fulfillmentHolds || [])
        .map((hold) => hold.id)
        .filter(Boolean);
      try {
        const releaseResp = await graphqlClient.request(
          FULFILLMENT_ORDER_RELEASE_HOLD_MUTATION,
          {
            variables: { id: fo.id, holdIds: holdIds.length ? holdIds : null },
          }
        );
        const userErrors =
          releaseResp?.data?.fulfillmentOrderReleaseHold?.userErrors || [];
        if (userErrors.length) {
          throw new Error(userErrors.map((e) => e.message).join("; "));
        }
      } catch (error) {
        throw new Error(
          `Could not release hold on fulfillment order ${
            fo.id
          }: ${extractGraphqlError(error)}`
        );
      }
    }
  }
};

module.exports = {
  mapRestOrder,
  upsertOrder,
  toOrderDTO,
  toOrderDetail,
  syncOrdersFromShopify,
  createOrder,
  cancelOrder,
  getPaymentTermsTemplates,
  markOrderAsPaid,
  fulfillOrderOnShopify,
  holdOrderOnShopify,
  releaseOrderHoldOnShopify,
};
