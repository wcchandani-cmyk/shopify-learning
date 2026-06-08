const Shop = require("./model");
const { SHOP_QUERY } = require("./query");
const {
  auth,
  getGraphQLClient,
  RequestedTokenType,
} = require("../../utils/shopify");
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
        `Shop ${shopDomain} ${wasUninstalled ? "reinstalled" : "new/updated"}`,
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

module.exports = { getShopDetails };
