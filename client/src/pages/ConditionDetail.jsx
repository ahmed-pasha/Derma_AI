import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function ConditionDetail() {
  const { slug } = useParams();
  const [disease, setDisease] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setDisease(null);
    api.get(`/diseases/${slug}`).then(({ data }) => setDisease(data.disease)).catch(() => setError("This condition page could not be found."));
  }, [slug]);

  if (error) {
    return (
      <section className="section container" style={{ textAlign: "center" }}>
        <p className="error-text">{error}</p>
        <Link to="/conditions" className="btn btn-outline">Back to Conditions</Link>
      </section>
    );
  }
  if (!disease) return <LoadingSpinner full />;

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <span className="eyebrow">Skin Condition</span>
        <h1>{disease.name}</h1>
        <h3>What is {disease.name}?</h3>
        <p>{disease.description}</p>

        <h3>Common Symptoms</h3>
        <ul>{disease.symptoms.map((s) => <li key={s}>{s}</li>)}</ul>

        <h3>Possible Triggers</h3>
        <ul>{disease.causes.map((c) => <li key={c}>{c}</li>)}</ul>

        <h3>Severity</h3>
        <div className="grid grid-3">
          <div className="card card-pad"><span className="badge badge-mild">Mild</span><p style={{ marginTop: 10, marginBottom: 0, fontSize: "0.9rem" }}>{disease.severityInformation.mild}</p></div>
          <div className="card card-pad"><span className="badge badge-moderate">Moderate</span><p style={{ marginTop: 10, marginBottom: 0, fontSize: "0.9rem" }}>{disease.severityInformation.moderate}</p></div>
          <div className="card card-pad"><span className="badge badge-severe">Severe</span><p style={{ marginTop: 10, marginBottom: 0, fontSize: "0.9rem" }}>{disease.severityInformation.severe}</p></div>
        </div>

        <h3 style={{ marginTop: 32 }}>Diagnosis</h3>
        <p>A professional clinical assessment by a dermatologist may be required for a confirmed diagnosis. DermaAI's predictions are AI-assisted and educational, not a clinical diagnosis.</p>

        <h3>Treatment Information</h3>
        <div className="grid grid-2">
          <div className="card card-pad">
            <h4>Modern Medical Options</h4>
            <ul>{disease.treatment.modernMedical.map((t) => <li key={t}>{t}</li>)}</ul>
            <p style={{ marginBottom: 0, fontSize: "0.85rem" }}>{disease.treatment.consultationNote}</p>
          </div>
          <div className="card card-pad">
            <h4>Ayurvedic / Traditional Options</h4>
            <ul>{disease.ayurvedicInformation.approaches.map((t) => <li key={t}>{t}</li>)}</ul>
            <p style={{ marginBottom: 0, fontSize: "0.85rem" }}>{disease.ayurvedicInformation.note}</p>
          </div>
        </div>

        <h3 style={{ marginTop: 32 }}>General Care</h3>
        <ul>{disease.treatment.generalCare.map((t) => <li key={t}>{t}</li>)}</ul>

        <h3>Prevention</h3>
        <ul>{disease.prevention.map((t) => <li key={t}>{t}</li>)}</ul>

        <div className="disclaimer">
          This information is educational and does not replace medical diagnosis or treatment.
        </div>

        <Link to="/analyze" className="btn btn-primary">Analyze Your Skin</Link>
      </div>
    </section>
  );
}
