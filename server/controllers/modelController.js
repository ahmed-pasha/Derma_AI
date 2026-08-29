const asyncHandler = require("express-async-handler");
const mlService = require("../services/mlService");

// @route GET /api/model/status
const getStatus = asyncHandler(async (_req, res) => {
  try {
    const status = await mlService.getModelStatus();
    res.json({ success: true, ...status });
  } catch {
    res.json({
      success: true,
      model_loaded: false,
      status: "ML service unreachable. Start the Python service (ml/api/main.py).",
    });
  }
});

// @route GET /api/model/metrics
const getMetrics = asyncHandler(async (_req, res) => {
  try {
    const metrics = await mlService.getModelMetrics();
    res.json({ success: true, ...metrics });
  } catch {
    res.json({
      success: true,
      available: false,
      message: "Model status: Training required. Metrics unavailable.",
    });
  }
});

module.exports = { getStatus, getMetrics };
