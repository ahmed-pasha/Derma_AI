"""
DermaAI — Dataset preparation script.

Reads a source directory of skin disease images, maps folder names to
standardised class names, randomly selects up to MAX_IMAGES_PER_CLASS
images per class, and splits them into train (70%), validation (15%),
and test (15%) sets.

Usage:
    cd ml
    python prepare_dataset.py

Source:  E:\\Dataset\\Skin Disease Classification Dataset
Output:  ml/data/train/, ml/data/val/, ml/data/test/

The original images are NEVER deleted or modified.
"""

import os
import random
import shutil
import sys

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Source dataset location (change this if your dataset is elsewhere)
SOURCE_DIR = r"E:\Dataset\Skin Disease Classification Dataset"

# Output location (relative to ml/)
ML_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(ML_DIR, "data")
TRAIN_DIR = os.path.join(OUTPUT_DIR, "train")
VAL_DIR = os.path.join(OUTPUT_DIR, "val")
TEST_DIR = os.path.join(OUTPUT_DIR, "test")

# Maximum images to select per class (None = use all)
MAX_IMAGES_PER_CLASS = 150

# Fixed seed for reproducible selection and splits
RANDOM_SEED = 42

# Split ratios
TRAIN_RATIO = 0.70
VAL_RATIO = 0.15
TEST_RATIO = 0.15

