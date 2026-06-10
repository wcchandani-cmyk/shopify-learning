const router = require("express").Router();
const sessionVerifier = require("../../middleware/sessionVerifier");
const { getShopDetails, listLocales } = require("./controller");

router.get("/details", sessionVerifier, getShopDetails);
router.get("/locales", sessionVerifier, listLocales);

module.exports = router;
