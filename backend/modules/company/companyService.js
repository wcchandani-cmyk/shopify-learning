const { getGraphQLClient } = require("../../utils/shopify");
const {
  COMPANIES_QUERY,
  COMPANIES_QUERY_FULL,
  COMPANY_CREATE,
  COMPANY_ASSIGN_CONTACT,
  CUSTOMER_COMPANY_QUERY,
  COMPANY_CONTACT_REMOVE,
  COMPANY_DETAIL_QUERY,
  COMPANY_CONTACT_ASSIGN_ROLES,
  COMPANY_CONTACT_REVOKE_ROLES,
  COMPANY_UPDATE,
  COMPANY_ASSIGN_MAIN_CONTACT,
  COMPANY_REVOKE_MAIN_CONTACT,
  CUSTOMERS_FOR_COMPANY_QUERY,
  STAFF_MEMBERS_QUERY,
  COMPANY_LOCATION_ASSIGN_STAFF,
  COMPANY_LOCATION_REMOVE_STAFF,
  CUSTOMER_SEND_INVITE,
  COMPANIES_DELETE,
} = require("./query");

const clientFor = (shop) =>
  getGraphQLClient({
    shopDomain: shop.myshopifyDomain,
    accessToken: shop.token,
  }).graphqlClient;

// Accepts a numeric id or a full GID and always returns the GID Shopify expects.
const toGid = (resource, value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  return raw.startsWith("gid://") ? raw : `gid://shopify/${resource}/${raw}`;
};

const toCompanyDTO = (node) =>
  node?.id ? { id: node.id, name: node.name || "Untitled company" } : null;

const throwUserErrors = (errors, fallback) => {
  if (Array.isArray(errors) && errors.length) {
    const err = new Error(errors.map((errItem) => errItem.message).join("; ") || fallback);
    err.statusCode = 422;
    throw err;
  }
};

const searchCompanies = async (shop, query) => {
  const client = clientFor(shop);
  const response = await client.request(COMPANIES_QUERY, {
    variables: { first: 20, query: query ? query.trim() : null },
  });

  return (response.data?.companies?.edges || [])
    .map((edge) => toCompanyDTO(edge.node))
    .filter(Boolean);
};

const createCompany = async (shop, { name }) => {
  const client = clientFor(shop);
  const response = await client.request(COMPANY_CREATE, {
    variables: { input: { company: { name } } },
  });

  const payload = response.data?.companyCreate;
  throwUserErrors(payload?.userErrors, "Failed to create company");

  const company = toCompanyDTO(payload?.company);
  if (!company) throw new Error("Shopify did not return the created company");
  return company;
};

const assignCustomerToCompany = async (shop, companyId, customerShopifyId) => {
  const client = clientFor(shop);
  const response = await client.request(COMPANY_ASSIGN_CONTACT, {
    variables: {
      companyId: toGid("Company", companyId),
      customerId: toGid("Customer", customerShopifyId),
    },
  });

  const payload = response.data?.companyAssignCustomerAsContact;
  throwUserErrors(payload?.userErrors, "Failed to add customer to company");

  return toCompanyDTO(payload?.companyContact?.company);
};

const getCustomerCompany = async (shop, customerShopifyId) => {
  const client = clientFor(shop);
  const response = await client.request(CUSTOMER_COMPANY_QUERY, {
    variables: { id: toGid("Customer", customerShopifyId) },
  });

  const profiles = response.data?.customer?.companyContactProfiles || [];
  return toCompanyDTO(profiles[0]?.company);
};

// Removes only this customer's link to its company (the company itself stays).
const removeCustomerFromCompany = async (shop, customerShopifyId) => {
  const client = clientFor(shop);
  const lookup = await client.request(CUSTOMER_COMPANY_QUERY, {
    variables: { id: toGid("Customer", customerShopifyId) },
  });

  const profiles = lookup.data?.customer?.companyContactProfiles || [];
  const contactId = profiles[0]?.id;
  if (!contactId) return null;

  const response = await client.request(COMPANY_CONTACT_REMOVE, {
    variables: { companyContactId: contactId },
  });

  const payload = response.data?.companyContactRemoveFromCompany;
  throwUserErrors(
    payload?.userErrors,
    "Failed to remove customer from company"
  );

  return payload?.removedCompanyContactId || contactId;
};

