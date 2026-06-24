import { apiRequest } from "../api";

export async function listDefinitions(entityType) {
  const response = await apiRequest(`/api/metafields/definitions?entityType=${entityType}`, {
    method: "GET",
  });
  return response.data?.definitions || [];
}

export async function createDefinition(payload) {
  const response = await apiRequest("/api/metafields/definitions", {
    method: "POST",
    body: payload,
  });
  return response.data?.definition;
}

export async function updateDefinition(id, payload) {
  const response = await apiRequest(`/api/metafields/definitions/${id}`, {
    method: "PUT",
    body: payload,
  });
  return response.data?.definition;
}

export async function deleteDefinition(id) {
  const response = await apiRequest(`/api/metafields/definitions/${id}`, {
    method: "DELETE",
  });
  return response.data;
}

export async function getMetafields(entityType, entityId) {
  const response = await apiRequest(`/api/metafields/values?entityType=${entityType}&entityId=${entityId}`, {
    method: "GET",
  });
  return response.data?.metafields || [];
}

export async function saveMetafields(entityType, entityId, values) {
  const response = await apiRequest("/api/metafields/values", {
    method: "POST",
    body: { entityType, entityId, values },
  });
  return response.data?.saved || [];
}

export async function getMetafieldTypes(entityType) {
  const query = entityType ? `?entityType=${encodeURIComponent(entityType)}` : "";
  const response = await apiRequest(`/api/metafields/types${query}`, {
    method: "GET",
  });
  return response.data?.groups || [];
}
