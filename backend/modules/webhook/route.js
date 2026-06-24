const express = require("express");
const verifyShopifyWebhook = require("../../middleware/webhookVerifier");
const {
  handleAppUninstalled,
  productCreate,
  productUpdate,
  productDelete,
  customerCreate,
  customerUpdate,
  customerDelete,
  discountCreate,
  discountUpdate,
  discountDelete,
  orderCreate,
  orderUpdate,
  orderDelete,
} = require("./controller");

const router = express.Router();
const rawJson = express.raw({ type: "application/json" });

router.post(
  "/app/uninstalled",
  rawJson,
  verifyShopifyWebhook,
  handleAppUninstalled
);
router.post("/products/create", rawJson, verifyShopifyWebhook, productCreate);
router.post("/products/update", rawJson, verifyShopifyWebhook, productUpdate);
router.post("/products/delete", rawJson, verifyShopifyWebhook, productDelete);

router.post("/customers/create", rawJson, verifyShopifyWebhook, customerCreate);
router.post("/customers/update", rawJson, verifyShopifyWebhook, customerUpdate);
router.post("/customers/delete", rawJson, verifyShopifyWebhook, customerDelete);

router.post("/discounts/create", rawJson, verifyShopifyWebhook, discountCreate);
router.post("/discounts/update", rawJson, verifyShopifyWebhook, discountUpdate);
router.post("/discounts/delete", rawJson, verifyShopifyWebhook, discountDelete);

router.post("/orders/create", rawJson, verifyShopifyWebhook, orderCreate);
router.post("/orders/update", rawJson, verifyShopifyWebhook, orderUpdate);
router.post("/orders/delete", rawJson, verifyShopifyWebhook, orderDelete);

module.exports = router;
