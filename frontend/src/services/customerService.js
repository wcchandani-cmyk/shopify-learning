import { apiRequest } from "../api";

export async function listCustomers({ page = 1, limit = 25 } = {}, token) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const response = await apiRequest(`/api/customer/list?${params}`, {
    method: "GET",
    token,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return response.data;
}

export async function listCustomerTags(token) {
  const response = await apiRequest(`/api/customer/tags`, {
    method: "GET",
    token,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return response.data?.tags ?? [];
}

export async function getCustomer(customerId, token) {
  const response = await apiRequest(`/api/customer/${customerId}`, {
    method: "GET",
    token,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return response.data;
}

export async function createCustomer(payload, token) {
  const response = await apiRequest(`/api/customer`, {
    method: "POST",
    token,
    body: payload,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return response.data;
}

export async function updateCustomer(customerId, payload, token) {
  const response = await apiRequest(`/api/customer/${customerId}`, {
    method: "PUT",
    token,
    body: payload,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return response.data;
}

const JSON_HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

export async function bulkDeleteCustomers(ids, token) {
  const response = await apiRequest("/api/customer/bulk-delete", {
    method: "POST",
    token,
    body: { ids },
    headers: JSON_HEADERS,
  });
  return response.data;
}

export async function listCustomerComments(customerId, token) {
  const response = await apiRequest(`/api/customer/${customerId}/comments`, {
    method: "GET",
    token,
    headers: JSON_HEADERS,
  });
  return response.data?.comments ?? [];
}

export async function addCustomerComment(customerId, body, token) {
  const response = await apiRequest(`/api/customer/${customerId}/comments`, {
    method: "POST",
    token,
    body: { body },
    headers: JSON_HEADERS,
  });
  return response.data;
}

export async function deleteCustomerComment(customerId, commentId, token) {
  const response = await apiRequest(
    `/api/customer/${customerId}/comments/${commentId}`,
    {
      method: "DELETE",
      token,
      headers: JSON_HEADERS,
    }
  );
  return response.data;
}
