const { successResponse, errorResponse } = require("../../utils/response");
const {
  resolveShopForApi,
  isShopifyUnauthorized,
} = require("../../utils/shopAccess");
const Customer = require("../customer/model");
const companyService = require("./companyService");

const getShopRecord = async (req) =>
  resolveShopForApi(req.shopDomain, req.sessionToken);

const handleError = (res, error, fallback) => {
  if (isShopifyUnauthorized(error)) {
    return errorResponse(
      res,
      401,
      "Shopify session expired or B2B access not granted. Reload the app and ensure the store has B2B (Companies) enabled.",
      error
    );
  }
  const status = error.statusCode || 500;
  return errorResponse(res, status, error.message || fallback, error);
};

const resolveCustomer = async (shop, rawId) => {
  const id = parseInt(rawId, 10);
  if (!Number.isInteger(id) || id < 1) {
    return { error: [400, "Invalid customer id"] };
  }
  const customer = await Customer.findOne({ where: { id, shopId: shop.id } });
  if (!customer) {
    return { error: [404, "Customer not found"] };
  }
  return { customer };
};

const searchCompanies = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const companies = await companyService.searchCompanies(shop, req.query.q);
    successResponse(res, 200, "Companies fetched successfully", { companies });
  } catch (error) {
    console.error("Error searching companies:", error.message);
    handleError(res, error, "Failed to search companies");
  }
};

const createCompany = async (req, res) => {
  try {
    const name = String(req.body?.name ?? "").trim();
    if (!name) return errorResponse(res, 400, "Company name is required");

    const shop = await getShopRecord(req);
    const company = await companyService.createCompany(shop, { name });
    successResponse(res, 201, "Company created successfully", { company });
  } catch (error) {
    console.error("Error creating company:", error.message);
    handleError(res, error, "Failed to create company");
  }
};

const assignCustomerToCompany = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const { customer, error } = await resolveCustomer(
      shop,
      req.body?.customerId
    );
    if (error) return errorResponse(res, ...error);

    let companyId = req.body?.companyId || null;
    const newName = String(req.body?.companyName ?? "").trim();

    // Create-and-assign in one step when the modal supplies a new company name.
    if (!companyId && newName) {
      const created = await companyService.createCompany(shop, {
        name: newName,
      });
      companyId = created.id;
    }

    if (!companyId) {
      return errorResponse(
        res,
        400,
        "Select an existing company or enter a name"
      );
    }

    const company = await companyService.assignCustomerToCompany(
      shop,
      companyId,
      customer.shopifyId
    );
    successResponse(res, 200, "Customer added to company", { company });
  } catch (error) {
    console.error("Error assigning customer to company:", error.message);
    handleError(res, error, "Failed to add customer to company");
  }
};

const getCustomerCompany = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const { customer, error } = await resolveCustomer(
      shop,
      req.params.customerId
    );
    if (error) return errorResponse(res, ...error);

    const company = await companyService.getCustomerCompany(
      shop,
      customer.shopifyId
    );
    successResponse(res, 200, "Company fetched successfully", { company });
  } catch (error) {
    console.error("Error fetching customer company:", error.message);
    handleError(res, error, "Failed to load company");
  }
};

const removeCustomerFromCompany = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const { customer, error } = await resolveCustomer(
      shop,
      req.params.customerId
    );
    if (error) return errorResponse(res, ...error);

    await companyService.removeCustomerFromCompany(shop, customer.shopifyId);
    successResponse(res, 200, "Customer removed from company", {
      company: null,
    });
  } catch (error) {
    console.error("Error removing customer from company:", error.message);
    handleError(res, error, "Failed to remove customer from company");
  }
};

const listCompanies = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const companies = await companyService.listCompanies(shop);
    successResponse(res, 200, "Companies fetched successfully", { companies });
  } catch (error) {
    console.error("Error listing companies:", error.message);
    handleError(res, error, "Failed to list companies");
  }
};

const getCompanyDetails = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const company = await companyService.getCompanyDetails(shop, req.params.id);
    successResponse(res, 200, "Company details fetched successfully", {
      company,
    });
  } catch (error) {
    console.error("Error fetching company details:", error.message);
    handleError(res, error, "Failed to load company details");
  }
};

const assignRoles = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const { companyContactId, rolesToAssign } = req.body;
    if (!companyContactId || !Array.isArray(rolesToAssign)) {
      return errorResponse(
        res,
        400,
        "companyContactId and rolesToAssign array are required"
      );
    }

    const assignments = await companyService.assignContactRoles(
      shop,
      companyContactId,
      rolesToAssign
    );
    successResponse(res, 200, "Roles assigned successfully", { assignments });
  } catch (error) {
    console.error("Error assigning roles:", error.message);
    handleError(res, error, "Failed to assign roles");
  }
};

