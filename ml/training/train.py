"""
DermaAI skin disease classifier — training pipeline.

Uses transfer learning with a pretrained EfficientNet-B0 (or configurable
backbone) and fine-tunes a custom classifier head.  The number of classes is
detected dynamically from the training dataset (any number >= 2).

Usage (from the ml/ directory):
    python -m training.train [--epochs 30] [--lr 1e-3] [--batch-size 32] [--skip-finetune]

Or with environment variables:
    DERMA_EPOCHS=30 DERMA_LR=1e-3 python -m training.train

Prerequisites:
    - Dataset prepared in ml/data/{train,val,test}/
    - Run prepare_dataset.py first if needed.
"""

import argparse
import json
import os
import sys
import time
from collections import OrderedDict

import torch
import torch.nn as nn
import torch.optim as optim
from torch.optim.lr_scheduler import CosineAnnealingLR

# Ensure ml/ is on sys.path so 'from training import config' works
# when invoked as `python -m training.train` from inside ml/.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from training import config
from training.dataset import (
    create_dataloaders,
    validate_dataset,
    validate_class_names,
    load_class_names,
)


# ---------------------------------------------------------------------------
# Model builder
# ---------------------------------------------------------------------------

def build_model(num_classes: int, freeze_backbone: bool = True):
    """
    Build a transfer-learning model.

    Architecture:
        pretrained backbone -> AdaptiveAvgPool2d -> flatten ->
        Dropout(p=0.3) -> Linear(feature_dim, 512) -> ReLU ->
        Dropout(p=0.4) -> Linear(512, num_classes)

    The backbone is frozen by default so the head trains quickly first,
    then the full network is unfrozen for fine-tuning.

    Args:
        num_classes: dynamically determined from the training dataset.
        freeze_backbone: whether to freeze the backbone for phase 1.
    """
    import torchvision.models as models

    cfg = config.BACKBONE_CONFIGS[config.BACKBONE_NAME]

    # Load pretrained backbone
    # In torchvision >= 0.13, model functions don't have .weights.
    # Access the Weights enum directly: e.g. ConvNeXt_Base_Weights.IMAGENET1K_V1
    weights_parts = cfg["weights"].split(".")
    weights_enum_class = getattr(models, weights_parts[0])
    weights_enum_value = getattr(weights_enum_class, weights_parts[1])
    model = getattr(models, config.BACKBONE_NAME)(weights=weights_enum_value)

    # Extract the feature extraction part (everything before the original head)
    if config.BACKBONE_NAME.startswith("convnext"):
        backbone_features = model.features
        classifier_in = cfg["classifier_in_features"]
    elif config.BACKBONE_NAME.startswith("efficientnet"):
        backbone_features = model.features
        classifier_in = cfg["classifier_in_features"]
    elif config.BACKBONE_NAME == "resnet50":
        backbone_features = nn.Sequential(*list(model.children())[:-1])
        classifier_in = cfg["classifier_in_features"]
    else:
        backbone_features = model.features
        classifier_in = cfg["classifier_in_features"]

    # Custom classifier head
    classifier = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(classifier_in, 512),
        nn.ReLU(inplace=True),
        nn.Dropout(p=0.4),
        nn.Linear(512, num_classes),
    )

    full_model = nn.Sequential(
        OrderedDict([
            ("backbone", backbone_features),
            ("pool", nn.AdaptiveAvgPool2d((1, 1))),
            ("flatten", nn.Flatten(1)),
            ("classifier", classifier),
        ])
    )

    if freeze_backbone:
        for param in full_model.backbone.parameters():
            param.requires_grad = False
        print(f"[train] Backbone frozen ({config.BACKBONE_NAME})")
    else:
        print(f"[train] Backbone unfrozen ({config.BACKBONE_NAME})")

    total = sum(p.numel() for p in full_model.parameters())
    trainable = sum(p.numel() for p in full_model.parameters() if p.requires_grad)
    print(f"[train] Parameters: {total:,} total, {trainable:,} trainable")

    return full_model


