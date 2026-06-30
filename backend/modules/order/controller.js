const { successResponse, errorResponse } = require("../../utils/response");
const { getRestClient } = require("../../utils/shopify");
const { parsePageSize, handleError } = require("../../utils/controllerHelper");
const Order = require("./model");
const Customer = require("../customer/model");
const { createCommentHandlers } = require("../comment/controller");
const {
  toOrderDTO,
  toOrderDetail,
  syncOrdersFromShopify,
  createOrder: createOrderFlow,
  cancelOrder: cancelOrderFlow,
  getPaymentTermsTemplates,
  markOrderAsPaid,
  fulfillOrderOnShopify,
  holdOrderOnShopify,
  releaseOrderHoldOnShopify,
} = require("./orderService");

const resolveShopOrder = async (req) => {
  const shop = req.shop;
  const raw = String(req.params.id ?? "").trim();
  if (!/^\d+$/.test(raw)) return { error: [400, "Invalid order id"] };

  const order =
    (await Order.findOne({ where: { shopifyId: raw, shopId: shop.id } })) ||
    (await Order.findOne({ where: { id: raw, shopId: shop.id } }));

  return order ? { shop, order } : { error: [404, "Order not found"] };
};

const listOrders = async (req, res) => {
  try {
    const shop = req.shop;
    if (
      req.query.sync === "true" ||
      req.query.page === "1" ||
      !req.query.page
    ) {
      try {
        await syncOrdersFromShopify(shop);
      } catch (err) {
        console.warn("Background orders sync failed, using DB:", err.message);
      }
    }

    const { Op } = require("sequelize");
    const tab = req.query.tab || "orders";
    const where = { shopId: shop.id };

    if (tab === "drafts") {
      where.tags = { [Op.like]: "%Draft%" };
    } else {
      where[Op.or] = [
        { tags: null },
        { tags: { [Op.notLike]: "%Draft%" } },
        {
          [Op.and]: [
            { tags: { [Op.like]: "%Draft%" } },
            { financialStatus: { [Op.ne]: "pending" } },
          ],
        },
      ];
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = parsePageSize(req.query.limit);
    const offset = (page - 1) * limit;

    const { count: total, rows } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "displayName", "firstName", "lastName", "email"],
        },
      ],
      order: [["shopifyCreatedAt", "DESC"]],
      limit,
      offset,
    });

    const ordersCount = await Order.count({
      where: {
        shopId: shop.id,
        [Op.or]: [
          { tags: null },
          { tags: { [Op.notLike]: "%Draft%" } },
          {
            [Op.and]: [
              { tags: { [Op.like]: "%Draft%" } },
              { financialStatus: { [Op.ne]: "pending" } },
            ],
          },
        ],
      },
    });

    const draftsCount = await Order.count({
      where: { shopId: shop.id, tags: { [Op.like]: "%Draft%" } },
    });
    const orders = rows.map(toOrderDTO);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    successResponse(res, 200, "Orders fetched successfully", {
      returnedCount: orders.length,
      orders,
      count: total,
      ordersCount,
      draftsCount,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error listing orders:", error.message);
    handleError(res, error, "Failed to list orders");
  }
};

const getOrder = async (req, res) => {
  try {
    const { order, error } = await resolveShopOrder(req);
    if (error) return errorResponse(res, ...error);

    const detail = await toOrderDetail(order);
    successResponse(res, 200, "Order fetched successfully", detail);
  } catch (error) {
    console.error("Error fetching order:", error.message);
    handleError(res, error, "Failed to fetch order");
  }
};

const createOrder = async (req, res) => {
  try {
    const created = await createOrderFlow(req.shop, req.body);
    successResponse(res, 201, "Order created successfully", created);
  } catch (error) {
    console.error("Error creating order:", error.message);
    handleError(res, error, "Failed to create order");
  }
};

const listPaymentTerms = async (req, res) => {
  try {
    const paymentTerms = await getPaymentTermsTemplates(req.shop);
    successResponse(res, 200, "Payment terms fetched successfully", {
      paymentTerms,
    });
  } catch (error) {
    console.error("Error fetching payment terms:", error.message);
    handleError(res, error, "Failed to fetch payment terms");
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { shop, order, error } = await resolveShopOrder(req);
    if (error) return errorResponse(res, ...error);

    const detail = await cancelOrderFlow(shop, order, req.body || {});
    successResponse(res, 200, "Order cancelled successfully", detail);
  } catch (error) {
    console.error("Error cancelling order:", error.message);
    handleError(res, error, "Failed to cancel order");
  }
};

const { listComments, createComment, deleteComment } = createCommentHandlers({
  resolveParent: async (req) => {
    const { shop, order, error } = await resolveShopOrder(req);
    return { shop, parent: order, error };
  },
  foreignKey: "orderId",
  entityName: "order",
  fetchShopifyEvents: async (shop, order) => {
    const { getGraphQLClient } = require("../../utils/shopify");
    const { graphqlClient } = getGraphQLClient({
      shopDomain: shop.myshopifyDomain,
      accessToken: shop.token,
    });
    const { ORDER_EVENTS_QUERY } = require("./query");
    const resp = await graphqlClient.request(ORDER_EVENTS_QUERY, {
      variables: { id: `gid://shopify/Order/${order.shopifyId}` },
    });
    return (resp?.data?.order?.events?.nodes || []).map((evt) => ({
      id: evt.id,
      body: evt.message,
      authorName: "Shopify",
      createdAt: evt.createdAt,
      isSystemEvent: true,
    }));
  },
});


