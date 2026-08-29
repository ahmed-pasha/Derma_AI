# DermaAI — Architecture Overview

```text
React (client/)
   │  REST calls (JSON + multipart)
   ▼
Node.js / Express (server/)
   │  - Auth (JWT, bcrypt)
   │  - Mongoose models (User, Prediction, Chat, Disease)
   │  - Multer upload handling
   │  - Forwards image + clinical data to ML service
   ▼
Python FastAPI ML Service (ml/api/main.py)
   │  - Loads real trained model if available and DEMO_MODE=false
   │  - Otherwise returns a clearly-labeled demo prediction
   ▼
TensorFlow/Keras Multimodal Model
   (CNN image features + encoded clinical features → fusion → 2 heads:
    disease classification, severity classification)
   │
   ▼
Prediction JSON  →  Node.js  →  MongoDB (Prediction collection)  →  React UI
```

## Data flow for a single analysis

1. User captures (camera) or uploads (file) a skin image in the React app.
2. User fills in the Clinical Information form (age, symptoms, itching/redness/dryness, etc).
3. React sends `POST /api/predict` (multipart: `image`, `clinicalData` JSON string) with the JWT cookie/bearer token.
4. Express `predictionController.createPrediction`:
   - validates the authenticated user and uploaded file (via `multer` + `upload.js` middleware),
   - calls `services/mlService.js`, which forwards the image + clinical data to the FastAPI service,
   - persists the returned prediction (condition, confidence, severity, severityScore, clinicalData, modelVersion, demoMode) to MongoDB.
5. React redirects to `/results/:id` and renders the stored prediction via `GET /api/predictions/:id`.

## Auth flow

- `POST /api/auth/register` / `POST /api/auth/login` issue a JWT, set as an httpOnly cookie AND returned in the JSON body (also cached in `localStorage` client-side as a fallback bearer token for environments where cookies are awkward, e.g. some mobile webviews).
- `middleware/auth.js` `protect` reads the cookie or `Authorization: Bearer` header, verifies the JWT, and attaches `req.user`.
- All prediction/chat routes are scoped to `req.user._id` — a user can never read another user's predictions or chat history.
