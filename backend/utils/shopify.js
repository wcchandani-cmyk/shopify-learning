const {
  shopifyApi,
  ApiVersion,
  Session,
  RequestedTokenType,
} = require("@shopify/shopify-api");
require("@shopify/shopify-api/adapters/node");

const {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET_KEY,
  SCOPES,
  SHOPIFY_APP_URI,
} = require("../config/constants");

function getHostName() {
  const uri = SHOPIFY_APP_URI || "http://localhost:5000";
  return new URL(uri).host;
}

const shopify = shopifyApi({
  apiKey: SHOPIFY_API_KEY,
  apiSecretKey: SHOPIFY_API_SECRET_KEY,
  scopes: (SCOPES || "write_products").split(",").map((s) => s.trim()),
  hostName: getHostName(),
  apiVersion: ApiVersion.October25,
  isEmbeddedApp: true,
});

const getGraphQLClient = ({ shopDomain, accessToken }) => {
  const session = new Session({
    id: `offline_${shopDomain}`,
    shop: shopDomain,
    state: "active",
    isOnline: false,
    accessToken,
  });

  const graphqlClient = new shopify.clients.Graphql({ session });
  return { graphqlClient, session };
};

const getRestClient = (shop) => {
  const { session } = getGraphQLClient({
    shopDomain: shop.myshopifyDomain,
    accessToken: shop.token,
  });
  return new shopify.clients.Rest({ session });
};

module.exports = {
  shopify,
  auth: shopify.auth,
  session: shopify.session,
  RequestedTokenType,
  getGraphQLClient,
  getRestClient,
};
