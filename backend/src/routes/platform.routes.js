const express = require("express");
const platformController = require("../controllers/platformController");

const router = express.Router();

router.get("/categories", platformController.getCategories);
router.get("/settings", platformController.getSettings);

module.exports = router;
