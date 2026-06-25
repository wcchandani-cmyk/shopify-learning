const { fn, col } = require("sequelize");
const { successResponse, errorResponse } = require("../../utils/response");
const Customer = require("./model");
const { parsePageSize, handleError } = require("../../utils/controllerHelper");
const Order = require("../order/model");
const { createCommentHandlers } = require("../comment/controller");
const {
  toCustomerDTO,
  toCustomerDetail,
  createCustomer: createCustomerFlow,
  updateCustomer: updateCustomerFlow,
  deleteCustomers: deleteCustomersFlow,
} = require("./customerService");

const CUSTOMER_UNAUTH_MSG =
  "Shopify session expired or customer access not granted. Reload the app and ensure Protected Customer Data Access is approved.";

const resolveShopCustomer = async (req) => {
  const shop = req.shop;
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1)
    return { error: [400, "Invalid customer id"] };

  const customer = await Customer.findOne({ where: { id, shopId: shop.id } });
  return customer ? { shop, customer } : { error: [404, "Customer not found"] };
};

const listCustomers = async (req, res) => {
  try {
    const shop = req.shop;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = parsePageSize(req.query.limit);
    const offset = (page - 1) * limit;

    const { count: total, rows } = await Customer.findAndCountAll({
      where: { shopId: shop.id },
      order: [["shopifyUpdatedAt", "DESC"]],
      limit,
      offset,
    });

    const customerIds = rows.map((row) => row.id);
    const localCounts = customerIds.length
      ? await Order.findAll({
          attributes: ["customerId", [fn("COUNT", col("id")), "count"]],
          where: { shopId: shop.id, customerId: customerIds },
          group: ["customerId"],
          raw: true,
        })
      : [];
    const localCountMap = new Map(
      localCounts.map((entry) => [entry.customerId, Number(entry.count)])
    );

    const customers = rows.map((row) => {
      const dto = toCustomerDTO(row);
      dto.ordersCount = Math.max(
        dto.ordersCount,
        localCountMap.get(row.id) || 0
      );
      return dto;
    });
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
    handleError(res, error, "Failed to list customers", CUSTOMER_UNAUTH_MSG);
  }
};

const listCustomerTags = async (req, res) => {
  try {
    const rows = await Customer.findAll({
      where: { shopId: req.shop.id },
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

    successResponse(res, 200, "Tags fetched successfully", {
      tags: Array.from(seen).sort((a, b) => a.localeCompare(b)),
    });
  } catch (error) {
    console.error("Error listing customer tags:", error.message);
    handleError(res, error, "Failed to list tags", CUSTOMER_UNAUTH_MSG);
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
    handleError(res, error, "Failed to fetch customer", CUSTOMER_UNAUTH_MSG);
  }
};

const createCustomer = async (req, res) => {
  try {
    const created = await createCustomerFlow(req.shop, req.body);
    successResponse(res, 201, "Customer created successfully", created);
  } catch (error) {
    console.error("Error creating customer:", error.message);
    handleError(res, error, "Failed to create customer", CUSTOMER_UNAUTH_MSG);
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
    handleError(res, error, "Failed to update customer", CUSTOMER_UNAUTH_MSG);
  }
};

const deleteCustomers = async (req, res) => {
  try {
    const result = await deleteCustomersFlow(req.shop, req.body?.ids || []);
    successResponse(res, 200, "Customers deleted successfully", result);
  } catch (error) {
    console.error("Error deleting customers:", error.message);
    handleError(res, error, "Failed to delete customers", CUSTOMER_UNAUTH_MSG);
  }
};

const { listComments, createComment, deleteComment } = createCommentHandlers({
  resolveParent: async (req) => {
    const { shop, customer, error } = await resolveShopCustomer(req);
    return { shop, parent: customer, error };
  },
  foreignKey: "customerId",
  entityName: "customer",
});

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