const revokeRoles = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const { companyContactId, roleAssignmentIds } = req.body;
    if (!companyContactId || !Array.isArray(roleAssignmentIds)) {
      return errorResponse(
        res,
        400,
        "companyContactId and roleAssignmentIds array are required"
      );
    }

    const revokedIds = await companyService.revokeContactRoles(
      shop,
      companyContactId,
      roleAssignmentIds
    );
    successResponse(res, 200, "Roles revoked successfully", { revokedIds });
  } catch (error) {
    console.error("Error revoking roles:", error.message);
    handleError(res, error, "Failed to revoke roles");
  }
};

const updateCompany = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const { name, externalId } = req.body || {};
    if (typeof name === "string" && !name.trim()) {
      return errorResponse(res, 400, "Company name cannot be empty");
    }
    const company = await companyService.updateCompany(shop, req.params.id, {
      name,
      externalId,
    });
    successResponse(res, 200, "Company updated successfully", { company });
  } catch (error) {
    console.error("Error updating company:", error.message);
    handleError(res, error, "Failed to update company");
  }
};

const setMainContact = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const { companyContactId } = req.body || {};
    const company = companyContactId
      ? await companyService.assignMainContact(
          shop,
          req.params.id,
          companyContactId
        )
      : await companyService.revokeMainContact(shop, req.params.id);
    successResponse(res, 200, "Main contact updated", { company });
  } catch (error) {
    console.error("Error updating main contact:", error.message);
    handleError(res, error, "Failed to update main contact");
  }
};

const addContactToCompany = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const { companyId, customerId } = req.body || {};
    if (!companyId || !customerId) {
      return errorResponse(res, 400, "companyId and customerId are required");
    }
    const company = await companyService.assignCustomerToCompany(
      shop,
      companyId,
      customerId
    );
    successResponse(res, 200, "Customer added to company", { company });
  } catch (error) {
    console.error("Error adding customer to company:", error.message);
    handleError(res, error, "Failed to add customer to company");
  }
};

const removeContact = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const { companyContactId } = req.body || {};
    if (!companyContactId) {
      return errorResponse(res, 400, "companyContactId is required");
    }
    const removedId = await companyService.removeContact(shop, companyContactId);
    successResponse(res, 200, "Customer removed from company", { removedId });
  } catch (error) {
    console.error("Error removing contact:", error.message);
    handleError(res, error, "Failed to remove customer from company");
  }
};

const listEligibleCustomers = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const customers = await companyService.listCustomersForCompany(
      shop,
      req.query.q
    );
    successResponse(res, 200, "Customers fetched successfully", { customers });
  } catch (error) {
    console.error("Error listing customers:", error.message);
    handleError(res, error, "Failed to list customers");
  }
};

const listStaff = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const staff = await companyService.listStaffMembers(shop);
    successResponse(res, 200, "Staff fetched successfully", { staff });
  } catch (error) {
    console.error("Error listing staff:", error.message);
    handleError(res, error, "Failed to list staff members");
  }
};

const updateAssignedStaff = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const { staffMemberIds } = req.body || {};
    if (!Array.isArray(staffMemberIds)) {
      return errorResponse(res, 400, "staffMemberIds array is required");
    }
    const company = await companyService.updateAssignedStaff(
      shop,
      req.params.id,
      staffMemberIds
    );
    successResponse(res, 200, "Assigned staff updated", { company });
  } catch (error) {
    console.error("Error updating assigned staff:", error.message);
    handleError(res, error, "Failed to update assigned staff");
  }
};

const sendAccessEmail = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const { customerId } = req.body || {};
    if (!customerId) {
      return errorResponse(res, 400, "customerId is required");
    }
    await companyService.sendB2bAccessEmail(shop, customerId);
    successResponse(res, 200, "B2B access email sent", { sent: true });
  } catch (error) {
    console.error("Error sending B2B access email:", error.message);
    handleError(res, error, "Failed to send B2B access email");
  }
};

const bulkDeleteCompanies = async (req, res) => {
  try {
    const shop = await getShopRecord(req);
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || !ids.length) {
      return errorResponse(res, 400, "ids array is required");
    }
    const deletedIds = await companyService.bulkDeleteCompanies(shop, ids);
    successResponse(res, 200, "Companies deleted successfully", { deletedIds });
  } catch (error) {
    console.error("Error deleting companies:", error.message);
    handleError(res, error, "Failed to delete companies");
  }
};

module.exports = {
  searchCompanies,
  createCompany,
  assignCustomerToCompany,
  getCustomerCompany,
  removeCustomerFromCompany,
  listCompanies,
  getCompanyDetails,
  assignRoles,
  revokeRoles,
  updateCompany,
  setMainContact,
  addContactToCompany,
  removeContact,
  listEligibleCustomers,
  listStaff,
  updateAssignedStaff,
  sendAccessEmail,
  bulkDeleteCompanies,
};
