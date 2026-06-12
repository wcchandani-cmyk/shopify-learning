const router = require("express").Router();
const sessionVerifier = require("../../middleware/sessionVerifier");
const {
  listDiscounts,
  getMarkets,
  getSegments,
  getShippableCountries,
  createDiscount,
  getDiscount,
  updateDiscount,
  deleteDiscounts,
  listComments,
  createComment,
  deleteComment,
} = require("./controller");

router.get("/list", sessionVerifier, listDiscounts);
router.get("/markets", sessionVerifier, getMarkets);
router.get("/segments", sessionVerifier, getSegments);
router.get("/countries", sessionVerifier, getShippableCountries);
router.post("/delete", sessionVerifier, deleteDiscounts);
router.post("/", sessionVerifier, createDiscount);

// Timeline comments for a discount.
router.get("/:id/comments", sessionVerifier, listComments);
router.post("/:id/comments", sessionVerifier, createComment);
router.delete("/:id/comments/:commentId", sessionVerifier, deleteComment);

router.get("/:id", sessionVerifier, getDiscount);
router.put("/:id", sessionVerifier, updateDiscount);

module.exports = router;
