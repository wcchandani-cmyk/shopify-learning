const express = require("express");
const verifyShopifyWebhook = require("../../middleware/webhookVerifier");
const {
  handleAppUninstalled,
  productCreate,
  productUpdate,
  productDelete,
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

module.exports = router;
