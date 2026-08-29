import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ImageUploader from "../components/ImageUploader";
import ClinicalForm, { defaultClinicalData } from "../components/ClinicalForm";
import api from "../services/api";

const STEPS = [
  { num: 1, label: "Upload Image", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  )},
  { num: 2, label: "Clinical Details", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  )},
  { num: 3, label: "Analyze", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )},
];

export default function Analyze() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [clinical, setClinical] = useState(defaultClinicalData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const canNext = step === 1 ? !!file : step === 2;

  const submit = async () => {
    if (!file) {
      setError("Please select an image before analyzing.");
      return;
    }
    setError("");
    setLoading(true);
    setStep(3);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("clinicalData", JSON.stringify(clinical));
      const { data } = await api.post("/predict", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate(`/results/${data.prediction._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to analyze the image. Please try another clear image.");
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analyze-page">
      <div className="analyze-inner">
        {/* Header */}
        <div className="analyze-header">
          <span className="eyebrow">AI-Powered Analysis</span>
          <h2 className="analyze-title">Skin Image Analysis</h2>
          <p className="analyze-sub">Upload a clear photo of the affected area and provide clinical details for the most accurate AI-assisted assessment.</p>
        </div>

        {/* Step Indicator */}
        <div className="analyze-steps">
          {STEPS.map((s, i) => (
            <div key={s.num} className={`analyze-step ${step === s.num ? "active" : ""} ${step > s.num ? "done" : ""}`}>
              <div className="analyze-step-circle">
                {step > s.num ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : s.icon}
              </div>
              <span className="analyze-step-label">{s.label}</span>
              {i < STEPS.length - 1 && <div className="analyze-step-line" />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="analyze-content">
          {step === 1 && (
            <div className="analyze-card">
              <div className="analyze-card-header">
                <h3>Upload Skin Image</h3>
                <p>Take or upload a clear, well-lit photo of the skin area you're concerned about.</p>
              </div>
              <ImageUploader file={file} onFileSelected={setFile} />
              <div className="analyze-tips">
                <p className="analyze-tips-title">Tips for best results:</p>
                <ul className="analyze-tips-list">
                  <li>Use natural lighting when possible</li>
                  <li>Keep the camera steady and in focus</li>
                  <li>Capture the full affected area</li>
                  <li>Avoid filters or flash that alter colors</li>
                </ul>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="analyze-card">
              <div className="analyze-card-header">
                <h3>Clinical Information</h3>
                <p>These details help the AI combine visual and clinical signals for a more informed prediction.</p>
              </div>
              <ClinicalForm value={clinical} onChange={setClinical} />
            </div>
          )}

          {step === 3 && loading && (
            <div className="analyze-card analyze-loading">
              <div className="analyze-loading-spinner">
                <div className="analyze-loading-ring" />
              </div>
              <h3>Analyzing Your Image...</h3>
              <p>Our AI model is examining your skin image. This usually takes a few seconds.</p>
            </div>
          )}
        </div>

        {error && <p className="error-text" style={{ marginTop: 16 }}>{error}</p>}

        {/* Navigation */}
        {step < 3 && (
          <div className="analyze-nav">
            {step > 1 && (
              <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"/>
                  <polyline points="12 19 5 12 12 5"/>
                </svg>
                Back
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step === 1 ? (
              <button className="btn btn-primary" disabled={!canNext} onClick={() => setStep(2)}>
                Continue
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            ) : (
              <button className="btn btn-primary" onClick={submit}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Analyze Now
              </button>
            )}
          </div>
        )}

        <p className="analyze-disclaimer">AI predictions are assistive estimates and should be verified by a board-certified dermatologist.</p>
      </div>
    </div>
  );
}
