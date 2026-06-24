import { apiRequest } from "../api";

export async function getShopDetails() {
  const response = await apiRequest("/api/shop/details", {
    method: "GET",
  });
  return response.data;
}

export async function getShopLocales() {
  const response = await apiRequest("/api/shop/locales", {
    method: "GET",
  });
  return response.data?.locales || [];
}

export async function getShopCurrencies() {
  const response = await apiRequest("/api/shop/currencies", {
    method: "GET",
  });
  return response.data || { primary: "USD", enabled: ["USD"] };
}