# Image extensions to look for
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# Folder name mapping: source name -> normalised name
# Keys are case-insensitive; values are the canonical names used everywhere.
CLASS_NAME_MAP = {
    "acne vulgaris":      "Acne Vulgaris",
    "hyperpigmentation":  "Hyperpigmentation",
    "nail psoriasis":     "Nail Psoriasis",
    "normal skin":        "Normal Skin",
    "sjs ten":            "SJS TEN",
    "vitiligo":           "Vitiligo",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_image_files(directory: str) -> list:
    """Return a sorted list of image file paths in a directory."""
    files = []
    for fname in sorted(os.listdir(directory)):
        if os.path.splitext(fname)[1].lower() in IMAGE_EXTENSIONS:
            files.append(os.path.join(directory, fname))
    return files


def map_class_name(raw_name: str) -> str:
    """
    Map a raw folder name to its normalised form.
    Falls back to title-casing the original name if no mapping exists.
    """
    key = raw_name.strip().lower()
    return CLASS_NAME_MAP.get(key, raw_name.strip().title())


def select_images(files: list, max_images: int, seed: int) -> list:
    """
    Randomly select up to *max_images* files from *files*.
    Uses a fixed seed for reproducibility.  If max_images is None or
    >= len(files), returns all files (still shuffled for split fairness).
    """
    rng = random.Random(seed)
    shuffled = files[:]
    rng.shuffle(shuffled)
    if max_images is not None and max_images < len(shuffled):
        return shuffled[:max_images]
    return shuffled


def split_files(files: list, seed: int) -> tuple:
    """
    Shuffle and split a list of file paths into train/val/test.
    Returns (train_files, val_files, test_files).
    """
    rng = random.Random(seed)
    shuffled = files[:]
    rng.shuffle(shuffled)

    n = len(shuffled)
    n_train = int(n * TRAIN_RATIO)
    n_val = int(n * VAL_RATIO)

    train = shuffled[:n_train]
    val = shuffled[n_train:n_train + n_val]
    test = shuffled[n_train + n_val:]

    return train, val, test


def clear_output_dirs():
    """
    Safely remove only files and class subfolders inside each output
    directory.  Never touches the source dataset.
    """
    dirs = [TRAIN_DIR, VAL_DIR, TEST_DIR]
    for d in dirs:
        if os.path.isdir(d):
            for entry in os.listdir(d):
                entry_path = os.path.join(d, entry)
                if os.path.isdir(entry_path):
                    shutil.rmtree(entry_path)
                else:
                    os.remove(entry_path)
            print(f"  Cleared: {d}")
        os.makedirs(d, exist_ok=True)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("DermaAI — Dataset Preparation")
    print("=" * 60)

    # 1. Validate source directory exists
    print(f"\n[1/6] Checking source directory...")
    print(f"  Source: {SOURCE_DIR}")
    if not os.path.isdir(SOURCE_DIR):
        print(f"\n  ERROR: Source directory not found!")
        print(f"  Please verify the path and try again.")
        sys.exit(1)

    # 2. Discover source classes and count images
    print(f"\n[2/6] Scanning source classes...")
    source_classes = {}
    for entry in sorted(os.listdir(SOURCE_DIR)):
        class_dir = os.path.join(SOURCE_DIR, entry)
        if os.path.isdir(class_dir):
            images = get_image_files(class_dir)
            if images:
                normalised = map_class_name(entry)
                source_classes[normalised] = images
                print(f"  {entry} -> {normalised}: {len(images)} images")

    if not source_classes:
        print("\n  ERROR: No classes with images found in source directory!")
        sys.exit(1)

    print(f"\n  Total: {len(source_classes)} classes, "
          f"{sum(len(v) for v in source_classes.values())} images")

    # 3. Select up to MAX_IMAGES_PER_CLASS per class and split
    max_label = MAX_IMAGES_PER_CLASS if MAX_IMAGES_PER_CLASS else "all"
    print(f"\n[3/6] Selecting up to {max_label} images per class, "
          f"then splitting into train ({TRAIN_RATIO:.0%}) / "
          f"val ({VAL_RATIO:.0%}) / test ({TEST_RATIO:.0%})...")
    splits = {}  # {class_name: {"train": [...], "val": [...], "test": [...], ...}}
    for class_name, images in source_classes.items():
        selected = select_images(images, MAX_IMAGES_PER_CLASS, RANDOM_SEED)
        train, val, test = split_files(selected, RANDOM_SEED)
        splits[class_name] = {
            "source_count": len(images),
            "selected": len(selected),
            "train": train,
            "val": val,
            "test": test,
        }

    # 4. Clear output and copy files
    print(f"\n[4/6] Copying files to ml/data/...")
    clear_output_dirs()

    for class_name, class_splits in splits.items():
        for split_name in ("train", "val", "test"):
            files = class_splits[split_name]
            dest_dir = os.path.join(OUTPUT_DIR, split_name, class_name)
            os.makedirs(dest_dir, exist_ok=True)
            for src_path in files:
                dest_path = os.path.join(dest_dir, os.path.basename(src_path))
                shutil.copy2(src_path, dest_path)

    # 5. Summary table
    print(f"\n[5/6] Summary:")
    print(f"\n{'Class':<25} {'Source':>8} {'Select':>8} {'Train':>8} {'Val':>8} {'Test':>8}")
    print("-" * 77)

    total_source = total_selected = 0
    total_train = total_val = total_test = 0
    for class_name in sorted(splits.keys()):
        info = splits[class_name]
        n_source = info["source_count"]
        n_selected = info["selected"]
        n_train = len(info["train"])
        n_val = len(info["val"])
        n_test = len(info["test"])
        print(f"{class_name:<25} {n_source:>8} {n_selected:>8} {n_train:>8} {n_val:>8} {n_test:>8}")
        total_source += n_source
        total_selected += n_selected
        total_train += n_train
        total_val += n_val
        total_test += n_test

    print("-" * 77)
    print(f"{'TOTAL':<25} {total_source:>8} {total_selected:>8} {total_train:>8} {total_val:>8} {total_test:>8}")

    print(f"\n[6/6] Dataset preparation complete!")
    print(f"  Output: {TRAIN_DIR}")
    print(f"         {VAL_DIR}")
    print(f"         {TEST_DIR}")
    print(f"\n  Next steps:")
    print(f"  1. cd ml")
    print(f"  2. python -m training.train --epochs 30")
    print(f"  3. python -m training.evaluate")


if __name__ == "__main__":
    main()
