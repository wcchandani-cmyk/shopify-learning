import { apiRequest } from "../api";

export async function listCheckoutUpsells(token) {
  const response = await apiRequest("/api/checkout-upsells", {
    method: "GET",
    token,
  });
  return response.data;
}

export async function getCheckoutUpsell(id, token) {
  const response = await apiRequest(`/api/checkout-upsells/${id}`, {
    method: "GET",
    token,
  });
  return response.data;
}

export async function createCheckoutUpsell(payload, token) {
  const response = await apiRequest("/api/checkout-upsells", {
    method: "POST",
    token,
    body: payload,
  });
  return response.data;
}

export async function updateCheckoutUpsell(id, payload, token) {
  const response = await apiRequest(`/api/checkout-upsells/${id}`, {
    method: "PUT",
    token,
    body: payload,
  });
  return response.data;
}

export async function deleteCheckoutUpsell(id, token) {
  const response = await apiRequest(`/api/checkout-upsells/${id}`, {
    method: "DELETE",
    token,
  });
  return response.data;
}
