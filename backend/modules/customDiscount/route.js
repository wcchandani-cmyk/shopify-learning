const router = require("express").Router();
const sessionVerifier = require("../../middleware/sessionVerifier");
const {
  listCustomDiscounts,
  getCustomDiscount,
  createCustomDiscount,
  updateCustomDiscount,
  deleteCustomDiscounts,
  toggleDiscountStatus,
} = require("./controller");

router.get("/list", sessionVerifier, listCustomDiscounts);
router.post("/delete", sessionVerifier, deleteCustomDiscounts);
router.post("/", sessionVerifier, createCustomDiscount);
router.get("/:id", sessionVerifier, getCustomDiscount);
router.put("/:id", sessionVerifier, updateCustomDiscount);
router.patch("/:id/status", sessionVerifier, toggleDiscountStatus);

module.exports = router;
