# DermaAI — ML Pipeline

Multimodal pipeline: skin image → CNN feature extraction, clinical data → encoded
feature vector, both fused into a small dense network with two output heads
(disease classification, severity classification).

```text
SKIN IMAGE                     CLINICAL DATA
    │                               │
    ▼                               ▼
Preprocessing              Clinical Encoding
(resize, normalize)        (CLINICAL_SCHEMA)
    │                               │
    ▼                               │
CNN / Transfer Learning             │
(MobileNetV2 / EfficientNet/ResNet) │
    │                               │
    ▼                               │
Image Feature Vector ───────────────┤
                                     ▼
                            Feature Fusion (concat)
                                     │
                                     ▼
                          Dense Multimodal Network
                            /                 \
                           ▼                   ▼
                 Disease Head            Severity Head
              (AD / Not AD)         (Mild / Moderate / Severe)
```

## Files

| File | Purpose |
|---|---|
| `preprocessing/preprocess_images.py` | Image resize/normalize; configurable `CLINICAL_SCHEMA` + encoder |
| `training/train_image_model.py` | Transfer-learning CNN training (image branch only) |
| `training/train_multimodal_model.py` | Fusion model training (image features + clinical features) |
| `training/evaluate.py` | Computes **real** accuracy/precision/recall/F1/confusion matrix on a held-out test set, writes `results/metrics.json` |
| `inference/predict.py` | Loads real model if available, else returns a clearly-labeled demo prediction |
| `api/main.py` | FastAPI service the Node backend calls (`POST /predict`, `GET /status`, `GET /metrics`) |

## Quick start (demo mode, no training needed)

```bash
cd ml
pip install -r requirements.txt
python api/main.py
```

With `DEMO_MODE=true` (see root `.env.example`), the service returns clearly-labeled
demo predictions so the rest of the stack (auth, dashboard, camera, upload, history,
chatbot, metrics page) is fully testable without a GPU or trained weights.

## Training a real model

1. Pick and download a dataset per `dataset/README.md`; document it there.
2. `python preprocessing/preprocess_images.py --input dataset/raw --output dataset/processed`
3. `python training/train_image_model.py --data dataset/processed --epochs 15`
4. Build/obtain a clinical CSV (real, or clearly `synthetic=True` for demo purposes)
   and run `python training/train_multimodal_model.py ...`
5. `python training/evaluate.py ...` — writes real metrics to `results/metrics.json`.
6. Set `DEMO_MODE=false` in `.env` and restart `api/main.py`. `/status` and `/metrics`
   will now reflect the real trained model.

## Honesty guarantees baked into this pipeline

- Demo predictions are always tagged `demo_mode: true` in the API response and surfaced
  in the UI — never presented as a real model result.
- `/metrics` returns `"available": false"` (not a fake number) until `evaluate.py` has
  actually produced `results/metrics.json` from a real held-out test run.
- Synthetic clinical data must carry a `synthetic` column and is never described as real
  patient data anywhere in the app.
