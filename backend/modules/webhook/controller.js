const { successResponse, errorResponse } = require("../../utils/response");
const { PROCESS_WEBHOOKS } = require("../../config/constants");
const Shop = require("../shop/model");
const Product = require("../product/model");
const Customer = require("../customer/model");
const Order = require("../order/model");
const {
  upsertProductWithVariants,
  mapWebhookProduct,
} = require("../product/productService");
const {
  mapRestCustomer,
  upsertCustomer,
} = require("../customer/customerService");
const {
  mapRestOrder,
  upsertOrder,
} = require("../order/orderService");
const { syncDiscountsFromShopify } = require("../discount/discountService");

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
  Shop.findOne({ where: { myshopifyDomain: shopDomain } });

const skipWebhookProcessing = () => !PROCESS_WEBHOOKS;

const resolveInstalledShop = async (req) => {
  const shopDomain = req.headers["x-shopify-shop-domain"];
  if (!shopDomain) return { shopDomain: null, shop: null };
  const shop = await Shop.findOne({
    where: { myshopifyDomain: shopDomain, appInstall: "1" },
  });
  return { shopDomain, shop };
};

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
        },
        {
          where: { id: shop.id },
        }
      );
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

const handleProductUpsert = (label) => async (req, res) => {
  try {
    if (skipWebhookProcessing()) {
      return res.status(200).send({ message: "webhooks disabled" });
    }

    const { shopDomain, shop } = await resolveInstalledShop(req);
    if (!shopDomain || !shop) {
      return res.status(200).send({ message: "ignored" });
    }

    const payload = parseWebhookPayload(req.body);
    const productNode = mapWebhookProduct(payload);
    if (productNode) {
      await upsertProductWithVariants(shop, productNode);
      console.log(
        `${label}: upserted product ${productNode.legacyResourceId} (${shopDomain})`
      );
    }

    return res.status(200).send({ message: "ok" });
  } catch (error) {
    console.error(`Webhooks ${label}:`, error);
    return res.status(200).send({ message: "ok" });
  }
};

exports.productCreate = handleProductUpsert("PRODUCTS_CREATE");
exports.productUpdate = handleProductUpsert("PRODUCTS_UPDATE");

