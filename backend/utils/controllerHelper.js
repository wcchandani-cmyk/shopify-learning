const { errorResponse } = require("./response");
const { isShopifyUnauthorized } = require("./shopAccess");
const { extractGraphqlError } = require("./shopify");

const parsePageSize = (value, defaultSize = 25, maxSize = 100) =>
  Math.min(
    maxSize,
    Math.max(1, parseInt(value, 10) || defaultSize)
  );

const handleError = (res, error, fallback, unauthorizedMessage) => {
  if (isShopifyUnauthorized(error)) {
    return errorResponse(
      res,
      401,
      unauthorizedMessage || "Shopify session expired. Reload the app from Shopify admin and try again.",
      error
    );
  }
  const gqlDetail = extractGraphqlError(error);
  const message = (gqlDetail === "Unknown Shopify error") ? fallback : (gqlDetail || fallback);
  const status = error.statusCode || 500;
  return errorResponse(res, status, message, error);
};

module.exports = {
  parsePageSize,
  handleError,
};
