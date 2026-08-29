const express = require("express");
const router = express.Router();
const { upload } = require("../middleware/upload");
const { protect } = require("../middleware/auth");
const {
  createPrediction,
  getPredictions,
  getPredictionById,
  deletePrediction,
} = require("../controllers/predictionController");

router.post("/predict", protect, upload.single("image"), createPrediction);
router.get("/predictions", protect, getPredictions);
router.get("/predictions/:id", protect, getPredictionById);
router.delete("/predictions/:id", protect, deletePrediction);

module.exports = router;