exports.productDelete = async (req, res) => {
  try {
    if (skipWebhookProcessing()) {
      return res.status(200).send({ message: "webhooks disabled" });
    }

    const { shopDomain, shop } = await resolveInstalledShop(req);
    if (!shopDomain || !shop) {
      console.warn("PRODUCTS_DELETE: ignored (no shop domain / not installed)");
      return res.status(200).send({ message: "ignored" });
    }

    const payload = parseWebhookPayload(req.body);
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

const handleCustomerUpsert = (label) => async (req, res) => {
  try {
    if (skipWebhookProcessing()) {
      return res.status(200).send({ message: "webhooks disabled" });
    }

    const { shopDomain, shop } = await resolveInstalledShop(req);
    if (!shopDomain || !shop) {
      return res.status(200).send({ message: "ignored" });
    }

    const payload = parseWebhookPayload(req.body);
    const customerNode = mapRestCustomer(payload);
    if (customerNode) {
      const row = await upsertCustomer(shop, customerNode, {
        guardStale: true,
      });
      console.log(
        `${label}: ${row ? "upserted" : "skipped stale"} customer ${
          payload.id
        } (${shopDomain})`
      );
    }

    return res.status(200).send({ message: "ok" });
  } catch (error) {
    console.error(`Webhooks ${label}:`, error);
    return res.status(200).send({ message: "ok" });
  }
};

exports.customerCreate = handleCustomerUpsert("CUSTOMERS_CREATE");
exports.customerUpdate = handleCustomerUpsert("CUSTOMERS_UPDATE");

exports.customerDelete = async (req, res) => {
  try {
    if (skipWebhookProcessing()) {
      return res.status(200).send({ message: "webhooks disabled" });
    }

    const { shopDomain, shop } = await resolveInstalledShop(req);
    if (!shopDomain || !shop) {
      return res.status(200).send({ message: "ignored" });
    }

    const payload = parseWebhookPayload(req.body);
    const customerId = String(payload.id);
    const deleted = await Customer.destroy({
      where: { shopId: shop.id, shopifyId: customerId },
    });

    console.log(
      `CUSTOMERS_DELETE: customer ${customerId} (${shopDomain}) rows=${deleted}`
    );

    return res.status(200).send({ message: "ok" });
  } catch (error) {
    console.error("Webhooks customerDelete:", error);
    return res.status(200).send({ message: "ok" });
  }
};

const handleDiscountChange = (label) => async (req, res) => {
  try {
    if (skipWebhookProcessing()) {
      return res.status(200).send({ message: "webhooks disabled" });
    }

    const { shopDomain, shop } = await resolveInstalledShop(req);
    if (!shopDomain || !shop) {
      return res.status(200).send({ message: "ignored" });
    }

    if (label === "DISCOUNTS_DELETE") {
      const payload = parseWebhookPayload(req.body);
      const id = payload.id || (payload.admin_graphql_api_id && payload.admin_graphql_api_id.split("/").pop());
      if (id) {
        const { Op } = require("sequelize");
        const CustomDiscount = require("../customDiscount/model");
        await CustomDiscount.destroy({
          where: {
            shopId: shop.id,
            shopifyId: { [Op.like]: `%/${id}` }
          }
        });
      }
    }

    await syncDiscountsFromShopify(shop);
    console.log(`${label}: resynced discounts (${shopDomain})`);

    return res.status(200).send({ message: "ok" });
  } catch (error) {
    console.error(`Webhooks ${label}:`, error);
    return res.status(200).send({ message: "ok" });
  }
};

exports.discountCreate = handleDiscountChange("DISCOUNTS_CREATE");
exports.discountUpdate = handleDiscountChange("DISCOUNTS_UPDATE");
exports.discountDelete = handleDiscountChange("DISCOUNTS_DELETE");

const handleOrderUpsert = (label) => async (req, res) => {
  try {
    if (skipWebhookProcessing()) {
      return res.status(200).send({ message: "webhooks disabled" });
    }

    const { shopDomain, shop } = await resolveInstalledShop(req);
    if (!shopDomain || !shop) {
      return res.status(200).send({ message: "ignored" });
    }

    const payload = parseWebhookPayload(req.body);
    const mapped = await mapRestOrder(shop, payload);
    if (mapped) {
      await upsertOrder(shop, mapped);
      console.log(
        `${label}: upserted order ${payload.id} (${shopDomain})`
      );
    }

    return res.status(200).send({ message: "ok" });
  } catch (error) {
    console.error(`Webhooks ${label}:`, error);
    return res.status(200).send({ message: "ok" });
  }
};

exports.orderCreate = handleOrderUpsert("ORDERS_CREATE");
exports.orderUpdate = handleOrderUpsert("ORDERS_UPDATE");

exports.orderDelete = async (req, res) => {
  try {
    if (skipWebhookProcessing()) {
      return res.status(200).send({ message: "webhooks disabled" });
    }

    const { shopDomain, shop } = await resolveInstalledShop(req);
    if (!shopDomain || !shop) {
      return res.status(200).send({ message: "ignored" });
    }

    const payload = parseWebhookPayload(req.body);
    const orderId = String(payload.id);
    const deleted = await Order.destroy({
      where: { shopId: shop.id, shopifyId: orderId },
    });

    console.log(
      `ORDERS_DELETE: order ${orderId} (${shopDomain}) rows=${deleted}`
    );

    return res.status(200).send({ message: "ok" });
  } catch (error) {
    console.error("Webhooks orderDelete:", error);
    return res.status(200).send({ message: "ok" });
  }
};

