"""
Trains the CNN image-branch model using transfer learning (MobileNetV2 by
default -- small enough to realistically fine-tune on a student laptop CPU;
swap base_model for EfficientNetB0 / ResNet50 if more compute is available).

Expects preprocessed images organized as:
    dataset/processed/<class_name>/*.jpg

Usage:
    python training/train_image_model.py --data ../dataset/processed --epochs 15
"""

import argparse
import os

import tensorflow as tf
from tensorflow.keras import layers, models, applications

IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32


def build_model(num_classes: int, base_name: str = "mobilenet_v2") -> tf.keras.Model:
    if base_name == "mobilenet_v2":
        base = applications.MobileNetV2(input_shape=IMAGE_SIZE + (3,), include_top=False, weights="imagenet")
    elif base_name == "efficientnet_b0":
        base = applications.EfficientNetB0(input_shape=IMAGE_SIZE + (3,), include_top=False, weights="imagenet")
    elif base_name == "resnet50":
        base = applications.ResNet50(input_shape=IMAGE_SIZE + (3,), include_top=False, weights="imagenet")
    else:
        raise ValueError(f"Unknown base model: {base_name}")

    base.trainable = False  # start frozen; can unfreeze top layers for fine-tuning later

    inputs = tf.keras.Input(shape=IMAGE_SIZE + (3,))
    x = applications.mobilenet_v2.preprocess_input(inputs) if base_name == "mobilenet_v2" else inputs
    x = base(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(128, activation="relu", name="image_feature_vector")(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)

    model = models.Model(inputs, outputs)
    model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])
    return model


def main(data_dir: str, epochs: int, base_name: str, output_dir: str):
    train_ds = tf.keras.utils.image_dataset_from_directory(
        data_dir, validation_split=0.2, subset="training", seed=42,
        image_size=IMAGE_SIZE, batch_size=BATCH_SIZE, label_mode="categorical",
    )
    val_ds = tf.keras.utils.image_dataset_from_directory(
        data_dir, validation_split=0.2, subset="validation", seed=42,
        image_size=IMAGE_SIZE, batch_size=BATCH_SIZE, label_mode="categorical",
    )
    class_names = train_ds.class_names
    num_classes = len(class_names)

    augmentation = tf.keras.Sequential([
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.1),
        layers.RandomZoom(0.1),
    ])
    train_ds = train_ds.map(lambda x, y: (augmentation(x, training=True), y))

    model = build_model(num_classes, base_name)

    os.makedirs(output_dir, exist_ok=True)
    callbacks = [
        tf.keras.callbacks.ModelCheckpoint(
            os.path.join(output_dir, "image_model_best.keras"), save_best_only=True, monitor="val_accuracy"
        ),
        tf.keras.callbacks.EarlyStopping(patience=4, restore_best_weights=True),
    ]

    history = model.fit(train_ds, validation_data=val_ds, epochs=epochs, callbacks=callbacks)

    model.save(os.path.join(output_dir, "image_model_final.keras"))
    with open(os.path.join(output_dir, "class_names.txt"), "w") as f:
        f.write("\n".join(class_names))

    print("Final validation accuracy:", history.history["val_accuracy"][-1])


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True, help="Path to dataset/processed")
    parser.add_argument("--epochs", type=int, default=15)
    parser.add_argument("--base", default="mobilenet_v2", choices=["mobilenet_v2", "efficientnet_b0", "resnet50"])
    parser.add_argument("--output", default="../models")
    args = parser.parse_args()
    main(args.data, args.epochs, args.base, args.output)