const updateOrder = async (req, res) => {
  try {
    const { shop, order, error } = await resolveShopOrder(req);
    if (error) return errorResponse(res, ...error);

    const { note, tags, customerId, fulfillmentStatus, financialStatus } =
      req.body;
    if (note !== undefined) order.note = note;

    if (tags !== undefined) {
      const existingTags = (order.tags || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      const incomingTags = (tags || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      if (existingTags.includes("Draft")) {
        if (!incomingTags.includes("Draft")) incomingTags.push("Draft");
        const draftNumTag = existingTags.find((tag) =>
          tag.startsWith("DraftNumber:")
        );
        if (
          draftNumTag &&
          !incomingTags.some((tag) => tag.startsWith("DraftNumber:"))
        )
          incomingTags.push(draftNumTag);
      }
      order.tags = incomingTags.join(", ");
    }

    let customerChanged = false;
    const oldCustomerId = order.customerId;
    if (customerId !== undefined && customerId !== oldCustomerId) {
      customerChanged = true;
      order.customerId = customerId || null;
    }

    let fulfillmentStatusChanged = false;
    const oldFulfillmentStatus = order.fulfillmentStatus;
    if (
      fulfillmentStatus !== undefined &&
      fulfillmentStatus !== order.fulfillmentStatus
    ) {
      fulfillmentStatusChanged = true;
      order.fulfillmentStatus = fulfillmentStatus;
    }

    if (order.financialStatus === "pending") {
      const tagsList = (order.tags || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      let tagsUpdated = false;
      if (!tagsList.includes("Draft")) {
        tagsList.push("Draft");
        tagsUpdated = true;
      }
      if (!tagsList.some((tag) => tag.startsWith("DraftNumber:"))) {
        const { Op } = require("sequelize");
        const draftCount = await Order.count({
          where: { shopId: shop.id, tags: { [Op.like]: "%Draft%" } },
        });
        tagsList.push(`DraftNumber:${draftCount + 1}`);
        tagsUpdated = true;
      }
      if (tagsUpdated) order.tags = tagsList.join(", ");
    }

    if (financialStatus === "paid" && order.financialStatus !== "paid") {
      order.financialStatus = await markOrderAsPaid(shop, order);
    } else if (financialStatus !== undefined) {
      order.financialStatus = financialStatus;
    }

    if (fulfillmentStatusChanged) {
      if (fulfillmentStatus === "fulfilled") {
        await fulfillOrderOnShopify(shop, order);
      } else if (fulfillmentStatus === "on hold") {
        await holdOrderOnShopify(shop, order, req.body.holdReason);
      } else if (
        fulfillmentStatus === "unfulfilled" &&
        oldFulfillmentStatus === "on hold"
      ) {
        await releaseOrderHoldOnShopify(shop, order);
      }
    }

    await order.save();

    if (customerChanged) {
      const getCustName = async (id) => {
        if (!id) return "";
        const cust = await Customer.findByPk(id);
        return cust
          ? cust.displayName ||
              `${cust.firstName || ""} ${cust.lastName || ""}`.trim() ||
              cust.email ||
              ""
          : "";
      };
      const oldCustName = await getCustName(oldCustomerId);
      const newCustName = await getCustName(order.customerId);

      const bodyText =
        oldCustName && newCustName
          ? `Customer was changed from ${oldCustName} to ${newCustName}.`
          : newCustName
          ? `Customer was set to ${newCustName}.`
          : oldCustName
          ? `Customer ${oldCustName} was removed from this order.`
          : "Customer details updated.";

      try {
        await Comment.create({
          shopId: shop.id,
          orderId: order.id,
          authorName: shop.shopOwner || shop.name || "Staff",
          body: bodyText,
        });
      } catch (err) {
        console.error("Failed to write customer update comment:", err.message);
      }
    }

    try {
      await getRestClient(shop).put({
        path: `orders/${order.shopifyId}`,
        type: "application/json",
        data: {
          order: {
            id: Number(order.shopifyId),
            note: order.note,
            tags: order.tags,
          },
        },
      });
    } catch (err) {
      console.warn("Failed to sync order update to Shopify:", err.message);
    }

    const detail = await toOrderDetail(order);
    successResponse(res, 200, "Order updated successfully", detail);
  } catch (error) {
    console.error("Error updating order:", error.message);
    handleError(res, error, "Failed to update order");
  }
};

module.exports = {
  listOrders,
  getOrder,
  createOrder,
  cancelOrder,
  listComments,
  createComment,
  deleteComment,
  updateOrder,
  listPaymentTerms,
};
