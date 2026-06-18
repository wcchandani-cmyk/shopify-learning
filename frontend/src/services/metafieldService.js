import { apiRequest } from "../api";

export async function listDefinitions(entityType, token) {
  const response = await apiRequest(`/api/metafields/definitions?entityType=${entityType}`, {
    method: "GET",
    token,
  });
  return response.data?.definitions || [];
}

export async function createDefinition(payload, token) {
  const response = await apiRequest("/api/metafields/definitions", {
    method: "POST",
    token,
    body: payload,
  });
  return response.data?.definition;
}

export async function updateDefinition(id, payload, token) {
  const response = await apiRequest(`/api/metafields/definitions/${id}`, {
    method: "PUT",
    token,
    body: payload,
  });
  return response.data?.definition;
}

export async function deleteDefinition(id, token) {
  const response = await apiRequest(`/api/metafields/definitions/${id}`, {
    method: "DELETE",
    token,
  });
  return response.data;
}

export async function getMetafields(entityType, entityId, token) {
  const response = await apiRequest(`/api/metafields/values?entityType=${entityType}&entityId=${entityId}`, {
    method: "GET",
    token,
  });
  return response.data?.metafields || [];
}

export async function saveMetafields(entityType, entityId, values, token) {
  const response = await apiRequest("/api/metafields/values", {
    method: "POST",
    token,
    body: { entityType, entityId, values },
  });
  return response.data?.saved || [];
}

export async function getMetafieldTypes(token, entityType) {
  const query = entityType ? `?entityType=${encodeURIComponent(entityType)}` : "";
  const response = await apiRequest(`/api/metafields/types${query}`, {
    method: "GET",
    token,
  });
  return response.data?.groups || [];
}

