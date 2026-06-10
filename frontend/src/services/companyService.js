import { apiRequest } from "../api";

const JSON_HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

const getNumericId = (id) => {
  if (!id) return "";
  const parts = String(id).split("/");
  return parts[parts.length - 1];
};

export async function searchCompanies(query, token) {
  const params = new URLSearchParams({ q: query || "" });
  const response = await apiRequest(`/api/company/search?${params}`, {
    method: "GET",
    token,
    headers: JSON_HEADERS,
  });
  return response.data?.companies ?? [];
}

export async function getCustomerCompany(customerId, token) {
  const response = await apiRequest(`/api/company/customer/${getNumericId(customerId)}`, {
    method: "GET",
    token,
    headers: JSON_HEADERS,
  });
  return response.data?.company ?? null;
}

export async function assignCustomerToCompany(
  { customerId, companyId, companyName },
  token
) {
  const response = await apiRequest(`/api/company/assign`, {
    method: "POST",
    token,
    body: { customerId, companyId, companyName },
    headers: JSON_HEADERS,
  });
  return response.data?.company ?? null;
}

export async function removeCustomerFromCompany(customerId, token) {
  const response = await apiRequest(`/api/company/customer/${getNumericId(customerId)}`, {
    method: "DELETE",
    token,
    headers: JSON_HEADERS,
  });
  return response.data?.company ?? null;
}

export async function listCompanies(token) {
  const response = await apiRequest(`/api/company/list`, {
    method: "GET",
    token,
    headers: JSON_HEADERS,
  });
  return response.data?.companies ?? [];
}

export async function getCompanyDetails(companyId, token) {
  const response = await apiRequest(`/api/company/${getNumericId(companyId)}`, {
    method: "GET",
    token,
    headers: JSON_HEADERS,
  });
  return response.data?.company ?? null;
}

export async function assignContactRoles({ companyContactId, rolesToAssign }, token) {
  const response = await apiRequest(`/api/company/contact/assign-roles`, {
    method: "POST",
    token,
    body: { companyContactId, rolesToAssign },
    headers: JSON_HEADERS,
  });
  return response.data?.assignments ?? [];
}

export async function revokeContactRoles({ companyContactId, roleAssignmentIds }, token) {
  const response = await apiRequest(`/api/company/contact/revoke-roles`, {
    method: "POST",
    token,
    body: { companyContactId, roleAssignmentIds },
    headers: JSON_HEADERS,
  });
  return response.data?.revokedIds ?? [];
}

export async function updateCompanyDetails(companyId, { name, externalId }, token) {
  const response = await apiRequest(`/api/company/${getNumericId(companyId)}`, {
    method: "PUT",
    token,
    body: { name, externalId },
    headers: JSON_HEADERS,
  });
  return response.data?.company ?? null;
}

export async function setMainContact(companyId, companyContactId, token) {
  const response = await apiRequest(`/api/company/${getNumericId(companyId)}/main-contact`, {
    method: "POST",
    token,
    body: { companyContactId },
    headers: JSON_HEADERS,
  });
  return response.data?.company ?? null;
}

export async function addContactToCompany({ companyId, customerId }, token) {
  const response = await apiRequest(`/api/company/add-contact`, {
    method: "POST",
    token,
    body: { companyId, customerId },
    headers: JSON_HEADERS,
  });
  return response.data?.company ?? null;
}

export async function removeCompanyContact(companyContactId, token) {
  const response = await apiRequest(`/api/company/contact/remove`, {
    method: "POST",
    token,
    body: { companyContactId },
    headers: JSON_HEADERS,
  });
  return response.data?.removedId ?? null;
}

export async function listEligibleCustomers(query, token) {
  const params = new URLSearchParams({ q: query || "" });
  const response = await apiRequest(`/api/company/eligible-customers?${params}`, {
    method: "GET",
    token,
    headers: JSON_HEADERS,
  });
  return response.data?.customers ?? [];
}

export async function listStaffMembers(token) {
  const response = await apiRequest(`/api/company/staff`, {
    method: "GET",
    token,
    headers: JSON_HEADERS,
  });
  return response.data?.staff ?? [];
}

export async function updateAssignedStaff(companyId, staffMemberIds, token) {
  const response = await apiRequest(`/api/company/${getNumericId(companyId)}/staff`, {
    method: "POST",
    token,
    body: { staffMemberIds },
    headers: JSON_HEADERS,
  });
  return response.data?.company ?? null;
}

export async function sendB2bAccessEmail(customerId, token) {
  const response = await apiRequest(`/api/company/contact/send-invite`, {
    method: "POST",
    token,
    body: { customerId },
    headers: JSON_HEADERS,
  });
  return response.data?.sent ?? false;
}

export async function bulkDeleteCompanies(ids, token) {
  const response = await apiRequest(`/api/company/bulk-delete`, {
    method: "POST",
    token,
    body: { ids },
    headers: JSON_HEADERS,
  });
  return response.data?.deletedIds ?? [];
}

