import { apiRequest } from "../api";

export async function listCustomDiscounts({ page = 1, limit = 25 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const response = await apiRequest(`/api/custom-discounts/list?${params}`, {
    method: "GET",
  });
  return response.data;
}

export async function createCustomDiscount(payload) {
  const response = await apiRequest("/api/custom-discounts", {
    method: "POST",
    body: payload,
  });
  return response.data;
}

export async function getCustomDiscount(id) {
  const response = await apiRequest(`/api/custom-discounts/${id}`, {
    method: "GET",
  });
  return response.data;
}

export async function updateCustomDiscount(id, payload) {
  const response = await apiRequest(`/api/custom-discounts/${id}`, {
    method: "PUT",
    body: payload,
  });
  return response.data;
}

export async function deleteCustomDiscounts(ids) {
  const response = await apiRequest("/api/custom-discounts/delete", {
    method: "POST",
    body: { ids },
  });
  return response.data;
}

export async function toggleCustomDiscountStatus(id, status) {
  const response = await apiRequest(`/api/custom-discounts/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
  return response.data;
}
