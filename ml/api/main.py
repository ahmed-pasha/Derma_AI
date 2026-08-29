"""
DermaAI ML inference microservice (FastAPI, PyTorch).

Run from the ml/ directory:
    pip install -r requirements.txt
    python -m uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload

Endpoints:
    GET  /health   — service health check
    GET  /status   — model loaded? version? num_classes?
    GET  /metrics  — real evaluation metrics from ml/results/metrics.json
    POST /predict  — multipart form: image (file) + clinicalData (JSON string)
"""

import json
import os
import shutil
import sys
import tempfile

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Ensure ml/ is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from inference.predict import model_available, predict_with_fallback, _load_model, _class_names
from training import config

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

DEMO_MODE = os.environ.get("DEMO_MODE", "true").lower() == "true"

app = FastAPI(
    title="DermaAI ML Service",
    version=config.MODEL_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Load the trained model once at application startup."""
    if model_available():
        try:
            _load_model()
            print("[startup] Model loaded successfully.")
        except Exception as e:
            print(f"[startup] WARNING: Could not load model: {e}")
            print("[startup] Predictions will return 'unavailable' until model is loaded.")
    else:
        print(f"[startup] No trained model found at {config.BEST_MODEL_PATH}.")
        print("[startup] Train the model first: python -m training.train")


@app.get("/health")
def health():
    return {"status": "ok", "service": "DermaAI ML Service"}


@app.get("/status")
def status():
    has_model = model_available()

    # Dynamic num_classes: from loaded model if available, else 0
    from inference.predict import _class_names as loaded_classes
    num_classes = len(loaded_classes) if loaded_classes else 0

    return {
        "model_loaded": has_model and not DEMO_MODE,
        "demo_mode": DEMO_MODE or not has_model,
        "model_version": config.MODEL_VERSION if has_model else "none",
        "num_classes": num_classes,
        "backbone": config.BACKBONE_NAME,
        "status": (
            "Trained model loaded and ready for inference."
            if (has_model and not DEMO_MODE)
            else "No trained model found. Train the model first."
            if not has_model
            else "Model found, but DEMO_MODE=true is set in .env."
        ),
    }


@app.get("/metrics")
def metrics():
    if not os.path.exists(config.METRICS_PATH):
        return {
            "available": False,
            "message": "No trained model metrics found. Train and evaluate the model first.",
        }
    with open(config.METRICS_PATH) as f:
        data = json.load(f)
    return {"available": True, **data}


@app.post("/predict")
async def predict_endpoint(
    image: UploadFile = File(...),
    clinicalData: str = Form("{}"),
):
    """Accept an image and return a skin disease prediction (dynamic class count)."""
    allowed_types = ("image/jpeg", "image/png", "image/webp")
    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload JPG, PNG, or WEBP.",
        )

    try:
        clinical = json.loads(clinicalData)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="clinicalData must be valid JSON.")

    # Save uploaded file to a temporary location
    suffix = ".jpg"
    if image.content_type == "image/png":
        suffix = ".png"
    elif image.content_type == "image/webp":
        suffix = ".webp"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(image.file, tmp)
        tmp_path = tmp.name

    try:
        result = predict_with_fallback(tmp_path, clinical)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to analyze the image: {e}",
        )
    finally:
        os.unlink(tmp_path)

    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=int(os.environ.get("ML_PORT", 8000)),
    )
