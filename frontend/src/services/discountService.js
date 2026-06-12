import { apiRequest } from "../api";

export async function listDiscounts({ page = 1, limit = 25 } = {}, token) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const response = await apiRequest(`/api/discount/list?${params}`, {
    method: "GET",
    token,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return response.data;
}

export async function createDiscount(payload, token) {
  const response = await apiRequest("/api/discount", {
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

export async function getDiscount(id, token) {
  const response = await apiRequest(`/api/discount/${id}`, {
    method: "GET",
    token,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return response.data;
}

export async function updateDiscount(id, payload, token) {
  const response = await apiRequest(`/api/discount/${id}`, {
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

export async function deleteDiscounts(ids, token) {
  await apiRequest("/api/discount/delete", {
    method: "POST",
    token,
    body: { ids },
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
}

export async function listDiscountComments(discountId, token) {
  const response = await apiRequest(`/api/discount/${discountId}/comments`, {
    method: "GET",
    token,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return response.data?.comments ?? [];
}

export async function addDiscountComment(discountId, body, token) {
  const response = await apiRequest(`/api/discount/${discountId}/comments`, {
    method: "POST",
    token,
    body: { body },
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return response.data;
}

export async function deleteDiscountComment(discountId, commentId, token) {
  const response = await apiRequest(
    `/api/discount/${discountId}/comments/${commentId}`,
    {
      method: "DELETE",
      token,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
}

export async function listMarkets(token) {
  const response = await apiRequest("/api/discount/markets", {
    method: "GET",
    token,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return response.data?.markets ?? [];
}

export async function listSegments(token) {
  const response = await apiRequest("/api/discount/segments", {
    method: "GET",
    token,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return response.data?.segments ?? [];
}

export async function listShippableCountries(token) {
  const response = await apiRequest("/api/discount/countries", {
    method: "GET",
    token,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return response.data ?? { countryCodes: [], includeRestOfWorld: false };
}
