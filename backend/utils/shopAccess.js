const Shop = require("../modules/shop/model");
const { auth, RequestedTokenType } = require("./shopify");

const resolveShopForApi = async (shopDomain, sessionToken) => {
  if (!shopDomain) {
    const err = new Error("Missing shop domain");
    err.statusCode = 400;
    throw err;
  }

  const loadInstalledShop = () =>
    Shop.findOne({ where: { myshopifyDomain: shopDomain, appInstall: "1" } });

  if (!sessionToken) {
    const shop = await loadInstalledShop();
    if (!shop?.token) {
      const err = new Error(
        "Shop not found. Open this app from your Shopify admin."
      );
      err.statusCode = 404;
      throw err;
    }
    return shop;
  }

  let session;
  try {
    ({ session } = await auth.tokenExchange({
      sessionToken,
      shop: shopDomain,
      requestedTokenType: RequestedTokenType.OfflineAccessToken,
    }));
  } catch (exchangeError) {
    const shop = await loadInstalledShop();
    if (shop?.token) return shop;
    throw exchangeError;
  }

  const accessToken = session.accessToken;
  const canonicalDomain = session.shop || shopDomain;

  const shop =
    (await Shop.findOne({
      where: { myshopifyDomain: canonicalDomain, appInstall: "1" },
    })) ||
    (await Shop.findOne({
      where: { myshopifyDomain: shopDomain, appInstall: "1" },
    }));

  if (!shop) {
    const err = new Error(
      "Shop not installed. Open the app once from Shopify admin to complete setup."
    );
    err.statusCode = 404;
    throw err;
  }

  const updates = {};
  if (shop.token !== accessToken) updates.token = accessToken;
  if (canonicalDomain && shop.myshopifyDomain !== canonicalDomain)
    updates.myshopifyDomain = canonicalDomain;
  if (Object.keys(updates).length > 0) await shop.update(updates);

  shop.token = accessToken;
  if (canonicalDomain) shop.myshopifyDomain = canonicalDomain;

  return shop;
};

const isShopifyUnauthorized = (error) => error?.response?.code === 401;

module.exports = {
  resolveShopForApi,
  isShopifyUnauthorized,
};
