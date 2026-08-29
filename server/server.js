require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const predictionRoutes = require("./routes/predictionRoutes");
const diseaseRoutes = require("./routes/diseaseRoutes");
const chatRoutes = require("./routes/chatRoutes");
const modelRoutes = require("./routes/modelRoutes");

connectDB();

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Basic rate limiting on auth + prediction endpoints to reduce abuse risk
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use("/api/", apiLimiter);

// Serve uploaded images (uploads/ dir is outside server/ per project structure)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (_req, res) => res.json({ success: true, service: "DermaAI API", status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api", predictionRoutes); // exposes /api/predict, /api/predictions...
app.use("/api/diseases", diseaseRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/model", modelRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[DermaAI] API server running on port ${PORT}`));
