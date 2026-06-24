import { apiRequest } from "../api";

export async function listCustomers({ page = 1, limit = 25 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const response = await apiRequest(`/api/customer/list?${params}`, {
    method: "GET",
  });
  return response.data;
}

export async function listCustomerTags() {
  const response = await apiRequest(`/api/customer/tags`, {
    method: "GET",
  });
  return response.data?.tags ?? [];
}

export async function getCustomer(customerId) {
  const response = await apiRequest(`/api/customer/${customerId}`, {
    method: "GET",
  });
  return response.data;
}

export async function createCustomer(payload) {
  const response = await apiRequest(`/api/customer`, {
    method: "POST",
    body: payload,
  });
  return response.data;
}

export async function updateCustomer(customerId, payload) {
  const response = await apiRequest(`/api/customer/${customerId}`, {
    method: "PUT",
    body: payload,
  });
  return response.data;
}

export async function bulkDeleteCustomers(ids) {
  const response = await apiRequest("/api/customer/bulk-delete", {
    method: "POST",
    body: { ids },
  });
  return response.data;
}

export async function listCustomerComments(customerId) {
  const response = await apiRequest(`/api/customer/${customerId}/comments`, {
    method: "GET",
  });
  return response.data?.comments ?? [];
}

export async function addCustomerComment(customerId, body) {
  const response = await apiRequest(`/api/customer/${customerId}/comments`, {
    method: "POST",
    body: { body },
  });
  return response.data;
}

export async function deleteCustomerComment(customerId, commentId) {
  const response = await apiRequest(
    `/api/customer/${customerId}/comments/${commentId}`,
    {
      method: "DELETE",
    }
  );
  return response.data;
}
