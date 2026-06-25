const { session } = require("../utils/shopify");
const { errorResponse } = require("../utils/response");

const sessionVerifier = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return errorResponse(res, 401, "Please provide authorization credentials");

  const match = authHeader.match(/^Bearer\s+(.+)$/);
  if (!match)
    return errorResponse(
      res,
      401,
      "Please provide a valid authorization token"
    );

  const token = match[1].trim();
  if (!token)
    return errorResponse(res, 401, "Please provide a valid session token");

  try {
    const tokenPayload = await session.decodeSessionToken(token);
    if (!tokenPayload || !tokenPayload.dest)
      return errorResponse(
        res,
        401,
        "Invalid session token. Please try again."
      );

    req.sessionToken = token;
    req.shopDomain = new URL(tokenPayload.dest).hostname;

    const {
      resolveShopForApi,
      isShopifyUnauthorized,
    } = require("../utils/shopAccess");
    try {
      req.shop = await resolveShopForApi(req.shopDomain, req.sessionToken);
    } catch (shopError) {
      if (isShopifyUnauthorized(shopError)) {
        return errorResponse(
          res,
          401,
          "Shopify session expired. Reload the app from Shopify admin and try again.",
          shopError
        );
      }
      return errorResponse(
        res,
        shopError.statusCode || 500,
        shopError.message || "Failed to resolve shop",
        shopError
      );
    }
    next();
  } catch (error) {
    const msg = error.message || "";
    if (msg.includes("JWT") || msg.includes("signature")) {
      return errorResponse(
        res,
        401,
        "Invalid session token. Please log in again."
      );
    }
    if (
      msg.includes("expired") ||
      msg.includes("exp") ||
      msg.includes("timestamp check failed")
    ) {
      return errorResponse(
        res,
        401,
        "Your session has expired. Please log in again."
      );
    }
    console.error("Session verification error:", error);
    errorResponse(
      res,
      401,
      "Unable to verify session. Please try again.",
      error
    );
  }
};

module.exports = sessionVerifier;
