const router = require("express").Router();
const sessionVerifier = require("../../middleware/sessionVerifier");
const {
  listOrders,
  getOrder,
  createOrder,
  cancelOrder,
  listComments,
  createComment,
  deleteComment,
  updateOrder,
  listPaymentTerms,
} = require("./controller");

router.get("/list", sessionVerifier, listOrders);
router.get("/payment-terms", sessionVerifier, listPaymentTerms);
router.post("/:id/cancel", sessionVerifier, cancelOrder);

router.get("/:id/comments", sessionVerifier, listComments);
router.post("/:id/comments", sessionVerifier, createComment);
router.delete("/:id/comments/:commentId", sessionVerifier, deleteComment);

router.get("/:id", sessionVerifier, getOrder);
router.put("/:id", sessionVerifier, updateOrder);
router.post("/", sessionVerifier, createOrder);

module.exports = router;
