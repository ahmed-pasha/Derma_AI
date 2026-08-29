const mongoose = require("mongoose");

const ClinicalDataSchema = new mongoose.Schema(
  {
    age: Number,
    symptoms: [String],
    medicalHistory: String,
    durationDays: Number,
    itchingLevel: { type: Number, min: 0, max: 10 },
    redness: { type: Number, min: 0, max: 10 },
    dryness: { type: Number, min: 0, max: 10 },
    skinArea: String,
    previousDiagnosis: { type: Boolean, default: false },
  },
  { _id: false }
);

const TopPredictionSchema = new mongoose.Schema(
  {
    condition: { type: String, required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
  },
  { _id: false }
);

const PredictionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    imageUrl: { type: String, required: true },
    condition: { type: String, required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    severity: { type: String, enum: ["mild", "moderate", "severe"], default: "mild" },
    topPredictions: { type: [TopPredictionSchema], default: [] },
    isLowConfidence: { type: Boolean, default: false },
    modelVersion: { type: String, default: "unknown" },
    demoMode: { type: Boolean, default: false },
    clinicalData: ClinicalDataSchema,
    errorMessage: { type: String, default: null },
  },
  { timestamps: true }
);

PredictionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Prediction", PredictionSchema);
