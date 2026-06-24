import { apiRequest } from "../api";

const JSON_HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

export async function listOrders({ page = 1, limit = 25, sync = false, tab = "" } = {}, token) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (sync) {
    params.set("sync", "true");
  }
  if (tab) {
    params.set("tab", tab);
  }

  const response = await apiRequest(`/api/order/list?${params}`, {
    method: "GET",
    token,
    headers: JSON_HEADERS,
  });
  return response.data;
}

export async function getOrder(orderId, token) {
  const response = await apiRequest(`/api/order/${orderId}`, {
    method: "GET",
    token,
    headers: JSON_HEADERS,
  });
  return response.data;
}

export async function createOrder(payload, token) {
  const response = await apiRequest(`/api/order`, {
    method: "POST",
    token,
    body: payload,
    headers: JSON_HEADERS,
  });
  return response.data;
}

export async function getPaymentTermsTemplates(token) {
  const response = await apiRequest(`/api/order/payment-terms`, {
    method: "GET",
    token,
    headers: JSON_HEADERS,
  });
  return response.data?.paymentTerms ?? [];
}

export async function listOrderComments(orderId, token) {
  const response = await apiRequest(`/api/order/${orderId}/comments`, {
    method: "GET",
    token,
    headers: JSON_HEADERS,
  });
  return response.data?.comments ?? [];
}

export async function addOrderComment(orderId, body, token) {
  const response = await apiRequest(`/api/order/${orderId}/comments`, {
    method: "POST",
    token,
    body: { body },
    headers: JSON_HEADERS,
  });
  return response.data;
}

export async function deleteOrderComment(orderId, commentId, token) {
  const response = await apiRequest(
    `/api/order/${orderId}/comments/${commentId}`,
    {
      method: "DELETE",
      token,
      headers: JSON_HEADERS,
    }
  );
  return response.data;
}

export async function cancelOrder(orderId, payload, token) {
  const response = await apiRequest(`/api/order/${orderId}/cancel`, {
    method: "POST",
    token,
    body: payload,
    headers: JSON_HEADERS,
  });
  return response.data;
}

export async function updateOrder(orderId, payload, token) {
  const response = await apiRequest(`/api/order/${orderId}`, {
    method: "PUT",
    token,
    body: payload,
    headers: JSON_HEADERS,
  });
  return response.data;
}
