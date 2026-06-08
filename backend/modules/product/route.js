const router = require("express").Router();
const sessionVerifier = require("../../middleware/sessionVerifier");
const {
  listProducts,
  listProductTypes,
  listProductVendors,
  searchTaxonomy,
  getProduct,
  createProduct,
  updateProduct,
  deleteProducts,
} = require("./controller");

router.get("/list", sessionVerifier, listProducts);
router.get("/product-types", sessionVerifier, listProductTypes);
router.get("/product-vendors", sessionVerifier, listProductVendors);
router.get("/taxonomy", sessionVerifier, searchTaxonomy);
router.post("/bulk-delete", sessionVerifier, deleteProducts);
router.post("/", sessionVerifier, createProduct);
router.get("/:id", sessionVerifier, getProduct);
router.put("/:id", sessionVerifier, updateProduct);

module.exports = router;
