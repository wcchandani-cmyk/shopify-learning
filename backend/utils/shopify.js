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

const getHostName = () =>
  new URL(SHOPIFY_APP_URI || "http://localhost:5000").host;

const shopify = shopifyApi({
  apiKey: SHOPIFY_API_KEY,
  apiSecretKey: SHOPIFY_API_SECRET_KEY,
  scopes: (SCOPES || "write_products").split(",").map((scope) => scope.trim()),
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
  return { graphqlClient: new shopify.clients.Graphql({ session }), session };
};

const getRestClient = (shop) => {
  const { session } = getGraphQLClient({
    shopDomain: shop.myshopifyDomain,
    accessToken: shop.token,
  });
  return new shopify.clients.Rest({ session });
};

const extractGraphqlError = (error) => {
  const gqlErrors =
    error?.body?.errors?.graphQLErrors ||
    error?.response?.errors?.graphQLErrors ||
    [];
  if (Array.isArray(gqlErrors) && gqlErrors.length > 0) {
    const detail = gqlErrors
      .map((errDetail) => {
        const problems = errDetail?.extensions?.problems || errDetail?.problems;
        return Array.isArray(problems) && problems.length > 0
          ? problems
              .map(
                (problem) =>
                  `${(problem.path || []).join(".") || "(input)"}: ${
                    problem.explanation || problem.message
                  }`
              )
              .join("; ")
          : errDetail?.message;
      })
      .filter(Boolean)
      .join(" | ");
    if (detail) return detail;
  }
  return error?.message || "Unknown Shopify error";
};

module.exports = {
  shopify,
  auth: shopify.auth,
  session: shopify.session,
  RequestedTokenType,
  getGraphQLClient,
  getRestClient,
  extractGraphqlError,
};
