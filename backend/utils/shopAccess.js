const Shop = require("../modules/shop/model");
const { auth, RequestedTokenType } = require("./shopify");

async function resolveShopForApi(shopDomain, sessionToken) {
  if (!shopDomain) {
    const err = new Error("Missing shop domain");
    err.statusCode = 400;
    throw err;
  }

  if (!sessionToken) {
    const shop = await Shop.findOne({
      where: { myshopifyDomain: shopDomain, appInstall: "1" },
    });
    if (!shop?.token) {
      const err = new Error(
        "Shop not found. Open this app from your Shopify admin."
      );
      err.statusCode = 404;
      throw err;
    }
    return shop;
  }

  const { session } = await auth.tokenExchange({
    sessionToken,
    shop: shopDomain,
    requestedTokenType: RequestedTokenType.OfflineAccessToken,
  });

  const accessToken = session.accessToken;
  const canonicalDomain = session.shop || shopDomain;

  let shop = await Shop.findOne({
    where: { myshopifyDomain: canonicalDomain, appInstall: "1" },
  });

  if (!shop) {
    shop = await Shop.findOne({
      where: { myshopifyDomain: shopDomain, appInstall: "1" },
    });
  }

  if (!shop) {
    const err = new Error(
      "Shop not installed. Open the app once from Shopify admin to complete setup."
    );
    err.statusCode = 404;
    throw err;
  }

  const updates = {};
  if (shop.token !== accessToken) {
    updates.token = accessToken;
  }
  if (canonicalDomain && shop.myshopifyDomain !== canonicalDomain) {
    updates.myshopifyDomain = canonicalDomain;
  }

  if (Object.keys(updates).length > 0) {
    await shop.update(updates);
  }

  shop.token = accessToken;
  if (canonicalDomain) {
    shop.myshopifyDomain = canonicalDomain;
  }

  return shop;
}

function isShopifyUnauthorized(error) {
  return error?.response?.code === 401;
}

module.exports = {
  resolveShopForApi,
  isShopifyUnauthorized,
};
