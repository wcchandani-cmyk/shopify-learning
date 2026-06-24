const { session } = require("../utils/shopify");
const { errorResponse } = require("../utils/response");

const sessionVerifier = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  try {
    if (!authHeader) {
      errorResponse(res, 401, "Please provide authorization credentials");
      return;
    }

    const bearerRegex = /^Bearer\s+(.+)$/;
    const match = authHeader.match(bearerRegex);
    if (!match) {
      errorResponse(res, 401, "Please provide a valid authorization token");
      return;
    }

    const token = match[1].trim();
    if (!token) {
      errorResponse(res, 401, "Please provide a valid session token");
      return;
    }

    const tokenPayload = await session.decodeSessionToken(token);
    if (!tokenPayload || !tokenPayload.dest) {
      errorResponse(res, 401, "Invalid session token. Please try again.");
      return;
    }

    req.sessionToken = token;
    req.shopDomain = new URL(tokenPayload.dest).hostname;

    const { resolveShopForApi, isShopifyUnauthorized } = require("../utils/shopAccess");
    try {
      req.shop = await resolveShopForApi(req.shopDomain, req.sessionToken);
    } catch (shopError) {
      if (isShopifyUnauthorized(shopError)) {
        errorResponse(
          res,
          401,
          "Shopify session expired. Reload the app from Shopify admin and try again.",
          shopError
        );
        return;
      }
      const status = shopError.statusCode || 500;
      errorResponse(res, status, shopError.message || "Failed to resolve shop", shopError);
      return;
    }

    next();
  } catch (error) {
    if (error.message?.includes("JWT")) {
      errorResponse(res, 401, "Invalid session token. Please log in again.");
      return;
    }

    if (
      error.message?.includes("expired") ||
      error.message?.includes("exp") ||
      error.message?.includes("timestamp check failed")
    ) {
      errorResponse(
        res,
        401,
        "Your session has expired. Please log in again.",
      );
      return;
    }

    if (error.message?.includes("signature")) {
      errorResponse(res, 401, "Invalid session token. Please log in again.");
      return;
    }

    console.error("Session verification error:", error);
    errorResponse(res, 401, "Unable to verify session. Please try again.", error);
  }
};

module.exports = sessionVerifier;
