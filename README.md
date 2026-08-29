# DermaAI

DermaAI is a full-stack AI-powered skin disease classification application. It allows users to upload a skin image and receive a machine-learning-based prediction with confidence scores.

The system combines a React frontend, Node.js backend, MongoDB Atlas, and a Python FastAPI machine-learning service powered by EfficientNet-B0.

## Features

- Skin image upload and analysis
- Multi-class skin disease classification
- Normal skin classification
- Confidence-based prediction results
- Top prediction results
- Prediction history
- User authentication
- MongoDB Atlas integration
- Python-based ML inference service
- REST API architecture
- Responsive React frontend
- Model evaluation and performance metrics
- Automated dataset preparation
- Train/validation/test dataset splitting

## System Architecture

```text
                    User
                     |
                     v
              React Frontend
                Port 5173
                     |
                     v
             Node.js Backend
                Port 5000
                     |
          +----------+----------+
          |                     |
          v                     v
     MongoDB Atlas        FastAPI ML Service
                              Port 8000
                                 |
                                 v
                         EfficientNet-B0
                                 |
                                 v
                        Skin Classification
