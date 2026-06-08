const crypto = require("crypto");
const { SHOPIFY_API_SECRET_KEY } = require("../config/constants");
const { errorResponse } = require("../utils/response");

const verifyShopifyWebhook = (req, res, next) => {
  try {
    const hmacHeader = req.headers["x-shopify-hmac-sha256"];
    const shop = req.headers["x-shopify-shop-domain"];
    const sharedSecret = SHOPIFY_API_SECRET_KEY;

    const rawBody = req.body;
    if (!rawBody) {
      return errorResponse(res, 400, "Please provide valid webhook data");
    }

    const generatedHash = crypto
      .createHmac("sha256", sharedSecret)
      .update(rawBody)
      .digest("base64");

    if (generatedHash !== hmacHeader) {
      console.warn(`Webhook HMAC validation failed for shop: ${shop}`);
      return errorResponse(res, 401, "Unauthorized webhook request");
    }

    next();
  } catch (error) {
    console.error("Failed to verify Shopify webhook:", error);
    return errorResponse(
      res,
      500,
      "Unable to verify webhook. Please try again.",
      error,
    );
  }
};

module.exports = verifyShopifyWebhook;
