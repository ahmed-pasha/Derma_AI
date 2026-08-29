const express = require("express");
const router = express.Router();
const { getStatus, getMetrics } = require("../controllers/modelController");

router.get("/status", getStatus);
router.get("/metrics", getMetrics);

module.exports = router;