const listCompanies = async (shop) => {
  const client = clientFor(shop);
  const response = await client.request(COMPANIES_QUERY_FULL, {
    variables: { first: 50 },
  });

  return (response.data?.companies?.edges || [])
    .map((edge) => {
      const node = edge.node;
      if (!node) return null;

      const locationsCount = node.locations?.edges?.length || 0;
      const contacts = node.contacts?.edges || [];

      // Look for the main contact profile.
      const mainContactEdge = contacts.find((edge) => edge.node?.isMainContact);
      const mainContactName = mainContactEdge
        ? mainContactEdge.node.customer?.displayName
        : null;

      const totalOrders = node.orders?.edges?.length || 0;
      const totalSpentAmount = parseFloat(node.totalSpent?.amount || "0");
      const currencyCode = node.totalSpent?.currencyCode || "USD";

      return {
        id: node.id,
        name: node.name || "Untitled company",
        ordering: mainContactName ? "Approved" : "Not approved",
        locationsCount,
        mainContact: mainContactName || "No main contact",
        totalOrders,
        totalSales: totalSpentAmount,
        currencyCode,
      };
    })
    .filter(Boolean);
};

const getCompanyDetails = async (shop, companyId) => {
  const client = clientFor(shop);
  const response = await client.request(COMPANY_DETAIL_QUERY, {
    variables: { id: toGid("Company", companyId) },
  });

  const node = response.data?.company;
  if (!node) {
    throw new Error("Company not found");
  }

  // Map locations
  const locations = (node.locations?.edges || [])
    .map((edge) => {
      const loc = edge.node;
      if (!loc) return null;

      const paymentTerms =
        loc.paymentTerms?.name ||
        loc.buyerExperienceConfiguration?.paymentTermsTemplate?.name ||
        "None";
      const checkoutToDraft =
        loc.buyerExperienceConfiguration?.checkoutToDraft ?? false;

      // Check customizations
      const checkoutOption = checkoutToDraft
        ? "Draft orders only"
        : "Automatically submit orders";
      const editableShipping = loc.buyerExperienceConfiguration
        ?.editableShippingAddress
        ? "Ship to location address"
        : "Cannot edit shipping address";

      const catalogs = (loc.catalogs?.edges || []).map((cEdge) => ({
        id: cEdge.node.id,
        title: cEdge.node.title,
      }));

      const marketName = loc.shippingAddress?.country || "United States";

      const staffAssignments = (loc.staffMemberAssignments?.edges || []).map(
        (sEdge) => ({
          assignmentId: sEdge.node.id,
          staffMemberId: sEdge.node.staffMember?.id,
          name: sEdge.node.staffMember?.name,
          email: sEdge.node.staffMember?.email,
        })
      );

      return {
        id: loc.id,
        name: loc.name,
        shippingAddress: loc.shippingAddress,
        billingAddress: loc.billingAddress,
        taxRegistrationId: loc.taxRegistrationId,
        paymentTerms,
        checkoutOption,
        editableShipping,
        catalogs,
        marketName,
        marketsCount: 1,
        sales: 0.0,
        orders: 0,
        staffAssignments,
      };
    })
    .filter(Boolean);

  const assignedStaffMap = new Map();
  locations.forEach((loc) => {
    (loc.staffAssignments || []).forEach((assignment) => {
      if (!assignment.staffMemberId) return;
      const existing = assignedStaffMap.get(assignment.staffMemberId) || {
        staffMemberId: assignment.staffMemberId,
        name: assignment.name,
        email: assignment.email,
        assignmentIds: [],
        locationIds: [],
      };
      existing.assignmentIds.push(assignment.assignmentId);
      existing.locationIds.push(loc.id);
      assignedStaffMap.set(assignment.staffMemberId, existing);
    });
  });
  const assignedStaff = Array.from(assignedStaffMap.values());

  // Map contacts
  const contacts = (node.contacts?.edges || [])
    .map((edge) => {
      const contact = edge.node;
      if (!contact) return null;

      const roleAssignments = (contact.roleAssignments?.edges || []).map(
        (rEdge) => ({
          id: rEdge.node.id,
          roleId: rEdge.node.role?.id,
          roleName: rEdge.node.role?.name,
          locationId: rEdge.node.companyLocation?.id,
          locationName: rEdge.node.companyLocation?.name,
        })
      );

      return {
        id: contact.id,
        isMainContact: contact.isMainContact,
        customer: contact.customer,
        roleAssignments,
      };
    })
    .filter(Boolean);

  // Check if ordering is approved (at least one contact has roles assigned)
  const isApproved = contacts.some((contact) => contact.roleAssignments.length > 0);

  // Map contact roles
  const contactRoles = node.contactRoles?.nodes || [];

  return {
    id: node.id,
    name: node.name || "Untitled company",
    externalId: node.externalId || "",
    createdAt: node.createdAt,
    totalSpent: node.totalSpent,
    ordering: isApproved ? "Approved" : "Not approved",
    mainContactId: node.mainContact?.id || null,
    mainContactCustomerId: node.mainContact?.customer?.id || null,
    locations,
    contacts,
    contactRoles,
    assignedStaff,
  };
};

