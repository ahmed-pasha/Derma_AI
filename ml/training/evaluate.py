"""
DermaAI classifier — evaluation script.

Computes accuracy, precision, recall, F1, per-class metrics, and confusion
matrix on the test set.  Writes results to ml/results/metrics.json.

The number of classes is read from the trained model checkpoint — no
hard-coded class count.

Usage (from ml/):
    python -m training.evaluate [--data test]
"""

import argparse
import json
import os
import sys

import numpy as np
import torch
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from training import config
from training.dataset import (
    get_eval_transforms,
    load_class_names,
    SingleImageDataset,
)
from torch.utils.data import DataLoader
from torchvision.datasets import ImageFolder


def load_model(device: torch.device = None):
    """Load the best trained model from checkpoint."""
    device = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")

    if not os.path.exists(config.BEST_MODEL_PATH):
        raise FileNotFoundError(
            f"Model not found at {config.BEST_MODEL_PATH}. "
            f"Train the model first with: python -m training.train"
        )

    checkpoint = torch.load(config.BEST_MODEL_PATH, map_location=device, weights_only=False)

    from training.train import build_model
    class_names = checkpoint["class_names"]
    num_classes = checkpoint["num_classes"]

    model = build_model(num_classes=num_classes, freeze_backbone=False)
    model.load_state_dict(checkpoint["model_state_dict"])
    model = model.to(device)
    model.eval()

    return model, class_names, checkpoint.get("model_version", config.MODEL_VERSION)


def evaluate(test_dir: str = None, output_dir: str = None):
    """Run evaluation on the test set and save metrics."""
    test_dir = test_dir or config.TEST_DIR
    output_dir = output_dir or config.RESULTS_DIR

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[eval] Device: {device}")

    model, class_names, model_version = load_model(device)
    print(f"[eval] Model version: {model_version}")
    print(f"[eval] Classes: {len(class_names)}")

    # Load test dataset
    if not os.path.isdir(test_dir):
        raise FileNotFoundError(f"Test directory not found: {test_dir}")

    test_dataset = ImageFolder(test_dir, transform=get_eval_transforms())
    test_loader = DataLoader(
        test_dataset,
        batch_size=config.BATCH_SIZE,
        shuffle=False,
        num_workers=config.NUM_WORKERS,
    )

    # Verify class alignment
    test_classes = test_dataset.classes
    if test_classes != class_names:
        print(f"[eval] WARNING: Test classes don't match training classes.")
        print(f"  Training: {class_names[:5]}...")
        print(f"  Test: {test_classes[:5]}...")

    print(f"[eval] Test images: {len(test_dataset)}")
    print(f"[eval] Running inference...")

    all_preds = []
    all_labels = []
    all_probs = []

    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device)
            outputs = model(images)
            probs = torch.softmax(outputs, dim=1)
            _, predicted = outputs.max(1)

            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.numpy())
            all_probs.extend(probs.cpu().numpy())

    all_preds = np.array(all_preds)
    all_labels = np.array(all_labels)
    all_probs = np.array(all_probs)

    # Compute metrics
    accuracy = float(accuracy_score(all_labels, all_preds))

    # For multi-class, use macro and weighted averaging
    precision_macro = float(precision_score(all_labels, all_preds, average="macro", zero_division=0))
    recall_macro = float(recall_score(all_labels, all_preds, average="macro", zero_division=0))
    f1_macro = float(f1_score(all_labels, all_preds, average="macro", zero_division=0))

    precision_weighted = float(precision_score(all_labels, all_preds, average="weighted", zero_division=0))
    recall_weighted = float(recall_score(all_labels, all_preds, average="weighted", zero_division=0))
    f1_weighted = float(f1_score(all_labels, all_preds, average="weighted", zero_division=0))

    # Per-class report
    report_str = classification_report(
        all_labels, all_preds,
        target_names=class_names,
        zero_division=0,
    )
    print("\n" + report_str)

    # Per-class metrics as JSON-serializable dict
    per_class = {}
    report_dict = classification_report(
        all_labels, all_preds,
        target_names=class_names,
        output_dict=True,
        zero_division=0,
    )
    for cls_name in class_names:
        if cls_name in report_dict:
            per_class[cls_name] = {
                "precision": round(report_dict[cls_name]["precision"], 4),
                "recall": round(report_dict[cls_name]["recall"], 4),
                "f1-score": round(report_dict[cls_name]["f1-score"], 4),
                "support": int(report_dict[cls_name]["support"]),
            }

    # Confusion matrix
    cm = confusion_matrix(all_labels, all_preds)

    metrics = {
        "accuracy": round(accuracy, 4),
        "precision_macro": round(precision_macro, 4),
        "recall_macro": round(recall_macro, 4),
        "f1_macro": round(f1_macro, 4),
        "precision_weighted": round(precision_weighted, 4),
        "recall_weighted": round(recall_weighted, 4),
        "f1_weighted": round(f1_weighted, 4),
        "per_class": per_class,
        "confusion_matrix": cm.tolist(),
        "class_names": class_names,
        "model_version": model_version,
        "backbone": config.BACKBONE_NAME,
        "evaluated_on_samples": len(test_dataset),
    }

    # Save
    os.makedirs(output_dir, exist_ok=True)
    out_path = os.path.join(output_dir, "metrics.json")
    with open(out_path, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\n[eval] Metrics saved to {out_path}")
    print(f"[eval] Accuracy: {accuracy:.2%}")
    print(f"[eval] F1 (macro): {f1_macro:.4f}")
    print(f"[eval] F1 (weighted): {f1_weighted:.4f}")

    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate DermaAI model")
    parser.add_argument("--data", default=None, help="Test directory (default: ml/data/test)")
    parser.add_argument("--output", default=None, help="Output directory (default: ml/results)")
    args = parser.parse_args()
    evaluate(args.data, args.output)
