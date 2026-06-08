const { successResponse, errorResponse } = require("../../utils/response");
const { PROCESS_WEBHOOKS } = require("../../config/constants");
const Shop = require("../shop/model");
const Product = require("../product/model");
const {
  upsertProductWithVariants,
  mapWebhookProduct,
} = require("../product/productService");

const parseWebhookPayload = (body) => {
  let payload = body;
  if (Buffer.isBuffer(payload)) {
    payload = JSON.parse(payload.toString("utf8"));
  } else if (typeof payload === "string") {
    payload = JSON.parse(payload);
  }
  return payload;
};

const getShopByDomain = async (shopDomain) =>
  Shop.findOne({
    where: { myshopifyDomain: shopDomain },
  });

exports.handleAppUninstalled = async (req, res) => {
  try {
    const shopDomain = req.get("X-Shopify-Shop-Domain");

    console.log(`Received APP_UNINSTALLED webhook from ${shopDomain}`);

    const shop = await getShopByDomain(shopDomain);

    if (shop) {
      await Shop.update(
        {
          recurringCharge: "0",
          chargeId: null,
          planType: "0",
          planInterval: "1",
          appInstall: "0",
        },
        {
          where: { id: shop.id },
        }
      );

      await Product.destroy({
        where: { shopId: shop.id },
      });
    }

    return successResponse(res, 200, "Webhook processed successfully");
  } catch (error) {
    console.error("Error processing app uninstalled webhook:", error);
    return errorResponse(
      res,
      500,
      "Unable to process webhook. Please try again.",
      error
    );
  }
};

const skipWebhookProcessing = () => !PROCESS_WEBHOOKS;

exports.productCreate = async (req, res) => {
  try {
    if (skipWebhookProcessing()) {
      return res.status(200).send({ message: "webhooks disabled" });
    }

    const shopDomain = req.headers["x-shopify-shop-domain"];
    if (!shopDomain) {
      return res.status(200).send({ message: "ignored" });
    }

    const payload = parseWebhookPayload(req.body);
    const shop = await Shop.findOne({
      where: { myshopifyDomain: shopDomain, appInstall: "1" },
    });

    if (!shop) {
      return res.status(200).send({ message: "ignored" });
    }

    const productNode = mapWebhookProduct(payload);
    if (productNode) {
      await upsertProductWithVariants(shop, productNode);
      console.log(
        `PRODUCTS_CREATE: upserted product ${productNode.legacyResourceId} (${shopDomain})`
      );
    }

    return res.status(200).send({ message: "ok" });
  } catch (error) {
    console.error("Webhooks productCreate:", error);
    return res.status(200).send({ message: "ok" });
  }
};

exports.productUpdate = async (req, res) => {
  try {
    if (skipWebhookProcessing()) {
      return res.status(200).send({ message: "webhooks disabled" });
    }

    const shopDomain = req.headers["x-shopify-shop-domain"];
    if (!shopDomain) {
      return res.status(200).send({ message: "ignored" });
    }

    const payload = parseWebhookPayload(req.body);
    const shop = await Shop.findOne({
      where: { myshopifyDomain: shopDomain, appInstall: "1" },
    });

    if (!shop) {
      return res.status(200).send({ message: "ignored" });
    }

    const productNode = mapWebhookProduct(payload);
    if (productNode) {
      await upsertProductWithVariants(shop, productNode);
      console.log(
        `PRODUCTS_UPDATE: upserted product ${productNode.legacyResourceId} (${shopDomain})`
      );
    }

    return res.status(200).send({ message: "ok" });
  } catch (error) {
    console.error("Webhooks productUpdate:", error);
    return res.status(200).send({ message: "ok" });
  }
};

exports.productDelete = async (req, res) => {
  try {
    if (skipWebhookProcessing()) {
      return res.status(200).send({ message: "webhooks disabled" });
    }

    const shopDomain = req.headers["x-shopify-shop-domain"];
    if (!shopDomain) {
      console.warn("PRODUCTS_DELETE: ignored (no shop domain header)");
      return res.status(200).send({ message: "ignored" });
    }

    const payload = parseWebhookPayload(req.body);
    const shop = await Shop.findOne({
      where: { myshopifyDomain: shopDomain, appInstall: "1" },
    });

    if (!shop) {
      console.warn(
        `PRODUCTS_DELETE: ignored (shop not found or not installed: ${shopDomain})`,
      );
      return res.status(200).send({ message: "ignored" });
    }

    const productId = String(payload.id);
    const deleted = await Product.destroy({
      where: { shopId: shop.id, shopifyId: productId },
    });

    console.log(
      `PRODUCTS_DELETE: product ${productId} (${shopDomain}) rows=${deleted}`
    );

    return res.status(200).send({ message: "ok" });
  } catch (error) {
    console.error("Webhooks productDelete:", error);
    return res.status(200).send({ message: "ok" });
  }
};
