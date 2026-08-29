"""
PyTorch Dataset and DataLoader helpers for the DermaAI classifier.

Supports any number of classes (>= 2).  The class count is detected
dynamically from the training directory — no hard-coded class count.

Expected directory layout (ImageFolder-compatible):

    ml/data/train/<class_name>/*.jpg
    ml/data/val/<class_name>/*.jpg
    ml/data/test/<class_name>/*.jpg

Each subdirectory name IS the class label.
"""

import json
import os
from collections import Counter

import torch
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms
from torchvision.datasets import ImageFolder
from PIL import Image

from . import config

IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")


# ---------------------------------------------------------------------------
# Transforms
# ---------------------------------------------------------------------------

def get_train_transforms():
    """
    Training augmentation pipeline.

    Uses the backbone's recommended preprocessing (resize + centre-crop +
    normalisation) augmented with random flips, rotation, colour jitter and
    random erasing — standard augmentations for dermatology images where
    orientation and lighting vary.
    """
    cfg = config.BACKBONE_CONFIGS[config.BACKBONE_NAME]
    weights_cls = _load_weights_cls()
    infer_transforms = weights_cls.transforms()

    resize_size = infer_transforms.resize_size[0] if isinstance(infer_transforms.resize_size, (list, tuple)) else infer_transforms.resize_size
    crop_size = infer_transforms.crop_size[0] if isinstance(infer_transforms.crop_size, (list, tuple)) else infer_transforms.crop_size

    return transforms.Compose([
        transforms.Resize(resize_size),
        transforms.RandomCrop(crop_size),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.3),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.05),
        transforms.RandomAffine(degrees=0, translate=(0.05, 0.05)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        transforms.RandomErasing(p=0.2, scale=(0.02, 0.15)),
    ])


