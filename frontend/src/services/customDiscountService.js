import { apiRequest } from "../api";

export async function listCustomDiscounts({ page = 1, limit = 25 } = {}, token) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const response = await apiRequest(`/api/custom-discounts/list?${params}`, {
    method: "GET",
    token,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return response.data;
}

export async function createCustomDiscount(payload, token) {
  const response = await apiRequest("/api/custom-discounts", {
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

export async function getCustomDiscount(id, token) {
  const response = await apiRequest(`/api/custom-discounts/${id}`, {
    method: "GET",
    token,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return response.data;
}

export async function updateCustomDiscount(id, payload, token) {
  const response = await apiRequest(`/api/custom-discounts/${id}`, {
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

export async function deleteCustomDiscounts(ids, token) {
  const response = await apiRequest("/api/custom-discounts/delete", {
    method: "POST",
    token,
    body: { ids },
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return response.data;
}

export async function toggleCustomDiscountStatus(id, status, token) {
  const response = await apiRequest(`/api/custom-discounts/${id}/status`, {
    method: "PATCH",
    token,
    body: { status },
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return response.data;
}
