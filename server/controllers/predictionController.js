const path = require("path");
const fs = require("fs");
const asyncHandler = require("express-async-handler");

const Prediction = require("../models/Prediction");
const Disease = require("../models/Disease");
const mlService = require("../services/mlService");

function calculateSeverity(clinicalData) {
  if (!clinicalData) return "mild";
  const scores = [
    clinicalData.itchingLevel || 0,
    clinicalData.redness || 0,
    clinicalData.dryness || 0,
  ];
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const duration = Number(clinicalData.durationDays) || 0;
  const hasHistory = clinicalData.previousDiagnosis;

  let severityScore = avg;
  if (duration > 30) severityScore += 2;
  else if (duration > 14) severityScore += 1;
  if (hasHistory) severityScore += 1;
  if (clinicalData.symptoms?.length > 3) severityScore += 1;

  if (severityScore >= 6) return "severe";
  if (severityScore >= 3) return "moderate";
  return "mild";
}

async function findDiseaseInfo(conditionName) {
  if (!conditionName) return null;
  const name = conditionName.toLowerCase().trim();

  const slugGuess = name
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-");

  let disease = await Disease.findOne({ slug: slugGuess });
  if (disease) return disease;

  disease = await Disease.findOne({ name: new RegExp(`^${conditionName}$`, "i") });
  if (disease) return disease;

  disease = await Disease.findOne({ name: new RegExp(name, "i") });
  if (disease) return disease;

  disease = await Disease.findOne({ slug: new RegExp(name.replace(/\s+/g, ".*"), "i") });
  return disease;
}

const createPrediction = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Please provide a skin image (JPG, PNG, or WEBP).");
  }

  let clinicalData = {};
  try {
    clinicalData = req.body.clinicalData
      ? JSON.parse(req.body.clinicalData)
      : {};
  } catch {
    res.status(400);
    throw new Error("clinicalData must be valid JSON.");
  }

  let mlResult;

  try {
    console.log("\n========== ML PREDICTION REQUEST ==========");
    console.log("[DermaAI] Uploaded image:", req.file.path);

    mlResult = await mlService.getPrediction({
      imagePath: req.file.path,
      clinicalData,
    });

    console.log("[DermaAI] ML prediction successful:", JSON.stringify(mlResult, null, 2));
    console.log("===========================================\n");
  } catch (err) {
    console.error("\n========== ML SERVICE ERROR ==========");
    console.error("[DermaAI] Message:", err.message);
    console.error("======================================\n");

    fs.unlink(req.file.path, () => {});

    res.status(502);
    throw new Error(
      `Unable to analyze the image. ML service error: ${err.message}`
    );
  }

  const imageUrl = `/uploads/${path.basename(req.file.path)}`;
  const severity = calculateSeverity(clinicalData);
  const topPredictions = (mlResult.top_predictions || []).map((p) => ({
    condition: p.condition,
    confidence: p.confidence,
  }));

  const prediction = await Prediction.create({
    userId: req.user._id,
    imageUrl,
    condition: mlResult.condition,
    confidence: mlResult.confidence,
    severity,
    topPredictions,
    isLowConfidence: !!mlResult.is_low_confidence,
    modelVersion: mlResult.model_version || "unknown",
    demoMode: !!mlResult.demo_mode,
    clinicalData,
    errorMessage: mlResult.error || null,
  });

  const diseaseInfo = await findDiseaseInfo(mlResult.condition);

  res.status(201).json({
    success: true,
    prediction,
    diseaseInfo: diseaseInfo || null,
  });
});

const getPredictions = asyncHandler(async (req, res) => {
  const predictions = await Prediction.find({
    userId: req.user._id,
  }).sort({ createdAt: -1 });

  res.json({ success: true, count: predictions.length, predictions });
});

const getPredictionById = asyncHandler(async (req, res) => {
  const prediction = await Prediction.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!prediction) {
    res.status(404);
    throw new Error("Prediction not found.");
  }

  const diseaseInfo = await findDiseaseInfo(prediction.condition);

  res.json({ success: true, prediction, diseaseInfo: diseaseInfo || null });
});

const deletePrediction = asyncHandler(async (req, res) => {
  const prediction = await Prediction.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!prediction) {
    res.status(404);
    throw new Error("Prediction not found.");
  }

  res.json({ success: true, message: "Prediction deleted." });
});

module.exports = {
  createPrediction,
  getPredictions,
  getPredictionById,
  deletePrediction,
};