def get_eval_transforms():
    """
    Validation / test transforms — deterministic resize + centre-crop +
    normalisation.  No random augmentation.
    """
    weights_cls = _load_weights_cls()
    infer_transforms = weights_cls.transforms()
    resize_size = infer_transforms.resize_size[0] if isinstance(infer_transforms.resize_size, (list, tuple)) else infer_transforms.resize_size
    crop_size = infer_transforms.crop_size[0] if isinstance(infer_transforms.crop_size, (list, tuple)) else infer_transforms.crop_size

    return transforms.Compose([
        transforms.Resize(resize_size),
        transforms.CenterCrop(crop_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])


def _load_weights_cls():
    """
    Load the Weights enum class for the configured backbone.

    In torchvision >= 0.13, model functions (e.g. convnext_base) are plain
    functions and don't have a .weights attribute.  The Weights enum is
    accessed directly via the weights class name, e.g.
    torchvision.models.ConvNeXt_Base_Weights.IMAGENET1K_V1.
    """
    import torchvision.models as models
    cfg = config.BACKBONE_CONFIGS[config.BACKBONE_NAME]
    # cfg["weights"] is like "ConvNeXt_Base_Weights.IMAGENET1K_V1"
    parts = cfg["weights"].split(".")
    weights_enum_class = getattr(models, parts[0])   # ConvNeXt_Base_Weights
    return getattr(weights_enum_class, parts[1])       # IMAGENET1K_V1


# ---------------------------------------------------------------------------
# Dataset validation
# ---------------------------------------------------------------------------

def count_images_in_dir(dir_path: str) -> int:
    """Count image files in a directory."""
    return len([
        f for f in os.listdir(dir_path)
        if f.lower().endswith(IMAGE_EXTENSIONS)
    ])


def validate_dataset(split_dir: str, split_name: str) -> dict:
    """
    Walk *split_dir* and return a dict of {class_name: image_count}.
    Raises FileNotFoundError if the directory doesn't exist.
    """
    if not os.path.isdir(split_dir):
        raise FileNotFoundError(
            f"Dataset directory not found: {split_dir}\n"
            f"Please set up the dataset before training. See DATASET_SETUP.md."
        )

    class_counts = {}
    for entry in sorted(os.listdir(split_dir)):
        class_dir = os.path.join(split_dir, entry)
        if os.path.isdir(class_dir):
            n_images = count_images_in_dir(class_dir)
            if n_images > 0:
                class_counts[entry] = n_images

    if not class_counts:
        raise ValueError(
            f"No classes with images found in {split_dir}. "
            f"Expected subdirectories with images."
        )

    total = sum(class_counts.values())
    print(f"\n[{split_name}] {len(class_counts)} classes, {total} total images")
    for cls, cnt in sorted(class_counts.items()):
        print(f"  {cls}: {cnt} images")

    return class_counts


def validate_class_names(train_counts: dict):
    """
    Verify the training split meets minimum requirements:
      - At least MIN_CLASSES classes
      - If REQUIRED_NORMAL_CLASS is set, it must be present
      - Warn about severely imbalanced classes
    """
    num_classes = len(train_counts)

    if num_classes < config.MIN_CLASSES:
        raise ValueError(
            f"Expected at least {config.MIN_CLASSES} classes in training set, "
            f"found {num_classes}."
        )

    if config.REQUIRED_NORMAL_CLASS and config.REQUIRED_NORMAL_CLASS not in train_counts:
        raise ValueError(
            f"Required class '{config.REQUIRED_NORMAL_CLASS}' not found in "
            f"training data. Found classes: {sorted(train_counts.keys())}"
        )

    # Warn about severe imbalance
    counts = list(train_counts.values())
    median = sorted(counts)[len(counts) // 2]
    for cls, cnt in sorted(train_counts.items()):
        if cnt < median * 0.1:
            print(f"  WARNING: Class '{cls}' has only {cnt} images "
                  f"(median is {median}). Consider adding more data.")


def verify_splits_match(train_dir: str, val_dir: str, test_dir: str):
    """
    Verify that train, val, and test have exactly the same class names.
    Raises ValueError if they don't match.
    """
    train_classes = set()
    val_classes = set()
    test_classes = set()

    if os.path.isdir(train_dir):
        train_classes = {
            d for d in os.listdir(train_dir)
            if os.path.isdir(os.path.join(train_dir, d))
        }
    if os.path.isdir(val_dir):
        val_classes = {
            d for d in os.listdir(val_dir)
            if os.path.isdir(os.path.join(val_dir, d))
        }
    if os.path.isdir(test_dir):
        test_classes = {
            d for d in os.listdir(test_dir)
            if os.path.isdir(os.path.join(test_dir, d))
        }

    if val_classes and train_classes != val_classes:
        missing = train_classes - val_classes
        extra = val_classes - train_classes
        msg = "Train and validation splits have different classes."
        if missing:
            msg += f"\n  Missing from val: {sorted(missing)}"
        if extra:
            msg += f"\n  Extra in val: {sorted(extra)}"
        raise ValueError(msg)

    if test_classes and train_classes != test_classes:
        missing = train_classes - test_classes
        extra = test_classes - train_classes
        msg = "Train and test splits have different classes."
        if missing:
            msg += f"\n  Missing from test: {sorted(missing)}"
        if extra:
            msg += f"\n  Extra in test: {sorted(extra)}"
        raise ValueError(msg)

    print(f"\n[verify] All splits have the same {len(train_classes)} classes. OK.")


def save_class_names(class_names: list, path: str = None):
    """Persist the ordered class name list to JSON."""
    path = path or config.CLASS_NAMES_PATH
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(class_names, f, indent=2)
    print(f"Saved {len(class_names)} class names to {path}")


def load_class_names(path: str = None) -> list:
    """Load class names from JSON. Returns empty list if file missing."""
    path = path or config.CLASS_NAMES_PATH
    if not os.path.exists(path):
        return []
    with open(path) as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# DataLoader creation
# ---------------------------------------------------------------------------

def create_dataloaders():
    """
    Create train / val / test DataLoaders from the data/ directory.

    Returns (train_loader, val_loader, test_loader, class_names).
    The number of classes is detected dynamically from the training data.
    """
    train_counts = validate_dataset(config.TRAIN_DIR, "train")
    val_counts = validate_dataset(config.VAL_DIR, "val")

    # Verify all splits have the same classes
    verify_splits_match(config.TRAIN_DIR, config.VAL_DIR, config.TEST_DIR)

    # Validate minimum requirements
    validate_class_names(train_counts)

    class_names = sorted(train_counts.keys())
    num_classes = len(class_names)
    print(f"\n[dataset] Detected {num_classes} classes dynamically.")
    print(f"[dataset] Classes: {class_names}")

    train_dataset = ImageFolder(config.TRAIN_DIR, transform=get_train_transforms())
    val_dataset = ImageFolder(config.VAL_DIR, transform=get_eval_transforms())
    test_dataset = ImageFolder(config.TEST_DIR, transform=get_eval_transforms()) if os.path.isdir(config.TEST_DIR) and len(os.listdir(config.TEST_DIR)) > 0 else None

    # Sanity check: ImageFolder class order matches our sorted class_names
    assert train_dataset.classes == class_names, (
        f"ImageFolder classes don't match sorted class names. "
        f"ImageFolder: {train_dataset.classes[:5]}... "
        f"Expected: {class_names[:5]}..."
    )

    train_loader = DataLoader(
        train_dataset,
        batch_size=config.BATCH_SIZE,
        shuffle=True,
        num_workers=config.NUM_WORKERS,
        pin_memory=torch.cuda.is_available(),
        drop_last=True,
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=config.BATCH_SIZE,
        shuffle=False,
        num_workers=config.NUM_WORKERS,
        pin_memory=torch.cuda.is_available(),
    )
    test_loader = None
    if test_dataset is not None:
        test_loader = DataLoader(
            test_dataset,
            batch_size=config.BATCH_SIZE,
            shuffle=False,
            num_workers=config.NUM_WORKERS,
        )

    save_class_names(class_names)

    return train_loader, val_loader, test_loader, class_names


class SingleImageDataset(Dataset):
    """Wrap a single image path for inference (used by predict.py)."""

    def __init__(self, image_path: str, transform=None):
        self.image_path = image_path
        self.transform = transform

    def __len__(self):
        return 1

    def __getitem__(self, idx):
        img = Image.open(self.image_path).convert("RGB")
        if self.transform:
            img = self.transform(img)
        return img
