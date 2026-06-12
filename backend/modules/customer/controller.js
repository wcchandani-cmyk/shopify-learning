const { successResponse, errorResponse } = require("../../utils/response");
const {
  resolveShopForApi,
  isShopifyUnauthorized,
} = require("../../utils/shopAccess");
const Customer = require("./model");
const Comment = require("../comment/model");
const {
  toCustomerDTO,
  toCustomerDetail,
  createCustomer: createCustomerFlow,
  updateCustomer: updateCustomerFlow,
  deleteCustomers: deleteCustomersFlow,
} = require("./customerService");

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

const getShopRecord = async (req) =>
  resolveShopForApi(req.shopDomain, req.sessionToken);

const parsePageSize = (value) =>
  Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(value, 10) || DEFAULT_PAGE_SIZE)
  );

const handleError = (res, error, fallback) => {
  if (isShopifyUnauthorized(error)) {
    return errorResponse(
      res,
      401,
      "Shopify session expired or customer access not granted. Reload the app and ensure Protected Customer Data Access is approved.",
      error
    );
  }
  const status = error.statusCode || 500;
  return errorResponse(res, status, error.message || fallback, error);
};

const resolveShopCustomer = async (req) => {
  const shop = await getShopRecord(req);
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) {
    return { error: [400, "Invalid customer id"] };
  }
  const customer = await Customer.findOne({ where: { id, shopId: shop.id } });
  if (!customer) {
    return { error: [404, "Customer not found"] };
  }
  return { shop, customer };
};

const toCommentDTO = (row) => ({
  id: row.id,
  body: row.body,
  authorName: row.authorName || "Staff",
  createdAt: row.createdAt || null,
});

const listCustomers = async (req, res) => {
  try {
    const shop = await getShopRecord(req);

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = parsePageSize(req.query.limit);
    const offset = (page - 1) * limit;

    const { count: total, rows } = await Customer.findAndCountAll({
      where: { shopId: shop.id },
      order: [["shopifyUpdatedAt", "DESC"]],
      limit,
      offset,
    });

    const customers = rows.map(toCustomerDTO);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    successResponse(res, 200, "Customers fetched successfully", {
      returnedCount: customers.length,
      customers,
      count: total,
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
    console.error("Error listing customers:", error.message);
    handleError(res, error, "Failed to list customers");
  }
};

const listCustomerTags = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const rows = await Customer.findAll({
      where: { shopId: shop.id },
      attributes: ["tags"],
      raw: true,
    });

    const seen = new Set();
    rows.forEach((row) => {
      String(row.tags || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .forEach((tag) => seen.add(tag));
    });

    const tags = Array.from(seen).sort((a, b) => a.localeCompare(b));
    successResponse(res, 200, "Tags fetched successfully", { tags });
  } catch (error) {
    console.error("Error listing customer tags:", error.message);
    handleError(res, error, "Failed to list tags");
  }
};

const getCustomer = async (req, res) => {
  try {
    const { customer, error } = await resolveShopCustomer(req);
    if (error) return errorResponse(res, ...error);

    successResponse(
      res,
      200,
      "Customer fetched successfully",
      toCustomerDetail(customer)
    );
  } catch (error) {
    console.error("Error fetching customer:", error.message);
    handleError(res, error, "Failed to fetch customer");
  }
};

const createCustomer = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const created = await createCustomerFlow(shop, req.body);
    successResponse(res, 201, "Customer created successfully", created);
  } catch (error) {
    console.error("Error creating customer:", error.message);
    handleError(res, error, "Failed to create customer");
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { shop, customer, error } = await resolveShopCustomer(req);
    if (error) return errorResponse(res, ...error);

    const updated = await updateCustomerFlow(shop, customer, req.body);
    successResponse(res, 200, "Customer updated successfully", updated);
  } catch (error) {
    console.error("Error updating customer:", error.message);
    handleError(res, error, "Failed to update customer");
  }
};

const deleteCustomers = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const result = await deleteCustomersFlow(shop, ids);
    successResponse(res, 200, "Customers deleted successfully", result);
  } catch (error) {
    console.error("Error deleting customers:", error.message);
    handleError(res, error, "Failed to delete customers");
  }
};

const listComments = async (req, res) => {
  try {
    const { shop, customer, error } = await resolveShopCustomer(req);
    if (error) return errorResponse(res, ...error);

    const comments = await Comment.findAll({
      where: { shopId: shop.id, customerId: customer.id },
      order: [["createdAt", "DESC"]],
    });

    successResponse(res, 200, "Comments fetched successfully", {
      comments: comments.map(toCommentDTO),
    });
  } catch (error) {
    console.error("Error listing comments:", error.message);
    handleError(res, error, "Failed to load comments");
  }
};

const createComment = async (req, res) => {
  try {
    const { shop, customer, error } = await resolveShopCustomer(req);
    if (error) return errorResponse(res, ...error);

    const body = String(req.body?.body ?? "").trim();
    if (!body) return errorResponse(res, 400, "Comment can't be empty");

    const comment = await Comment.create({
      shopId: shop.id,
      customerId: customer.id,
      authorName: shop.shopOwner || shop.name || "Staff",
      body,
    });

    successResponse(res, 201, "Comment added", toCommentDTO(comment));
  } catch (error) {
    console.error("Error creating comment:", error.message);
    handleError(res, error, "Failed to add comment");
  }
};

const deleteComment = async (req, res) => {
  try {
    const { shop, customer, error } = await resolveShopCustomer(req);
    if (error) return errorResponse(res, ...error);

    const commentId = parseInt(req.params.commentId, 10);
    if (!Number.isInteger(commentId) || commentId < 1) {
      return errorResponse(res, 400, "Invalid comment id");
    }

    const deleted = await Comment.destroy({
      where: { id: commentId, shopId: shop.id, customerId: customer.id },
    });
    if (!deleted) return errorResponse(res, 404, "Comment not found");

    successResponse(res, 200, "Comment deleted", { id: commentId });
  } catch (error) {
    console.error("Error deleting comment:", error.message);
    handleError(res, error, "Failed to delete comment");
  }
};

module.exports = {
  listCustomers,
  listCustomerTags,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomers,
  listComments,
  createComment,
  deleteComment,
};
