import { apiRequest } from "../api";

export async function getProduct(productId, token) {
  const response = await apiRequest(`/api/product/${productId}`, {
    method: "GET",
    token,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return response.data;
}

export async function listProducts({ page = 1, limit = 25 } = {}, token) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const response = await apiRequest(`/api/product/list?${params}`, {
    method: "GET",
    token,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return response.data;
}

export async function searchTaxonomy({ search, childrenOf } = {}, token) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (childrenOf) params.set("childrenOf", childrenOf);

  const response = await apiRequest(`/api/product/taxonomy?${params}`, {
    method: "GET",
    token,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return response.data?.categories || [];
}

export async function listProductVendors(token) {
  const response = await apiRequest(`/api/product/product-vendors`, {
    method: "GET",
    token,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return response.data?.vendors || [];
}

export async function createProduct(payload, token) {
  const response = await apiRequest("/api/product", {
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

export async function updateProduct(productId, payload, token) {
  const response = await apiRequest(`/api/product/${productId}`, {
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

export async function bulkDeleteProducts(ids, token) {
  await apiRequest("/api/product/bulk-delete", {
    method: "POST",
    token,
    body: { ids },
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
}
