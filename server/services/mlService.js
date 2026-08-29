const fs = require("fs");
const fetch = require("node-fetch");
const FormData = require("form-data");

const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

/**
 * Sends an image + clinical data to the Python FastAPI ML service and
 * returns its prediction. Throws if the ML service is unreachable so the
 * caller can surface a clear error instead of silently faking a result.
 *
 * Expected response shape:
 *   { condition, confidence, top_predictions, is_low_confidence,
 *     model_version, demo_mode, error? }
 */
async function getPrediction({ imagePath, clinicalData = {} }) {
  const form = new FormData();
  form.append("image", fs.createReadStream(imagePath));
  form.append("clinicalData", JSON.stringify(clinicalData));

  console.log(`[DermaAI] Calling ML service: ${ML_SERVICE_URL}/predict`);

  const response = await fetch(`${ML_SERVICE_URL}/predict`, {
    method: "POST",
    body: form,
    headers: form.getHeaders(),
    timeout: 60000,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error(
      `[DermaAI] ML service returned ${response.status}: ${errorText}`
    );
    throw new Error(
      `ML service error (${response.status}): ${errorText || "unable to analyze the image"}`
    );
  }

  return response.json();
}

/**
 * Query the Python ML service for model status.
 */
async function getModelStatus() {
  const response = await fetch(`${ML_SERVICE_URL}/status`, {
    timeout: 10000,
  });
  if (!response.ok) {
    throw new Error(`ML service status check failed (${response.status})`);
  }
  return response.json();
}

/**
 * Query the Python ML service for evaluation metrics.
 */
async function getModelMetrics() {
  const response = await fetch(`${ML_SERVICE_URL}/metrics`, {
    timeout: 10000,
  });
  if (!response.ok) {
    throw new Error(`ML service metrics check failed (${response.status})`);
  }
  return response.json();
}

module.exports = { getPrediction, getModelStatus, getModelMetrics };
