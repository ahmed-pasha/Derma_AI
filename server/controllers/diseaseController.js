const asyncHandler = require("express-async-handler");
const Disease = require("../models/Disease");

// @route GET /api/diseases
const getDiseases = asyncHandler(async (_req, res) => {
  const diseases = await Disease.find().select("slug name description");
  res.json({ success: true, diseases });
});

// @route GET /api/diseases/:id  (id can be slug or ObjectId)
const getDiseaseById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const disease = await Disease.findOne({ $or: [{ slug: id }, { _id: id.match(/^[0-9a-f]{24}$/) ? id : null }] });
  if (!disease) {
    res.status(404);
    throw new Error("Disease information not found.");
  }
  res.json({ success: true, disease });
});

module.exports = { getDiseases, getDiseaseById };