# ---------------------------------------------------------------------------
# Training loop
# ---------------------------------------------------------------------------

def train_one_epoch(model, loader, criterion, optimizer, device):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * images.size(0)
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()

    return running_loss / total, 100.0 * correct / total


def validate(model, loader, criterion, device):
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            running_loss += loss.item() * images.size(0)
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

    return running_loss / total, 100.0 * correct / total


def train(args):
    print("=" * 60)
    print("DermaAI — Skin Disease Classifier Training")
    print("=" * 60)
    print(f"  Backbone:       {config.BACKBONE_NAME}")

    # Validate dataset first
    print("\n[setup] Validating dataset...")
    train_counts = validate_dataset(config.TRAIN_DIR, "train")
    validate_dataset(config.VAL_DIR, "val")
    validate_class_names(train_counts)

    class_names = sorted(train_counts.keys())
    num_classes = len(class_names)
    print(f"\n[setup] {num_classes} classes detected dynamically.")
    print(f"[setup] Classes: {class_names}")
    print(f"  Num classes:   {num_classes}")

    # Create dataloaders
    print("\n[setup] Creating dataloaders...")
    train_loader, val_loader, _, class_names = create_dataloaders()
    print(f"[setup] Train batches: {len(train_loader)}, Val batches: {len(val_loader)}")

    # Device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[setup] Device: {device}")

    # Build model
    print(f"\n[model] Building model with {config.BACKBONE_NAME} backbone...")
    model = build_model(num_classes=num_classes, freeze_backbone=True)
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()

    def _save_checkpoint(val_acc: float, epoch_num: int):
        """Save checkpoint immediately when val accuracy improves."""
        os.makedirs(config.MODELS_DIR, exist_ok=True)
        checkpoint = {
            "model_state_dict": model.state_dict(),
            "num_classes": num_classes,
            "class_names": class_names,
            "epoch": epoch_num,
            "val_accuracy": round(val_acc, 4),
            "model_version": config.MODEL_VERSION,
            "backbone_name": config.BACKBONE_NAME,
        }
        torch.save(checkpoint, config.BEST_MODEL_PATH)
        print(f"  [checkpoint saved] -> {config.BEST_MODEL_PATH} (val_acc={val_acc:.2f}%)")

    # ---- Phase 1: Train classifier head only (backbone frozen) ----
    print("\n" + "=" * 60)
    print("Phase 1: Training classifier head (backbone frozen)")
    print("=" * 60)

    head_params = [p for p in model.classifier.parameters() if p.requires_grad]
    optimizer = optim.Adam(head_params, lr=args.lr, weight_decay=config.WEIGHT_DECAY)
    scheduler = CosineAnnealingLR(optimizer, T_max=args.epochs // 2)

    best_val_acc = 0.0
    patience_counter = 0
    best_model_state = None
    epochs_run = 0
    global_epoch = 0

    for epoch in range(1, args.epochs + 1):
        t0 = time.time()
        train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc = validate(model, val_loader, criterion, device)
        scheduler.step()
        elapsed = time.time() - t0
        global_epoch += 1

        print(
            f"Epoch {epoch:3d}/{args.epochs} | "
            f"Backbone: {config.BACKBONE_NAME} | "
            f"Train acc={train_acc:.1f}% | "
            f"Val acc={val_acc:.1f}% | "
            f"{elapsed:.1f}s"
        )

        epochs_run = epoch

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_model_state = {k: v.clone() for k, v in model.state_dict().items()}
            patience_counter = 0
            _save_checkpoint(val_acc, global_epoch)
        else:
            patience_counter += 1

        if patience_counter >= config.EARLY_STOP_PATIENCE:
            print(f"\n[train] Early stopping at epoch {epoch} (no improvement for {config.EARLY_STOP_PATIENCE} epochs)")
            break

    # ---- Phase 2: Fine-tune full network (skip if --skip-finetune) ----
    if args.skip_finetune:
        print("\n" + "=" * 60)
        print("Skipping fine-tuning (--skip-finetune flag)")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("Phase 2: Fine-tuning full network (backbone unfrozen)")
        print("=" * 60)

        # Restore best checkpoint from phase 1
        if best_model_state:
            model.load_state_dict(best_model_state)

        # Unfreeze backbone
        for param in model.backbone.parameters():
            param.requires_grad = True

        total = sum(p.numel() for p in model.parameters())
        trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
        print(f"[train] Parameters: {total:,} total, {trainable:,} trainable")

        # Lower learning rate for fine-tuning
        fine_tune_lr = args.lr * 0.1
        optimizer = optim.Adam(model.parameters(), lr=fine_tune_lr, weight_decay=config.WEIGHT_DECAY)
        scheduler = CosineAnnealingLR(optimizer, T_max=max(1, args.epochs - epochs_run))

        patience_counter = 0
        fine_tune_best_acc = best_val_acc

        remaining_epochs = max(5, args.epochs - epochs_run)
        print(f"[train] Running {remaining_epochs} fine-tuning epochs...")

        for epoch in range(1, remaining_epochs + 1):
            t0 = time.time()
            train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, device)
            val_loss, val_acc = validate(model, val_loader, criterion, device)
            scheduler.step()
            elapsed = time.time() - t0
            global_epoch += 1

            print(
                f"FineTune {epoch:3d}/{remaining_epochs} | "
                f"Backbone: {config.BACKBONE_NAME} | "
                f"Train acc={train_acc:.1f}% | "
                f"Val acc={val_acc:.1f}% | "
                f"{elapsed:.1f}s"
            )

            if val_acc > fine_tune_best_acc:
                fine_tune_best_acc = val_acc
                best_model_state = {k: v.clone() for k, v in model.state_dict().items()}
                patience_counter = 0
                _save_checkpoint(val_acc, global_epoch)
            else:
                patience_counter += 1

            if patience_counter >= config.EARLY_STOP_PATIENCE:
                print(f"\n[train] Early stopping at fine-tune epoch {epoch}")
                break

    # ---- Save best model ----
    print("\n" + "=" * 60)
    print("Saving best model")
    print("=" * 60)

    if best_model_state:
        model.load_state_dict(best_model_state)

    os.makedirs(config.MODELS_DIR, exist_ok=True)

    checkpoint = {
        "model_state_dict": model.state_dict(),
        "num_classes": num_classes,
        "class_names": class_names,
        "epoch": global_epoch,
        "val_accuracy": round(best_val_acc, 4),
        "model_version": config.MODEL_VERSION,
        "backbone_name": config.BACKBONE_NAME,
    }
    torch.save(checkpoint, config.BEST_MODEL_PATH)
    print(f"[saved] Model -> {config.BEST_MODEL_PATH}")
    print(f"[saved] Best validation accuracy: {best_val_acc:.2f}%")

    # Save class names alongside the model
    from training.dataset import save_class_names
    save_class_names(class_names)

    print("\nTraining complete. Run evaluate.py for held-out test metrics.")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args():
    parser = argparse.ArgumentParser(
        description="Train DermaAI skin disease classifier (dynamic class count)"
    )
    parser.add_argument(
        "--epochs", type=int, default=None,
        help=f"Max training epochs (default: {config.MAX_EPOCHS})"
    )
    parser.add_argument(
        "--lr", type=float, default=None,
        help=f"Learning rate (default: {config.LEARNING_RATE})"
    )
    parser.add_argument(
        "--batch-size", type=int, default=None,
        help=f"Batch size (default: {config.BATCH_SIZE})"
    )
    parser.add_argument(
        "--skip-finetune", action="store_true",
        help="Skip fine-tuning phase; train only the classifier head"
    )
    args = parser.parse_args()

    # Apply defaults from config where not specified
    if args.epochs is None:
        args.epochs = config.MAX_EPOCHS
    if args.lr is None:
        args.lr = config.LEARNING_RATE
    if args.batch_size is None:
        args.batch_size = config.BATCH_SIZE
        config.BATCH_SIZE = args.batch_size

    return args


if __name__ == "__main__":
    args = parse_args()
    train(args)
