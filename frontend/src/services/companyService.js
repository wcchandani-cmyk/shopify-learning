import { apiRequest } from "../api";

const getNumericId = (id) => {
  if (!id) return "";
  const parts = String(id).split("/");
  return parts[parts.length - 1];
};

export async function searchCompanies(query) {
  const params = new URLSearchParams({ q: query || "" });
  const response = await apiRequest(`/api/company/search?${params}`, {
    method: "GET",
  });
  return response.data?.companies ?? [];
}

export async function getCustomerCompany(customerId) {
  const response = await apiRequest(`/api/company/customer/${getNumericId(customerId)}`, {
    method: "GET",
  });
  return response.data?.company ?? null;
}

export async function assignCustomerToCompany(
  { customerId, companyId, companyName }
) {
  const response = await apiRequest(`/api/company/assign`, {
    method: "POST",
    body: { customerId, companyId, companyName },
  });
  return response.data?.company ?? null;
}

export async function removeCustomerFromCompany(customerId) {
  const response = await apiRequest(`/api/company/customer/${getNumericId(customerId)}`, {
    method: "DELETE",
  });
  return response.data?.company ?? null;
}

export async function listCompanies() {
  const response = await apiRequest(`/api/company/list`, {
    method: "GET",
  });
  return response.data?.companies ?? [];
}

export async function getCompanyDetails(companyId) {
  const response = await apiRequest(`/api/company/${getNumericId(companyId)}`, {
    method: "GET",
  });
  return response.data?.company ?? null;
}

export async function assignContactRoles({ companyContactId, rolesToAssign }) {
  const response = await apiRequest(`/api/company/contact/assign-roles`, {
    method: "POST",
    body: { companyContactId, rolesToAssign },
  });
  return response.data?.assignments ?? [];
}

export async function revokeContactRoles({ companyContactId, roleAssignmentIds }) {
  const response = await apiRequest(`/api/company/contact/revoke-roles`, {
    method: "POST",
    body: { companyContactId, roleAssignmentIds },
  });
  return response.data?.revokedIds ?? [];
}

export async function updateCompanyDetails(companyId, { name, externalId }) {
  const response = await apiRequest(`/api/company/${getNumericId(companyId)}`, {
    method: "PUT",
    body: { name, externalId },
  });
  return response.data?.company ?? null;
}

export async function setMainContact(companyId, companyContactId) {
  const response = await apiRequest(`/api/company/${getNumericId(companyId)}/main-contact`, {
    method: "POST",
    body: { companyContactId },
  });
  return response.data?.company ?? null;
}

export async function addContactToCompany({ companyId, customerId }) {
  const response = await apiRequest(`/api/company/add-contact`, {
    method: "POST",
    body: { companyId, customerId },
  });
  return response.data?.company ?? null;
}

export async function removeCompanyContact(companyContactId) {
  const response = await apiRequest(`/api/company/contact/remove`, {
    method: "POST",
    body: { companyContactId },
  });
  return response.data?.removedId ?? null;
}

export async function listEligibleCustomers(query) {
  const params = new URLSearchParams({ q: query || "" });
  const response = await apiRequest(`/api/company/eligible-customers?${params}`, {
    method: "GET",
  });
  return response.data?.customers ?? [];
}

export async function listStaffMembers() {
  const response = await apiRequest(`/api/company/staff`, {
    method: "GET",
  });
  return response.data?.staff ?? [];
}

export async function updateAssignedStaff(companyId, staffMemberIds) {
  const response = await apiRequest(`/api/company/${getNumericId(companyId)}/staff`, {
    method: "POST",
    body: { staffMemberIds },
  });
  return response.data?.company ?? null;
}

export async function sendB2bAccessEmail(customerId) {
  const response = await apiRequest(`/api/company/contact/send-invite`, {
    method: "POST",
    body: { customerId },
  });
  return response.data?.sent ?? false;
}

export async function bulkDeleteCompanies(ids) {
  const response = await apiRequest(`/api/company/bulk-delete`, {
    method: "POST",
    body: { ids },
  });
  return response.data?.deletedIds ?? [];
}
