const API_BASE = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");

export const apiUrl = (path) => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${normalized}` : normalized;
};

// Session tokens expire after ~1 minute, so fetch a fresh one per request
// instead of reusing a captured token (avoids "session expired" on open forms).
export async function getSessionToken(fallbackToken) {
  try {
    if (typeof window !== "undefined" && window.shopify?.idToken) {
      return await window.shopify.idToken();
    }
  } catch {
    /* fall back to the provided token below */
  }
  return fallbackToken;
}

export async function apiRequest(
  path,
  { method = "GET", token, body, headers: extraHeaders = {} } = {},
) {
  const authToken = await getSessionToken(token);
  const res = await fetch(apiUrl(path), {
    method,
    headers: {
      Accept: "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await parseApiResponse(res);
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

export const parseApiResponse = async (res) => {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    const hint = API_BASE
      ? "Restart the backend (port 5000) so GET /api/product/:id is available."
      : "Start the API on :5000.";
    throw new Error(`Expected JSON (${res.status}). ${hint}`);
  }
};
