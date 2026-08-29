import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CameraScanner from "../components/CameraScanner";
import ClinicalForm, { defaultClinicalData } from "../components/ClinicalForm";
import api from "../services/api";

export default function LiveScan() {
  const [capturedFile, setCapturedFile] = useState(null);
  const [clinical, setClinical] = useState(defaultClinicalData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async () => {
    if (!capturedFile) {
      setError("Please capture an image first.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", capturedFile);
      formData.append("clinicalData", JSON.stringify(clinical));
      const { data } = await api.post("/predict", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate(`/results/${data.prediction._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to analyze the image. Please try another clear image or upload instead.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="section-header" style={{ marginBottom: 32 }}>
          <span className="eyebrow">Live Scan</span>
          <h2>Capture With Your Camera</h2>
          <p>Grant camera access, frame the affected area, and capture a clear still image for analysis.</p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <CameraScanner onCapture={setCapturedFile} />
        </div>

        {capturedFile && <ClinicalForm value={clinical} onChange={setClinical} />}

        {error && <p className="error-text" style={{ marginTop: 16 }}>{error}</p>}

        {capturedFile && (
          <button className="btn btn-primary btn-block" style={{ marginTop: 24 }} onClick={submit} disabled={loading}>
            {loading ? <><span className="spinner" /> Analyzing...</> : "Analyze Captured Image"}
          </button>
        )}
      </div>
    </section>
  );
}
