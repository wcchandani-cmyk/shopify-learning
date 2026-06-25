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
const { successResponse, errorResponse } = require("../../utils/response");
const { FREE_TRIAL_DAYS } = require("../../config/constants");
const { handleError } = require("../../utils/controllerHelper");

const getShopDetails = async (req, res) => {
  try {
    const { sessionToken, shopDomain } = req;
    const existingShop = await Shop.findOne({
      where: { myshopifyDomain: shopDomain },
    });
    let shop = existingShop?.toJSON() || null;
    const wasUninstalled = existingShop?.appInstall === "0";

    const { session } = await auth.tokenExchange({
      sessionToken,
      shop: shopDomain,
      requestedTokenType: RequestedTokenType.OfflineAccessToken,
    });
    const token = session.accessToken;

    if (!existingShop || wasUninstalled) {
      const { graphqlClient: client } = getGraphQLClient({
        shopDomain: session.shop,
        accessToken: token,
      });
      const gqlResponse = await client.request(SHOP_QUERY);
      const shopInfo = gqlResponse.data?.shop;

      if (!shopInfo) throw new Error("Unable to fetch shop info from Shopify");

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

    if (shop) delete shop.token;
    successResponse(res, 200, "Shop detail get successfully", {
      ...shop,
      trialDays: FREE_TRIAL_DAYS,
    });
  } catch (error) {
    console.error("Error getting shop details:", error);
    errorResponse(res, 401, "Invalid session token", error);
  }
};

const listLocales = async (req, res) => {
  try {
    const shop = req.shop;
    const { graphqlClient } = getGraphQLClient({
      shopDomain: shop.myshopifyDomain,
      accessToken: shop.token,
    });
    const response = await graphqlClient.request(SHOP_LOCALES_QUERY);
    const locales = (response.data?.shopLocales || [])
      .filter((item) => item.published || item.primary)
      .map((item) => ({ locale: item.locale, primary: !!item.primary }));

    successResponse(res, 200, "Locales fetched successfully", { locales });
  } catch (error) {
    console.error("Error listing shop locales:", error.message);
    if (/(Access denied|scope|forbidden)/i.test(error.message)) {
      return successResponse(
        res,
        200,
        "Locales fetched successfully (fallback)",
        { locales: [{ locale: "en", primary: true }] }
      );
    }
    handleError(res, error, "Failed to list locales");
  }
};

const listCurrencies = async (req, res) => {
  try {
    const shop = req.shop;
    const { graphqlClient } = getGraphQLClient({
      shopDomain: shop.myshopifyDomain,
      accessToken: shop.token,
    });
    const response = await graphqlClient.request(SHOP_CURRENCIES_QUERY);
    const primary = response.data?.shop?.currencyCode || "USD";
    const enabled = response.data?.shop?.enabledPresentmentCurrencies || [
      primary,
    ];

    successResponse(res, 200, "Currencies fetched successfully", {
      primary,
      enabled,
    });
  } catch (error) {
    console.error("Error listing shop currencies:", error.message);
    if (/(Access denied|scope|forbidden)/i.test(error.message)) {
      return successResponse(
        res,
        200,
        "Currencies fetched successfully (fallback)",
        { primary: "USD", enabled: ["USD"] }
      );
    }
    handleError(res, error, "Failed to list currencies");
  }
};

module.exports = { getShopDetails, listLocales, listCurrencies };
