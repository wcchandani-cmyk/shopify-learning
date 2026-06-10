const router = require("express").Router();
const sessionVerifier = require("../../middleware/sessionVerifier");
const {
  listCustomers,
  listCustomerTags,
  getCustomer,
  createCustomer,
  updateCustomer,
  listComments,
  createComment,
  deleteComment,
  deleteCustomers,
} = require("./controller");

router.get("/list", sessionVerifier, listCustomers);
// Must be registered before "/:id" so "tags" isn't treated as a customer id.
router.get("/tags", sessionVerifier, listCustomerTags);
router.post("/bulk-delete", sessionVerifier, deleteCustomers);

// Timeline comments for a customer.
router.get("/:id/comments", sessionVerifier, listComments);
router.post("/:id/comments", sessionVerifier, createComment);
router.delete("/:id/comments/:commentId", sessionVerifier, deleteComment);

router.get("/:id", sessionVerifier, getCustomer);
router.post("/", sessionVerifier, createCustomer);
router.put("/:id", sessionVerifier, updateCustomer);

module.exports = router;