const updateCompany = async (shop, companyId, { name, externalId }) => {
  const client = clientFor(shop);
  const input = {};
  if (typeof name === "string") input.name = name.trim();
  // Allow clearing the external id by sending an empty string.
  if (typeof externalId === "string") input.externalId = externalId.trim();

  const response = await client.request(COMPANY_UPDATE, {
    variables: { companyId: toGid("Company", companyId), input },
  });

  const payload = response.data?.companyUpdate;
  throwUserErrors(payload?.userErrors, "Failed to update company");
  return payload?.company || null;
};

const assignMainContact = async (shop, companyId, companyContactId) => {
  const client = clientFor(shop);
  const response = await client.request(COMPANY_ASSIGN_MAIN_CONTACT, {
    variables: {
      companyId: toGid("Company", companyId),
      companyContactId: toGid("CompanyContact", companyContactId),
    },
  });

  const payload = response.data?.companyAssignMainContact;
  throwUserErrors(payload?.userErrors, "Failed to assign main contact");
  return payload?.company || null;
};

const revokeMainContact = async (shop, companyId) => {
  const client = clientFor(shop);
  const response = await client.request(COMPANY_REVOKE_MAIN_CONTACT, {
    variables: { companyId: toGid("Company", companyId) },
  });

  const payload = response.data?.companyRevokeMainContact;
  throwUserErrors(payload?.userErrors, "Failed to remove main contact");
  return payload?.company || null;
};

const removeContact = async (shop, companyContactId) => {
  const client = clientFor(shop);
  const response = await client.request(COMPANY_CONTACT_REMOVE, {
    variables: { companyContactId: toGid("CompanyContact", companyContactId) },
  });

  const payload = response.data?.companyContactRemoveFromCompany;
  throwUserErrors(
    payload?.userErrors,
    "Failed to remove customer from company"
  );
  return payload?.removedCompanyContactId || companyContactId;
};

const listCustomersForCompany = async (shop, query) => {
  const client = clientFor(shop);
  const response = await client.request(CUSTOMERS_FOR_COMPANY_QUERY, {
    variables: { first: 50, query: query ? query.trim() : null },
  });

  return (response.data?.customers?.edges || [])
    .map((edge) => {
      const customer = edge.node;
      if (!customer) return null;
      const profile = customer.companyContactProfiles?.[0] || null;
      return {
        id: customer.id,
        displayName: customer.displayName || customer.email || "Customer",
        email: customer.email || "",
        companyId: profile?.company?.id || null,
        companyName: profile?.company?.name || null,
      };
    })
    .filter(Boolean);
};

const listStaffMembers = async (shop) => {
  const client = clientFor(shop);
  const response = await client.request(STAFF_MEMBERS_QUERY, {
    variables: { first: 50 },
  });

  return (response.data?.shop?.staffMembers?.edges || [])
    .map((edge) => {
      const staff = edge.node;
      if (!staff) return null;
      return {
        id: staff.id,
        name: staff.name || staff.email || "Staff member",
        email: staff.email || "",
      };
    })
    .filter(Boolean);
};

