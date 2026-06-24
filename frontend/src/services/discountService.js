import { apiRequest } from "../api";

export async function listDiscounts({ page = 1, limit = 25 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const response = await apiRequest(`/api/discount/list?${params}`, {
    method: "GET",
  });
  return response.data;
}

export async function createDiscount(payload) {
  const response = await apiRequest("/api/discount", {
    method: "POST",
    body: payload,
  });
  return response.data;
}

export async function getDiscount(id) {
  const response = await apiRequest(`/api/discount/${id}`, {
    method: "GET",
  });
  return response.data;
}

export async function updateDiscount(id, payload) {
  const response = await apiRequest(`/api/discount/${id}`, {
    method: "PUT",
    body: payload,
  });
  return response.data;
}

export async function deleteDiscounts(ids) {
  await apiRequest("/api/discount/delete", {
    method: "POST",
    body: { ids },
  });
}

export async function listDiscountComments(discountId) {
  const response = await apiRequest(`/api/discount/${discountId}/comments`, {
    method: "GET",
  });
  return response.data?.comments ?? [];
}

export async function addDiscountComment(discountId, body) {
  const response = await apiRequest(`/api/discount/${discountId}/comments`, {
    method: "POST",
    body: { body },
  });
  return response.data;
}

export async function deleteDiscountComment(discountId, commentId) {
  const response = await apiRequest(
    `/api/discount/${discountId}/comments/${commentId}`,
    {
      method: "DELETE",
    }
  );
  return response.data;
}

export async function listMarkets() {
  const response = await apiRequest("/api/discount/markets", {
    method: "GET",
  });
  return response.data?.markets ?? [];
}

export async function listSegments() {
  const response = await apiRequest("/api/discount/segments", {
    method: "GET",
  });
  return response.data?.segments ?? [];
}

export async function listShippableCountries() {
  const response = await apiRequest("/api/discount/countries", {
    method: "GET",
  });
  return response.data ?? { countryCodes: [], includeRestOfWorld: false };
}
