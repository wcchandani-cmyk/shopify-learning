import { apiRequest } from "../api";

const BASE = "/api/checkout-customizations";

export async function listCheckoutCustomizations(type) {
  const url = type ? `${BASE}?type=${encodeURIComponent(type)}` : BASE;
  const response = await apiRequest(url, { method: "GET" });
  return response.data;
}

export async function getCheckoutCustomization(id) {
  const response = await apiRequest(`${BASE}/${id}`, { method: "GET" });
  return response.data;
}

export async function createCheckoutCustomization(payload) {
  const response = await apiRequest(BASE, {
    method: "POST",
    body: payload,
  });
  return response.data;
}

export async function updateCheckoutCustomization(id, payload) {
  const response = await apiRequest(`${BASE}/${id}`, {
    method: "PUT",
    body: payload,
  });
  return response.data;
}

export async function deleteCheckoutCustomization(id) {
  const response = await apiRequest(`${BASE}/${id}`, {
    method: "DELETE",
  });
  return response.data;
}
