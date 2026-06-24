import { apiRequest } from "../api";

export async function listCheckoutUpsells() {
  const response = await apiRequest("/api/checkout-upsells", {
    method: "GET",
  });
  return response.data;
}

export async function getCheckoutUpsell(id) {
  const response = await apiRequest(`/api/checkout-upsells/${id}`, {
    method: "GET",
  });
  return response.data;
}

export async function createCheckoutUpsell(payload) {
  const response = await apiRequest("/api/checkout-upsells", {
    method: "POST",
    body: payload,
  });
  return response.data;
}

export async function updateCheckoutUpsell(id, payload) {
  const response = await apiRequest(`/api/checkout-upsells/${id}`, {
    method: "PUT",
    body: payload,
  });
  return response.data;
}

export async function deleteCheckoutUpsell(id) {
  const response = await apiRequest(`/api/checkout-upsells/${id}`, {
    method: "DELETE",
  });
  return response.data;
}
