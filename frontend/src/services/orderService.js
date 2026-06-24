import { apiRequest } from "../api";

export async function listOrders({ page = 1, limit = 25, sync = false, tab = "" } = {}) {
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
  });
  return response.data;
}

export async function getOrder(orderId) {
  const response = await apiRequest(`/api/order/${orderId}`, {
    method: "GET",
  });
  return response.data;
}

export async function createOrder(payload) {
  const response = await apiRequest(`/api/order`, {
    method: "POST",
    body: payload,
  });
  return response.data;
}

export async function getPaymentTermsTemplates() {
  const response = await apiRequest(`/api/order/payment-terms`, {
    method: "GET",
  });
  return response.data?.paymentTerms ?? [];
}

export async function listOrderComments(orderId) {
  const response = await apiRequest(`/api/order/${orderId}/comments`, {
    method: "GET",
  });
  return response.data?.comments ?? [];
}

export async function addOrderComment(orderId, body) {
  const response = await apiRequest(`/api/order/${orderId}/comments`, {
    method: "POST",
    body: { body },
  });
  return response.data;
}

export async function deleteOrderComment(orderId, commentId) {
  const response = await apiRequest(
    `/api/order/${orderId}/comments/${commentId}`,
    {
      method: "DELETE",
    }
  );
  return response.data;
}

export async function cancelOrder(orderId, payload) {
  const response = await apiRequest(`/api/order/${orderId}/cancel`, {
    method: "POST",
    body: payload,
  });
  return response.data;
}

export async function updateOrder(orderId, payload) {
  const response = await apiRequest(`/api/order/${orderId}`, {
    method: "PUT",
    body: payload,
  });
  return response.data;
}
