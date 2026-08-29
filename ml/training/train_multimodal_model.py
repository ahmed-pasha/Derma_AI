"""
Trains the multimodal fusion model that combines:
  - CNN-derived image feature vectors (from the frozen/fine-tuned image model)
  - Encoded clinical features (see preprocessing/preprocess_images.py::CLINICAL_SCHEMA)

Produces two prediction heads:
  1. Disease classification (Atopic Dermatitis vs Not Atopic Dermatitis)
  2. Severity classification (Mild / Moderate / Severe)

Usage:
    python training/train_multimodal_model.py \
        --image-model ../models/image_model_final.keras \
        --clinical-csv ../dataset/clinical/clinical_data.csv \
        --manifest ../dataset/processed/manifest.json
"""

import argparse
import json
import os

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras import layers, models
from sklearn.model_selection import train_test_split

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "preprocessing"))
from preprocess_images import load_and_preprocess_image, encode_clinical_record, CLINICAL_SCHEMA  # noqa: E402


def build_fusion_model(image_feature_dim: int, clinical_feature_dim: int):
    image_input = tf.keras.Input(shape=(image_feature_dim,), name="image_features")
    clinical_input = tf.keras.Input(shape=(clinical_feature_dim,), name="clinical_features")

    x = layers.Concatenate()([image_input, clinical_input])
    x = layers.Dense(64, activation="relu")(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(32, activation="relu")(x)

    disease_output = layers.Dense(2, activation="softmax", name="disease")(x)  # AD vs Not-AD
    severity_output = layers.Dense(3, activation="softmax", name="severity")(x)  # Mild/Moderate/Severe

    model = models.Model(inputs=[image_input, clinical_input], outputs=[disease_output, severity_output])
    model.compile(
        optimizer="adam",
        loss={"disease": "categorical_crossentropy", "severity": "categorical_crossentropy"},
        metrics={"disease": "accuracy", "severity": "accuracy"},
    )
    return model


def extract_image_features(image_model_path: str, image_paths: list) -> np.ndarray:
    base_model = tf.keras.models.load_model(image_model_path)
    feature_extractor = tf.keras.Model(
        inputs=base_model.input, outputs=base_model.get_layer("image_feature_vector").output
    )
    features = []
    for p in image_paths:
        img = load_and_preprocess_image(p)
        features.append(feature_extractor.predict(np.expand_dims(img, 0), verbose=0)[0])
    return np.array(features)


def main(image_model_path, clinical_csv, manifest_path, output_dir, epochs):
    with open(manifest_path) as f:
        manifest = json.load(f)
    clinical_df = pd.read_csv(clinical_csv)

    if "synthetic" not in clinical_df.columns:
        raise ValueError(
            "clinical_data.csv must include a 'synthetic' boolean column so demo/synthetic "
            "rows are never mistaken for real patient data."
        )

    image_paths = [m["path"] for m in manifest]
    image_features = extract_image_features(image_model_path, image_paths)
    clinical_features = np.array([encode_clinical_record(r) for r in clinical_df.to_dict("records")])

    disease_labels = tf.keras.utils.to_categorical(clinical_df["is_atopic_dermatitis"].astype(int), 2)
    severity_map = {"Mild": 0, "Moderate": 1, "Severe": 2}
    severity_labels = tf.keras.utils.to_categorical(clinical_df["severity"].map(severity_map), 3)

    Xi_train, Xi_val, Xc_train, Xc_val, yd_train, yd_val, ys_train, ys_val = train_test_split(
        image_features, clinical_features, disease_labels, severity_labels, test_size=0.2, random_state=42
    )

    model = build_fusion_model(image_features.shape[1], clinical_features.shape[1])
    os.makedirs(output_dir, exist_ok=True)
    callbacks = [
        tf.keras.callbacks.ModelCheckpoint(
            os.path.join(output_dir, "multimodal_model_best.keras"), save_best_only=True
        ),
        tf.keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True),
    ]

    model.fit(
        {"image_features": Xi_train, "clinical_features": Xc_train},
        {"disease": yd_train, "severity": ys_train},
        validation_data=(
            {"image_features": Xi_val, "clinical_features": Xc_val},
            {"disease": yd_val, "severity": ys_val},
        ),
        epochs=epochs,
        callbacks=callbacks,
    )

    model.save(os.path.join(output_dir, "multimodal_model_final.keras"))
    with open(os.path.join(output_dir, "clinical_schema.json"), "w") as f:
        json.dump(CLINICAL_SCHEMA, f, indent=2)

    print("Training complete. Run evaluate.py for held-out metrics.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--image-model", required=True)
    parser.add_argument("--clinical-csv", required=True)
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--output", default="../models")
    parser.add_argument("--epochs", type=int, default=25)
    args = parser.parse_args()
    main(args.image_model, args.clinical_csv, args.manifest, args.output, args.epochs)
