const router = require("express").Router();
const sessionVerifier = require("../../middleware/sessionVerifier");
const { getAll, getById, getPublic, create, update, deleted } = require("./controller");

router.get("/public", getPublic);

router.get("/", sessionVerifier, getAll);
router.get("/:id", sessionVerifier, getById);
router.post("/", sessionVerifier, create);
router.put("/:id", sessionVerifier, update);
router.delete("/:id", sessionVerifier, deleted);

module.exports = router;
