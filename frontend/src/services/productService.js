import { apiRequest } from "../api";

export async function getProduct(productId) {
  const response = await apiRequest(`/api/product/${productId}`, {
    method: "GET",
  });
  return response.data;
}

export async function listProducts({ page = 1, limit = 25 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const response = await apiRequest(`/api/product/list?${params}`, {
    method: "GET",
  });
  return response.data;
}

export async function searchTaxonomy({ search, childrenOf } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (childrenOf) params.set("childrenOf", childrenOf);

  const response = await apiRequest(`/api/product/taxonomy?${params}`, {
    method: "GET",
  });
  return response.data?.categories || [];
}

export async function listProductVendors() {
  const response = await apiRequest(`/api/product/product-vendors`, {
    method: "GET",
  });
  return response.data?.vendors || [];
}

export async function createProduct(payload) {
  const response = await apiRequest("/api/product", {
    method: "POST",
    body: payload,
  });
  return response.data;
}

export async function updateProduct(productId, payload) {
  const response = await apiRequest(`/api/product/${productId}`, {
    method: "PUT",
    body: payload,
  });
  return response.data;
}

export async function bulkDeleteProducts(ids) {
  await apiRequest("/api/product/bulk-delete", {
    method: "POST",
    body: { ids },
  });
}
