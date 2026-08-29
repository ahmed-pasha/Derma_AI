const express = require("express");
const router = express.Router();
const { getDiseases, getDiseaseById } = require("../controllers/diseaseController");

router.get("/", getDiseases);
router.get("/:id", getDiseaseById);

module.exports = router;
