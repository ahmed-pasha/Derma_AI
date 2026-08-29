const mongoose = require("mongoose");

const DiseaseSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    symptoms: [String],
    causes: [String], // triggers
    treatment: {
      generalCare: [String],
      modernMedical: [String],
      consultationNote: {
        type: String,
        default: "Discuss treatment options with a qualified dermatologist or healthcare professional.",
      },
    },
    ayurvedicInformation: {
      approaches: [String],
      note: {
        type: String,
        default:
          "Evidence and suitability for traditional/Ayurvedic approaches can vary between individuals. Consult a qualified practitioner, especially before combining treatments.",
      },
    },
    prevention: [String],
    severityInformation: {
      mild: String,
      moderate: String,
      severe: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Disease", DiseaseSchema);
