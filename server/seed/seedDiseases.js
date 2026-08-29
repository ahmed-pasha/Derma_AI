// Run with: npm run seed  (from /server)
require("dotenv").config();
const connectDB = require("../config/db");
const Disease = require("../models/Disease");

const diseases = [
  {
    slug: "atopic-dermatitis",
    name: "Atopic Dermatitis",
    description:
      "Atopic Dermatitis (a common form of eczema) is a chronic inflammatory skin condition characterized by dry, itchy, and inflamed skin. It often begins in childhood but can affect people of any age, and tends to flare and improve over time.",
    symptoms: ["Dry skin", "Itching", "Redness", "Irritation", "Rash", "Skin thickening in long-standing areas"],
    causes: ["Environmental factors", "Irritants", "Allergens", "Dry weather", "Stress", "Genetic/family history"],
    treatment: {
      generalCare: [
        "Regular moisturizing (emollients)",
        "Lukewarm (not hot) showers",
        "Avoiding known irritants and triggers",
        "Gentle, fragrance-free cleansers",
      ],
      modernMedical: [
        "Topical treatment categories as prescribed by a clinician",
        "Moisturization / barrier repair therapy",
        "Anti-inflammatory topical options (clinician-guided)",
        "Medical consultation for persistent or severe cases",
      ],
      consultationNote: "Discuss treatment options with a qualified dermatologist or healthcare professional.",
    },
    ayurvedicInformation: {
      approaches: [
        "General traditional skin-care practices (e.g. use of natural emollients)",
        "Dietary and lifestyle considerations discussed with a practitioner",
        "Herbal topical approaches (evidence varies by formulation and individual)",
      ],
      note:
        "Evidence and suitability for Ayurvedic/traditional approaches can vary between individuals. Consult a qualified practitioner, especially before combining treatments with modern medication.",
    },
    prevention: [
      "Moisturize regularly, especially after bathing",
      "Identify and avoid personal triggers",
      "Use humidifiers in dry climates",
      "Wear breathable, soft fabrics",
      "Manage stress where possible",
    ],
    severityInformation: {
      mild: "Limited areas of dry or itchy skin with minimal impact on daily activities.",
      moderate: "More widespread redness and itching that may disrupt sleep or daily comfort.",
      severe: "Extensive, intense inflammation and itching that significantly affects quality of life; professional care is strongly recommended.",
    },
  },
];

(async () => {
  await connectDB();
  for (const d of diseases) {
    await Disease.findOneAndUpdate({ slug: d.slug }, d, { upsert: true, new: true });
    console.log(`Seeded: ${d.name}`);
  }
  console.log("Done.");
  process.exit(0);
})();
