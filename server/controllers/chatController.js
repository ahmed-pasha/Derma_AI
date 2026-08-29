const asyncHandler = require("express-async-handler");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Chat = require("../models/Chat");
const Disease = require("../models/Disease");

const DISCLAIMER =
  "\n\n*Disclaimer: DermaAI provides educational information only. This is not a substitute for professional medical diagnosis or treatment. Always consult a qualified dermatologist.*";

const SYSTEM_PROMPT = `You are DermaAI Assistant — a knowledgeable, empathetic dermatology AI chatbot. Your role is to help patients understand skin conditions, guide them on precautions, skincare routines, medications, and when to seek professional help.

RULES:
1. You are NOT a doctor. Never diagnose. Never prescribe. Always recommend consulting a dermatologist for personalized medical advice.
2. Be warm, empathetic, and conversational. Use a friendly but professional tone.
3. Provide accurate, evidence-based dermatology information.
4. When discussing medications, mention them as general categories or examples — never as prescriptions. Always add: "Please consult your dermatologist before starting any medication."
5. If a user describes an emergency (e.g., rapid swelling, difficulty breathing, widespread rash with fever), urge them to seek immediate medical attention.
6. Use structured formatting: bullet points, numbered lists, and clear sections to make information easy to read.
7. Keep responses concise but thorough — aim for helpful, actionable advice.
8. If you don't know something specific, be honest and recommend the user consult a healthcare professional.
9. Always end responses with a brief reminder to consult a dermatologist when discussing medical topics.

AREAS OF EXPERTISE:
- Skin conditions: acne, eczema, psoriasis, dermatitis, fungal infections, rosacea, vitiligo, hyperpigmentation, skin cancer awareness, hives, warts, etc.
- Skincare routines: cleansing, moisturizing, sun protection, ingredient recommendations
- Precautions: sun safety, allergen avoidance, wound care, hygiene
- Medications: general information about topical treatments (retinoids, antibiotics, antifungals, corticosteroids), oral medications, when to consider them
- Lifestyle: diet impacts on skin, stress management, sleep hygiene
- When to see a dermatologist: red flags, chronic conditions, new or changing lesions

TONE: Like a knowledgeable friend who happens to be a dermatology expert — approachable, reassuring, but never dismissive of concerns.`;

let genAI = null;
let model = null;

function initGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return false;
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      systemInstruction: SYSTEM_PROMPT,
    });
    return true;
  } catch (err) {
    console.error("Failed to initialize Gemini:", err.message);
    return false;
  }
}

function geminiReady() {
  return !!model;
}

/**
 * Build a reply using Gemini API with conversation history.
 * Falls back to rule-based replies if Gemini is not configured.
 */
async function buildReply(message, context, conversationHistory = []) {
  if (!geminiReady()) {
    return buildRuleBasedReply(message, context);
  }

  try {
    const chat = model.startChat({
      history: conversationHistory.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.text }],
      })),
    });

    let userMessage = message;

    if (context && context.condition) {
      userMessage += `\n\n[Patient's latest analysis: Condition: ${context.condition}, Severity: ${context.severity}, Confidence: ${(context.confidence * 100).toFixed(1)}%]`;
    }

    const result = await chat.sendMessage(userMessage);
    const response = result.response;
    return response.text() + DISCLAIMER;
  } catch (err) {
    console.error("Gemini API error:", err.message);
    return buildRuleBasedReply(message, context);
  }
}

/**
 * Fallback rule-based responder when Gemini API is unavailable.
 */
async function buildRuleBasedReply(message, context) {
  const m = message.toLowerCase();
  const ad = await Disease.findOne({ slug: "atopic-dermatitis" });

  if (/what is atopic dermatitis|what.*ad\b/.test(m) && ad) {
    return `${ad.description}${DISCLAIMER}`;
  }
  if (/symptom/.test(m) && ad) {
    return `Common symptoms include: ${ad.symptoms.join(", ")}. If symptoms are severe or worsening, please see a dermatologist.${DISCLAIMER}`;
  }
  if (/trigger|cause/.test(m) && ad) {
    return `Common triggers include: ${ad.causes.join(", ")}. Triggers vary between individuals.${DISCLAIMER}`;
  }
  if (/moderate severity|what does moderate mean|severity/.test(m) && ad) {
    return `Severity is generally described as:\n- Mild: ${ad.severityInformation.mild}\n- Moderate: ${ad.severityInformation.moderate}\n- Severe: ${ad.severityInformation.severe}${DISCLAIMER}`;
  }
  if (/skin.?care|prevent/.test(m) && ad) {
    return `General skin-care practices include: ${ad.prevention.join(", ")}.${DISCLAIMER}`;
  }
  if (/dermatologist|see a doctor|when should i/.test(m)) {
    return `Consider seeing a dermatologist if symptoms are severe, spreading, not improving with general care, affecting sleep or daily life, or if you're unsure about a diagnosis.${DISCLAIMER}`;
  }
  if (/treatment|medicine|cure|medication/.test(m) && ad) {
    return `General treatment categories include: ${ad.treatment.modernMedical.join(", ")}. ${ad.treatment.consultationNote}${DISCLAIMER}`;
  }
  if (context && context.condition) {
    return `Your most recent analysis noted "${context.condition}" with severity "${context.severity}" (confidence ${(context.confidence * 100).toFixed(1)}%). This is an AI-assisted estimate, not a clinical diagnosis — a dermatologist can confirm this properly.${DISCLAIMER}`;
  }
  return `I can share general information about skin conditions — symptoms, triggers, severity, and skin-care practices. Could you tell me more about what you'd like to know?${DISCLAIMER}`;
}

// @route POST /api/chat  { message, context? }
const postMessage = asyncHandler(async (req, res) => {
  const { message, context } = req.body;
  if (!message || !message.trim()) {
    res.status(400);
    throw new Error("Message cannot be empty.");
  }

  // Load existing conversation history for multi-turn context
  let chat = await Chat.findOne({ userId: req.user._id });
  if (!chat) chat = await Chat.create({ userId: req.user._id, messages: [] });

  // Build conversation history for Gemini (last 20 messages for context window)
  const conversationHistory = chat.messages.slice(-20);

  const reply = await buildReply(message, context, conversationHistory);

  chat.messages.push({ role: "user", text: message });
  chat.messages.push({ role: "assistant", text: reply });
  await chat.save();

  res.json({ success: true, reply });
});

// @route GET /api/chat/history
const getHistory = asyncHandler(async (req, res) => {
  const chat = await Chat.findOne({ userId: req.user._id });
  res.json({ success: true, messages: chat ? chat.messages : [] });
});

// @route DELETE /api/chat/history
const clearHistory = asyncHandler(async (req, res) => {
  await Chat.findOneAndUpdate(
    { userId: req.user._id },
    { messages: [] },
    { upsert: true }
  );
  res.json({ success: true, message: "Conversation cleared." });
});

// Initialize Gemini on module load (non-blocking)
initGemini();

module.exports = { postMessage, getHistory, clearHistory };
