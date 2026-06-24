const router = require("express").Router();
const sessionVerifier = require("../../middleware/sessionVerifier");
const { getShopDetails, listLocales, listCurrencies } = require("./controller");

router.get("/details", sessionVerifier, getShopDetails);
router.get("/locales", sessionVerifier, listLocales);
router.get("/currencies", sessionVerifier, listCurrencies);

module.exports = router;
