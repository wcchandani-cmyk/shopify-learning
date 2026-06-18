const router = require("express").Router();
const sessionVerifier = require("../../middleware/sessionVerifier");
const {
  listDefinitions,
  createDefinition,
  updateDefinition,
  deleteDefinition,
  getMetafields,
  saveMetafields,
  getMetafieldTypes,
} = require("./controller");

router.get("/definitions", sessionVerifier, listDefinitions);
router.post("/definitions", sessionVerifier, createDefinition);
router.put("/definitions/:id", sessionVerifier, updateDefinition);
router.delete("/definitions/:id", sessionVerifier, deleteDefinition);
router.get("/types", sessionVerifier, getMetafieldTypes);

router.get("/values", sessionVerifier, getMetafields);
router.post("/values", sessionVerifier, saveMetafields);

module.exports = router;