const sendB2bAccessEmail = async (shop, customerId) => {
  const client = clientFor(shop);
  const response = await client.request(CUSTOMER_SEND_INVITE, {
    variables: { customerId: toGid("Customer", customerId) },
  });

  const payload = response.data?.customerSendAccountInviteEmail;
  throwUserErrors(payload?.userErrors, "Failed to send B2B access email");
  return payload?.customer?.id || customerId;
};

const updateAssignedStaff = async (shop, companyId, staffMemberIds) => {
  const client = clientFor(shop);
  const desired = new Set(
    (staffMemberIds || []).map((id) => toGid("StaffMember", id))
  );

  const company = await getCompanyDetails(shop, companyId);
  const locationIds = (company.locations || []).map((loc) => loc.id);
  const current = company.assignedStaff || [];
  const currentIds = new Set(current.map((staff) => staff.staffMemberId));

  const toAdd = Array.from(desired).filter((id) => !currentIds.has(id));
  const toRemove = current.filter((staff) => !desired.has(staff.staffMemberId));

  if (toAdd.length > 0 && locationIds.length > 0) {
    for (const locationId of locationIds) {
      const response = await client.request(COMPANY_LOCATION_ASSIGN_STAFF, {
        variables: { companyLocationId: locationId, staffMemberIds: toAdd },
      });
      const payload = response.data?.companyLocationAssignStaffMembers;
      throwUserErrors(payload?.userErrors, "Failed to assign staff");
    }
  }

  const assignmentIdsToRemove = toRemove.flatMap(
    (staff) => staff.assignmentIds
  );
  if (assignmentIdsToRemove.length > 0) {
    const response = await client.request(COMPANY_LOCATION_REMOVE_STAFF, {
      variables: {
        companyLocationStaffMemberAssignmentIds: assignmentIdsToRemove,
      },
    });
    const payload = response.data?.companyLocationRemoveStaffMembers;
    throwUserErrors(payload?.userErrors, "Failed to remove staff");
  }

  return getCompanyDetails(shop, companyId);
};

const assignContactRoles = async (shop, companyContactId, rolesToAssign) => {
  const client = clientFor(shop);
  const response = await client.request(COMPANY_CONTACT_ASSIGN_ROLES, {
    variables: {
      companyContactId: toGid("CompanyContact", companyContactId),
      rolesToAssign: rolesToAssign.map((role) => ({
        companyContactRoleId: toGid(
          "CompanyContactRole",
          role.companyContactRoleId
        ),
        companyLocationId: toGid("CompanyLocation", role.companyLocationId),
      })),
    },
  });

  const payload = response.data?.companyContactAssignRoles;
  throwUserErrors(payload?.userErrors, "Failed to assign customer roles");
  return payload?.roleAssignments || [];
};

const revokeContactRoles = async (
  shop,
  companyContactId,
  roleAssignmentIds
) => {
  const client = clientFor(shop);
  const response = await client.request(COMPANY_CONTACT_REVOKE_ROLES, {
    variables: {
      companyContactId: toGid("CompanyContact", companyContactId),
      roleAssignmentIds: roleAssignmentIds.map((id) =>
        toGid("CompanyContactRoleAssignment", id)
      ),
      revokeAll: false,
    },
  });

  const payload = response.data?.companyContactRevokeRoles;
  throwUserErrors(payload?.userErrors, "Failed to revoke customer roles");
  return payload?.revokedRoleAssignmentIds || [];
};

const bulkDeleteCompanies = async (shop, companyIds) => {
  const client = clientFor(shop);
  const response = await client.request(COMPANIES_DELETE, {
    variables: { companyIds: companyIds.map((id) => toGid("Company", id)) },
  });

  const payload = response.data?.companiesDelete;
  throwUserErrors(payload?.userErrors, "Failed to delete companies");
  return payload?.deletedCompanyIds || [];
};

module.exports = {
  searchCompanies,
  createCompany,
  assignCustomerToCompany,
  getCustomerCompany,
  removeCustomerFromCompany,
  listCompanies,
  getCompanyDetails,
  assignContactRoles,
  revokeContactRoles,
  updateCompany,
  assignMainContact,
  revokeMainContact,
  removeContact,
  listCustomersForCompany,
  listStaffMembers,
  sendB2bAccessEmail,
  updateAssignedStaff,
  bulkDeleteCompanies,
};
