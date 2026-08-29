const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { postMessage, getHistory, clearHistory } = require("../controllers/chatController");

router.post("/", protect, postMessage);
router.get("/history", protect, getHistory);
router.delete("/history", protect, clearHistory);

module.exports = router;
