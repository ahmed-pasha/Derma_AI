"""
DermaAI preprocessing utilities.

Handles:
  - Image loading, resizing, pixel normalization (for CNN input)
  - A configurable clinical-data schema + encoder (see dataset/README.md for why
    this is configurable rather than hardcoded to fields no public dataset has).

Run standalone to preprocess a folder of raw images into ml/dataset/processed/:
    python preprocessing/preprocess_images.py --input ../dataset/raw --output ../dataset/processed
"""

import argparse
import os
import json

import numpy as np
import cv2

IMAGE_SIZE = (224, 224)  # matches typical EfficientNet/MobileNet/ResNet input

# ---------------------------------------------------------------------------
# Configurable clinical-data schema.
# Update this if/when real clinical fields become available. Each entry
# describes how to encode that field into a numeric feature vector.
# ---------------------------------------------------------------------------
CLINICAL_SCHEMA = {
    "age": {"type": "numeric", "range": [0, 120]},
    "duration_days": {"type": "numeric", "range": [0, 3650]},
    "itching_level": {"type": "numeric", "range": [0, 10]},
    "redness": {"type": "numeric", "range": [0, 10]},
    "dryness": {"type": "numeric", "range": [0, 10]},
    "previous_diagnosis": {"type": "boolean"},
    "skin_area": {
        "type": "categorical",
        "categories": ["face", "arms", "legs", "torso", "hands", "scalp", "other"],
    },
}


def load_and_preprocess_image(image_path: str) -> np.ndarray:
    """Load an image from disk, resize to IMAGE_SIZE, normalize pixels to [0, 1]."""
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image: {image_path}")
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, IMAGE_SIZE, interpolation=cv2.INTER_AREA)
    img = img.astype(np.float32) / 255.0
    return img


def encode_clinical_record(record: dict) -> np.ndarray:
    """
    Encode a single clinical record (dict) into a fixed-length numeric vector
    according to CLINICAL_SCHEMA. Missing fields default to 0 (documented,
    not silently fabricated as a "real" measurement).
    """
    features = []
    for field, spec in CLINICAL_SCHEMA.items():
        value = record.get(field)
        if spec["type"] == "numeric":
            lo, hi = spec["range"]
            v = float(value) if value is not None else 0.0
            v = max(lo, min(hi, v))
            features.append((v - lo) / (hi - lo) if hi > lo else 0.0)
        elif spec["type"] == "boolean":
            features.append(1.0 if bool(value) else 0.0)
        elif spec["type"] == "categorical":
            cats = spec["categories"]
            one_hot = [1.0 if value == c else 0.0 for c in cats]
            features.extend(one_hot)
    return np.array(features, dtype=np.float32)


def preprocess_folder(input_dir: str, output_dir: str) -> None:
    os.makedirs(output_dir, exist_ok=True)
    manifest = []
    for root, _dirs, files in os.walk(input_dir):
        for fname in files:
            if not fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                continue
            src = os.path.join(root, fname)
            try:
                img = load_and_preprocess_image(src)
            except ValueError as e:
                print(f"[skip] {e}")
                continue
            rel_class = os.path.relpath(root, input_dir)
            dest_dir = os.path.join(output_dir, rel_class)
            os.makedirs(dest_dir, exist_ok=True)
            dest = os.path.join(dest_dir, fname)
            cv2.imwrite(dest, cv2.cvtColor((img * 255).astype(np.uint8), cv2.COLOR_RGB2BGR))
            manifest.append({"path": dest, "class": rel_class})

    with open(os.path.join(output_dir, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"Preprocessed {len(manifest)} images -> {output_dir}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    preprocess_folder(args.input, args.output)
