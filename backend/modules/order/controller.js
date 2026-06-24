const { successResponse, errorResponse } = require("../../utils/response");
const { getRestClient } = require("../../utils/shopify");
const { parsePageSize, handleError } = require("../../utils/controllerHelper");
const Order = require("./model");
const Customer = require("../customer/model");
const Comment = require("../comment/model");
const { toCommentDTO, createCommentHandlers } = require("../comment/controller");
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

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

const resolveShopOrder = async (req) => {
  const shop = req.shop;
  const raw = String(req.params.id ?? "").trim();
  if (!/^\d+$/.test(raw)) {
    return { error: [400, "Invalid order id"] };
  }
  let order = await Order.findOne({
    where: { shopifyId: raw, shopId: shop.id },
  });
  if (!order) {
    order = await Order.findOne({ where: { id: raw, shopId: shop.id } });
  }
  if (!order) {
    return { error: [404, "Order not found"] };
  }
  return { shop, order };
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
      where: {
        shopId: shop.id,
        tags: { [Op.like]: "%Draft%" },
      },
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
    const shop = req.shop;
    const created = await createOrderFlow(shop, req.body);
    successResponse(res, 201, "Order created successfully", created);
  } catch (error) {
    console.error("Error creating order:", error.message);
    handleError(res, error, "Failed to create order");
  }
};

const listPaymentTerms = async (req, res) => {
  try {
    const shop = req.shop;
    const paymentTerms = await getPaymentTermsTemplates(shop);
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

const { createComment, deleteComment } = createCommentHandlers({
  resolveParent: async (req) => {
    const { shop, order, error } = await resolveShopOrder(req);
    return { shop, parent: order, error };
  },
  foreignKey: "orderId",
  entityName: "order",
});

const listComments = async (req, res) => {
  try {
    const { shop, order, error } = await resolveShopOrder(req);
    if (error) return errorResponse(res, ...error);

    const localComments = await Comment.findAll({
      where: { shopId: shop.id, orderId: order.id },
      order: [["createdAt", "DESC"]],
    });

    const commentsList = localComments.map(toCommentDTO);

    let shopifyEvents = [];
    try {
      const { getGraphQLClient } = require("../../utils/shopify");
      const { graphqlClient } = getGraphQLClient({
        shopDomain: shop.myshopifyDomain,
        accessToken: shop.token,
      });

      const { ORDER_EVENTS_QUERY } = require("./query");
      const orderGid = `gid://shopify/Order/${order.shopifyId}`;

      const resp = await graphqlClient.request(ORDER_EVENTS_QUERY, {
        variables: { id: orderGid },
      });

      const nodes = resp?.data?.order?.events?.nodes || [];
      shopifyEvents = nodes.map((evt) => ({
        id: evt.id,
        body: evt.message,
        authorName: "Shopify",
        createdAt: evt.createdAt,
        isSystemEvent: true,
      }));
    } catch (err) {
      console.warn("Failed to fetch order events from Shopify:", err.message);
    }

    const merged = [...commentsList, ...shopifyEvents].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA;
    });

    successResponse(res, 200, "Comments fetched successfully", {
      comments: merged,
    });
  } catch (err) {
    console.error("Error listing order timeline:", err.message);
    const status = err.statusCode || 500;
    errorResponse(res, status, err.message || "Failed to load timeline", err);
  }
};

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
        .map((t) => t.trim())
        .filter(Boolean);
      const incomingTags = (tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (existingTags.includes("Draft")) {
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
      }
      order.tags = incomingTags.join(", ");
    }
    let customerChanged = false;
    let oldCustomerId = order.customerId;
    if (customerId !== undefined && customerId !== oldCustomerId) {
      customerChanged = true;
      order.customerId = customerId || null;
    }

    let fulfillmentStatusChanged = false;
    let oldFulfillmentStatus = order.fulfillmentStatus;
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
        .map((t) => t.trim())
        .filter(Boolean);
      let tagsUpdated = false;
      if (!tagsList.includes("Draft")) {
        tagsList.push("Draft");
        tagsUpdated = true;
      }
      if (!tagsList.some((t) => t.startsWith("DraftNumber:"))) {
        const { Op } = require("sequelize");
        const draftCount = await Order.count({
          where: {
            shopId: shop.id,
            tags: { [Op.like]: "%Draft%" },
          },
        });
        tagsList.push(`DraftNumber:${draftCount + 1}`);
        tagsUpdated = true;
      }
      if (tagsUpdated) {
        order.tags = tagsList.join(", ");
      }
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
      let oldCustName = "";
      if (oldCustomerId) {
        const oldCust = await Customer.findByPk(oldCustomerId);
        if (oldCust) {
          oldCustName =
            oldCust.displayName ||
            `${oldCust.firstName || ""} ${oldCust.lastName || ""}`.trim() ||
            oldCust.email ||
            "";
        }
      }

      let newCustName = "";
      if (order.customerId) {
        const newCust = await Customer.findByPk(order.customerId);
        if (newCust) {
          newCustName =
            newCust.displayName ||
            `${newCust.firstName || ""} ${newCust.lastName || ""}`.trim() ||
            newCust.email ||
            "";
        }
      }

      let bodyText = "";
      if (oldCustName && newCustName) {
        bodyText = `Customer was changed from ${oldCustName} to ${newCustName}.`;
      } else if (newCustName) {
        bodyText = `Customer was set to ${newCustName}.`;
      } else if (oldCustName) {
        bodyText = `Customer ${oldCustName} was removed from this order.`;
      } else {
        bodyText = "Customer details updated.";
      }

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
      const client = getRestClient(shop);
      await client.put({
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
