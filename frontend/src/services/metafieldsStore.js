import { getMetafields, getMetafieldTypes } from "./metafieldService";

const cache = new Map();
const inflight = new Map();

const keyOf = (entityType, entityId) => `${entityType}:${entityId}`;

export async function fetchMetafieldsBundle(entityType, entityId) {
  const idToFetch = entityId === "new" || !entityId ? "0" : entityId;
  const [metafields, typeOptions] = await Promise.all([
    getMetafields(entityType, idToFetch),
    getMetafieldTypes(entityType),
  ]);
  return { metafields, typeOptions };
}

// Loads the bundle once; concurrent callers share one request.
export function prefetchMetafields(entityType, entityId) {
  const key = keyOf(entityType, entityId);
  if (cache.has(key)) return Promise.resolve(cache.get(key));
  if (inflight.has(key)) return inflight.get(key);

  const request = fetchMetafieldsBundle(entityType, entityId)
    .then((bundle) => {
      cache.set(key, bundle);
      inflight.delete(key);
      return bundle;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, request);
  return request;
}

export function getCachedMetafields(entityType, entityId) {
  return cache.get(keyOf(entityType, entityId));
}

export function setCachedMetafields(entityType, entityId, bundle) {
  cache.set(keyOf(entityType, entityId), bundle);
}
