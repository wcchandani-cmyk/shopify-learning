import { apiRequest } from "../api";

export async function getShopDetails(token) {
  const response = await apiRequest("/api/shop/details", {
    method: "GET",
    token,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return response.data;
}
