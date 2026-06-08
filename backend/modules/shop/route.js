const router = require("express").Router();
const sessionVerifier = require("../../middleware/sessionVerifier");
const { getShopDetails } = require("./controller");

router.get("/details", sessionVerifier, getShopDetails);

module.exports = router;
