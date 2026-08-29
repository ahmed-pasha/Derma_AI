"""
Centralized configuration for DermaAI skin disease classifier.

All hyperparameters and paths are defined here so they can be changed in one
place.  Environment variables can override defaults where noted.

NUM_CLASSES is no longer hard-coded.  It is detected dynamically from the
training dataset at training time.  The only constraint is >= 2 classes.
"""

import os

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ML_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ML_ROOT, "data")
TRAIN_DIR = os.path.join(DATA_DIR, "train")
VAL_DIR = os.path.join(DATA_DIR, "val")
TEST_DIR = os.path.join(DATA_DIR, "test")
MODELS_DIR = os.path.join(ML_ROOT, "models")
RESULTS_DIR = os.path.join(ML_ROOT, "results")

BEST_MODEL_PATH = os.path.join(MODELS_DIR, "best_model.pth")
CLASS_NAMES_PATH = os.path.join(MODELS_DIR, "class_names.json")
METRICS_PATH = os.path.join(RESULTS_DIR, "metrics.json")

# ---------------------------------------------------------------------------
# Class constraints
# ---------------------------------------------------------------------------
MIN_CLASSES = 2                        # at least 2 classes required
REQUIRED_NORMAL_CLASS = "Normal Skin"  # optional; set to None to skip check

# ---------------------------------------------------------------------------
# Model architecture
# ---------------------------------------------------------------------------
# EfficientNet-B0 — lightweight backbone for fast CPU training.
#
# Rationale:
#   - EfficientNet-B0 (~5.3 M params) is dramatically smaller than
#     ConvNeXt-Base (~88 M params), making training feasible on an Intel i5
#     CPU in minutes per epoch instead of 30+.
#   - Compound scaling (width, depth, resolution) gives B0 competitive
#     accuracy despite the small size.
#   - Pretrained ImageNet weights give a strong starting point regardless of
#     how many target classes you have (6, 10, 50, 100, etc.).
#
# Alternatives can be swapped via BACKBONE_NAME.
# ---------------------------------------------------------------------------
BACKBONE_NAME = "efficientnet_b0"  # options: efficientnet_b0, efficientnet_b3, resnet50

BACKBONE_CONFIGS = {
    "efficientnet_b0": {
        "torchvision_name": "efficientnet_b0",
        "weights": "EfficientNet_B0_Weights.IMAGENET1K_V1",
        "feature_dim": 1280,
        "input_size": 224,
        "classifier_in_features": 1280,
    },
    "efficientnet_b3": {
        "torchvision_name": "efficientnet_b3",
        "weights": "EfficientNet_B3_Weights.IMAGENET1K_V1",
        "feature_dim": 1536,
        "input_size": 300,
        "classifier_in_features": 1536,
    },
    "resnet50": {
        "torchvision_name": "resnet50",
        "weights": "ResNet50_Weights.IMAGENET1K_V1",
        "feature_dim": 2048,
        "input_size": 224,
        "classifier_in_features": 2048,
    },
}

# ---------------------------------------------------------------------------
# Training hyperparameters
# ---------------------------------------------------------------------------
BATCH_SIZE = int(os.environ.get("DERMA_BATCH_SIZE", 32))
LEARNING_RATE = float(os.environ.get("DERMA_LR", 1e-3))
WEIGHT_DECAY = 1e-4
MAX_EPOCHS = int(os.environ.get("DERMA_EPOCHS", 30))
EARLY_STOP_PATIENCE = 5
NUM_WORKERS = 0  # Windows-safe default; override with env var on Linux

# ---------------------------------------------------------------------------
# Confidence threshold
# ---------------------------------------------------------------------------
DEFAULT_CONFIDENCE_THRESHOLD = float(os.environ.get("DERMA_CONF_THRESHOLD", 0.50))

# ---------------------------------------------------------------------------
# Model version (bump on retrain)
# ---------------------------------------------------------------------------
MODEL_VERSION = os.environ.get("DERMA_MODEL_VERSION", "2.0.0")
