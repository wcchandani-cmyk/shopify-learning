const Shop = require("./model");
const {
  SHOP_QUERY,
  SHOP_LOCALES_QUERY,
  SHOP_CURRENCIES_QUERY,
} = require("./query");
const {
  auth,
  getGraphQLClient,
  RequestedTokenType,
} = require("../../utils/shopify");
const { resolveShopForApi } = require("../../utils/shopAccess");
const { successResponse, errorResponse } = require("../../utils/response");
const { FREE_TRIAL_DAYS } = require("../../config/constants");

const getShopDetails = async (req, res) => {
  try {
    const { sessionToken, shopDomain } = req;

    // Step 1: Check DB for shop
    let existingShop = await Shop.findOne({
      where: { myshopifyDomain: shopDomain },
    });
    let shop = existingShop ? existingShop.toJSON() : null;
    const wasUninstalled = existingShop?.appInstall === "0";

    const { session } = await auth.tokenExchange({
      sessionToken,
      shop: shopDomain,
      requestedTokenType: RequestedTokenType.OfflineAccessToken,
    });
    const token = session.accessToken;

    // Refresh shop row + metadata on install, reinstall, or each app open
    if (!existingShop || wasUninstalled) {
      const { graphqlClient: client } = getGraphQLClient({
        shopDomain: session.shop,
        accessToken: token,
      });

      const gqlResponse = await client.request(SHOP_QUERY);
      const shopInfo = gqlResponse.data?.shop;

      if (!shopInfo) {
        throw new Error("Unable to fetch shop info from Shopify");
      }

      const upsertData = {
        myshopifyDomain: session.shop || existingShop?.myshopifyDomain,
        token,
        domain: shopInfo.primaryDomain?.host,
        name: shopInfo.name,
        email: shopInfo.email,
        province: shopInfo.billingAddress?.province,
        country: shopInfo.billingAddress?.country,
        city: shopInfo.billingAddress?.city,
        currency: shopInfo.currencyCode,
        ianaTimezone: shopInfo.ianaTimezone,
        shopOwner: shopInfo.shopOwnerName,
        moneyFormat: shopInfo.currencyFormats?.moneyFormat,
        moneyWithCurrencyFormat:
          shopInfo.currencyFormats?.moneyWithCurrencyFormat,
        weightUnit: shopInfo.weightUnit,
        planDisplayName: shopInfo.plan?.publicDisplayName,
        planName:
          shopInfo.plan?.shopifyPlus === true
            ? "shopify_plus"
            : shopInfo.plan?.publicDisplayName,
        appInstall: "1",
      };

      const [upsertedShop] = await Shop.upsert(upsertData, {
        conflictFields: ["myshopifyDomain"],
      });

      console.log(
        `Shop ${shopDomain} ${wasUninstalled ? "reinstalled" : "new/updated"}`
      );

      shop = upsertedShop.toJSON();
    } else if (existingShop.token !== token) {
      await existingShop.update({ token });
      shop = { ...existingShop.toJSON(), token };
    }

    delete shop?.token;

    successResponse(res, 200, "Shop detail get successfully", {
      ...shop,
      trialDays: FREE_TRIAL_DAYS,
    });
  } catch (error) {
    console.error("Error getting shop details:", error);
    errorResponse(res, 401, "Invalid session token", error);
  }
};

// The store's enabled languages, used for the customer "Language" field.
const listLocales = async (req, res) => {
  try {
    const shop = await resolveShopForApi(req.shopDomain, req.sessionToken);
    const { graphqlClient } = getGraphQLClient({
      shopDomain: shop.myshopifyDomain,
      accessToken: shop.token,
    });

    const response = await graphqlClient.request(SHOP_LOCALES_QUERY);
    const locales = (response.data?.shopLocales || [])
      .filter((item) => item.published || item.primary)
      .map((item) => ({
        locale: item.locale,
        primary: Boolean(item.primary),
      }));

    successResponse(res, 200, "Locales fetched successfully", { locales });
  } catch (error) {
    console.error("Error listing shop locales:", error.message);
    // If access is denied (e.g. missing scopes), return a safe fallback locales array instead of crashing with 500
    if (
      error.message?.includes("Access denied") ||
      error.message?.includes("scope") ||
      error.message?.includes("forbidden")
    ) {
      return successResponse(
        res,
        200,
        "Locales fetched successfully (fallback)",
        {
          locales: [{ locale: "en", primary: true }],
        }
      );
    }
    const status = error.statusCode || 500;
    errorResponse(
      res,
      status,
      error.message || "Failed to list locales",
      error
    );
  }
};

const listCurrencies = async (req, res) => {
  try {
    const shop = await resolveShopForApi(req.shopDomain, req.sessionToken);
    const { graphqlClient } = getGraphQLClient({
      shopDomain: shop.myshopifyDomain,
      accessToken: shop.token,
    });

    const response = await graphqlClient.request(SHOP_CURRENCIES_QUERY);
    const shopInfo = response.data?.shop;
    const primary = shopInfo?.currencyCode || "USD";
    const enabled =
      Array.isArray(shopInfo?.enabledPresentmentCurrencies) &&
      shopInfo.enabledPresentmentCurrencies.length
        ? shopInfo.enabledPresentmentCurrencies
        : [primary];

    successResponse(res, 200, "Currencies fetched successfully", {
      primary,
      enabled,
    });
  } catch (error) {
    console.error("Error listing shop currencies:", error.message);
    if (
      error.message?.includes("Access denied") ||
      error.message?.includes("scope") ||
      error.message?.includes("forbidden")
    ) {
      return successResponse(
        res,
        200,
        "Currencies fetched successfully (fallback)",
        { primary: "USD", enabled: ["USD"] }
      );
    }
    const status = error.statusCode || 500;
    errorResponse(
      res,
      status,
      error.message || "Failed to list currencies",
      error
    );
  }
};

module.exports = { getShopDetails, listLocales, listCurrencies };
