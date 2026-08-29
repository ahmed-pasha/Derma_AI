"""
Inference module for DermaAI skin disease classifier.

Loads the trained PyTorch model once and serves predictions.  The number
of classes is read dynamically from the model checkpoint.  If no trained
model is available, raises a clear error — it NEVER fabricates results.
"""

import json
import os
import sys

import torch
from PIL import Image

# Ensure ml/ is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from training import config
from training.dataset import get_eval_transforms, load_class_names
from training.train import build_model

_model = None
_class_names = None
_model_version = None


def model_available() -> bool:
    """Check whether a trained model checkpoint exists."""
    return os.path.exists(config.BEST_MODEL_PATH)


def _load_model():
    """
    Load the trained model into memory (called once at startup).
    Raises FileNotFoundError if the model is missing.
    """
    global _model, _class_names, _model_version

    if _model is not None:
        return

    if not model_available():
        raise FileNotFoundError(
            f"No trained model found at {config.BEST_MODEL_PATH}. "
            f"Please train the model first: python -m training.train"
        )

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[inference] Loading model from {config.BEST_MODEL_PATH} on {device}")

    checkpoint = torch.load(config.BEST_MODEL_PATH, map_location=device, weights_only=False)

    _class_names = checkpoint["class_names"]
    num_classes = checkpoint["num_classes"]
    _model_version = checkpoint.get("model_version", config.MODEL_VERSION)

    model = build_model(num_classes=num_classes, freeze_backbone=False)
    model.load_state_dict(checkpoint["model_state_dict"])
    model = model.to(device)
    model.eval()

    _model = model
    print(f"[inference] Model loaded. Version: {_model_version}, Classes: {len(_class_names)}")


def predict(image_path: str, clinical_data: dict = None) -> dict:
    """
    Run inference on a single skin image.

    Returns:
        {
            "condition": str,                  # predicted class name
            "confidence": float,               # probability of top class
            "top_predictions": [               # top 3 predictions
                {"condition": str, "confidence": float},
                ...
            ],
            "is_low_confidence": bool,         # below threshold
            "model_version": str,
            "demo_mode": False,
        }

    Raises:
        FileNotFoundError: if no trained model is available.
        ValueError: if the image cannot be loaded.
    """
    _load_model()

    device = next(_model.parameters()).device
    transform = get_eval_transforms()

    # Load and preprocess image
    try:
        img = Image.open(image_path).convert("RGB")
    except Exception as e:
        raise ValueError(f"Could not load image: {e}")

    img_tensor = transform(img).unsqueeze(0).to(device)

    # Inference
    with torch.no_grad():
        outputs = _model(img_tensor)
        probs = torch.softmax(outputs, dim=1).squeeze()

    # Top 3 predictions
    top_k = min(3, len(_class_names))
    top_probs, top_indices = probs.topk(top_k)

    top_predictions = []
    for prob, idx in zip(top_probs.cpu().numpy(), top_indices.cpu().numpy()):
        top_predictions.append({
            "condition": _class_names[idx],
            "confidence": round(float(prob), 4),
        })

    primary_condition = top_predictions[0]["condition"]
    primary_confidence = top_predictions[0]["confidence"]

    is_low = primary_confidence < config.DEFAULT_CONFIDENCE_THRESHOLD

    return {
        "condition": primary_condition,
        "confidence": primary_confidence,
        "top_predictions": top_predictions,
        "is_low_confidence": is_low,
        "model_version": _model_version,
        "demo_mode": False,
    }


def predict_with_fallback(image_path: str, clinical_data: dict = None) -> dict:
    """
    Try real inference; if model is missing or errors, return a clear error
    response rather than fabricating a result.
    """
    if not model_available():
        return {
            "condition": "unavailable",
            "confidence": 0.0,
            "top_predictions": [],
            "is_low_confidence": True,
            "model_version": "none",
            "demo_mode": True,
            "error": (
                "No trained model available. "
                "Please train the model first: python -m training.train"
            ),
        }

    try:
        return predict(image_path, clinical_data)
    except Exception as e:
        return {
            "condition": "error",
            "confidence": 0.0,
            "top_predictions": [],
            "is_low_confidence": True,
            "model_version": "none",
            "demo_mode": True,
            "error": f"Model inference failed: {e}",
        }
