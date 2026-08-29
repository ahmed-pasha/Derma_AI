import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import SeverityMeter from "../components/SeverityMeter";

export default function Results() {
  const { id } = useParams();
  const [prediction, setPrediction] = useState(null);
  const [diseaseInfo, setDiseaseInfo] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/predictions/${id}`)
      .then(({ data }) => {
        setPrediction(data.prediction);
        setDiseaseInfo(data.diseaseInfo);
      })
      .catch(() => setError("We couldn't find that report."));
  }, [id]);

  if (error) {
    return (
      <div className="results-page">
        <div className="results-inner">
          <div className="results-error">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <p>{error}</p>
            <Link to="/history" className="btn btn-outline">Back to History</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!prediction) return <LoadingSpinner full />;

  const factors = prediction.clinicalData || {};
  const topPreds = prediction.topPredictions || [];
  const severity = prediction.severity || "mild";
  const confPct = ((prediction.confidence || 0) * 100).toFixed(1);

  return (
    <div className="results-page">
      <div className="results-inner">
        {/* Header */}
        <div className="results-header">
          <Link to="/history" className="results-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Back
          </Link>
          <span className="eyebrow">Analysis Report</span>
          <h2 className="results-title">Skin Analysis Results</h2>
          <p className="results-date">
            {new Date(prediction.createdAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Main Result Card */}
        <div className="results-main">
          {/* Image */}
          {prediction.imageUrl && (
            <div className="results-image-wrap">
              <img src={prediction.imageUrl} alt="Analyzed skin" className="results-image" />
              {prediction.demoMode && <span className="results-badge results-badge-demo">Demo</span>}
              {prediction.isLowConfidence && !prediction.demoMode && (
                <span className="results-badge results-badge-warning">Low Confidence</span>
              )}
            </div>
          )}

          {/* Diagnosis */}
          <div className="results-diagnosis">
            <div className="results-condition-label">Predicted Condition</div>
            <h3 className="results-condition-name">{prediction.condition}</h3>
            <div className="results-conf-row">
              <div className="results-conf-bar">
                <div className="results-conf-fill" style={{ width: `${confPct}%` }} />
              </div>
              <span className="results-conf-text">{confPct}% confidence</span>
            </div>
            {prediction.modelVersion && (
              <span className="results-model-tag">Model v{prediction.modelVersion}</span>
            )}
          </div>
        </div>

        {/* Severity */}
        <div className="results-section">
          <div className="results-section-header">
            <div className="results-section-icon results-section-icon-severity">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <h3 className="results-section-title">Severity Assessment</h3>
              <p className="results-section-sub">Based on your clinical data and image analysis</p>
            </div>
          </div>
          <SeverityMeter severity={severity} />
          <div className="results-severity-info">
            {severity === "mild" && (
              <p>Condition appears <strong>mild</strong>. Symptoms are likely limited and may be manageable with basic skincare. Monitor for changes and consult a dermatologist if it worsens.</p>
            )}
            {severity === "moderate" && (
              <p>Condition appears <strong>moderate</strong>. Symptoms are noticeable and may affect daily comfort. We recommend consulting a dermatologist for a professional evaluation and treatment plan.</p>
            )}
            {severity === "severe" && (
              <p>Condition appears <strong>severe</strong>. Symptoms may be significantly affecting your quality of life. <strong>Please consult a dermatologist promptly</strong> for proper diagnosis and treatment.</p>
            )}
          </div>
        </div>

        {/* Disease Information */}
        {diseaseInfo && (
          <div className="results-section">
            <div className="results-section-header">
              <div className="results-section-icon results-section-icon-info">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              </div>
              <div>
                <h3 className="results-section-title">About {diseaseInfo.name}</h3>
                <p className="results-section-sub">Understanding your condition</p>
              </div>
            </div>
            <p className="results-disease-desc">{diseaseInfo.description}</p>

            {diseaseInfo.symptoms?.length > 0 && (
              <div className="results-info-block">
                <h4 className="results-info-label">Common Symptoms</h4>
                <div className="results-tag-list">
                  {diseaseInfo.symptoms.map((s) => (
                    <span key={s} className="results-tag results-tag-symptom">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {diseaseInfo.causes?.length > 0 && (
              <div className="results-info-block">
                <h4 className="results-info-label">Triggers & Causes</h4>
                <div className="results-tag-list">
                  {diseaseInfo.causes.map((c) => (
                    <span key={c} className="results-tag results-tag-cause">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Treatment & Cure */}
        {diseaseInfo && (
          <div className="results-section">
            <div className="results-section-header">
              <div className="results-section-icon results-section-icon-treatment">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                </svg>
              </div>
              <div>
                <h3 className="results-section-title">Treatment & Care</h3>
                <p className="results-section-sub">General treatment approaches — always consult your dermatologist</p>
              </div>
            </div>

            {diseaseInfo.treatment?.generalCare?.length > 0 && (
              <div className="results-info-block">
                <h4 className="results-info-label">General Care</h4>
                <ul className="results-list">
                  {diseaseInfo.treatment.generalCare.map((item, i) => (
                    <li key={i} className="results-list-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {diseaseInfo.treatment?.modernMedical?.length > 0 && (
              <div className="results-info-block">
                <h4 className="results-info-label">Medical Treatments</h4>
                <ul className="results-list">
                  {diseaseInfo.treatment.modernMedical.map((item, i) => (
                    <li key={i} className="results-list-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {diseaseInfo.treatment?.consultationNote && (
              <div className="results-consult-note">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                {diseaseInfo.treatment.consultationNote}
              </div>
            )}
          </div>
        )}

        {/* Precautions & Prevention */}
        {diseaseInfo && diseaseInfo.prevention?.length > 0 && (
          <div className="results-section">
            <div className="results-section-header">
              <div className="results-section-icon results-section-icon-prevention">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <h3 className="results-section-title">Precautions & Prevention</h3>
                <p className="results-section-sub">Steps to manage and prevent worsening</p>
              </div>
            </div>
            <ul className="results-list">
              {diseaseInfo.prevention.map((item, i) => (
                <li key={i} className="results-list-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--mild)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Severity Info (if disease has severity descriptions) */}
        {diseaseInfo?.severityInformation && (
          <div className="results-section">
            <div className="results-section-header">
              <div className="results-section-icon results-section-icon-severity">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </div>
              <div>
                <h3 className="results-section-title">Severity Levels</h3>
                <p className="results-section-sub">How this condition presents at different stages</p>
              </div>
            </div>
            <div className="results-severity-grid">
              <div className="results-severity-card results-severity-mild">
                <span className="results-severity-badge results-severity-badge-mild">Mild</span>
                <p>{diseaseInfo.severityInformation.mild}</p>
              </div>
              <div className="results-severity-card results-severity-moderate">
                <span className="results-severity-badge results-severity-badge-moderate">Moderate</span>
                <p>{diseaseInfo.severityInformation.moderate}</p>
              </div>
              <div className="results-severity-card results-severity-severe">
                <span className="results-severity-badge results-severity-badge-severe">Severe</span>
                <p>{diseaseInfo.severityInformation.severe}</p>
              </div>
            </div>
          </div>
        )}

        {/* All Predictions */}
        {topPreds.length > 0 && (
          <div className="results-section">
            <div className="results-section-header">
              <div className="results-section-icon results-section-icon-info">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </div>
              <div>
                <h3 className="results-section-title">All Predictions</h3>
                <p className="results-section-sub">Other possible conditions identified</p>
              </div>
            </div>
            <div className="results-preds-list">
              {topPreds.map((p, i) => {
                const pct = (p.confidence * 100).toFixed(1);
                return (
                  <div key={i} className={`results-pred-row ${i === 0 ? "results-pred-top" : ""}`}>
                    <span className="results-pred-rank">#{i + 1}</span>
                    <div className="results-pred-info">
                      <span className="results-pred-name">{p.condition}</span>
                      <div className="results-pred-bar-track">
                        <div className="results-pred-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="results-pred-conf">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Clinical Factors */}
        {Object.keys(factors).length > 0 && (
          <div className="results-section">
            <div className="results-section-header">
              <div className="results-section-icon results-section-icon-info">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                </svg>
              </div>
              <div>
                <h3 className="results-section-title">Clinical Factors</h3>
                <p className="results-section-sub">Information considered in this analysis</p>
              </div>
            </div>
            <div className="results-factors-grid">
              {factors.age && (
                <div className="results-factor">
                  <span className="results-factor-label">Age</span>
                  <span className="results-factor-value">{factors.age}</span>
                </div>
              )}
              {factors.durationDays && (
                <div className="results-factor">
                  <span className="results-factor-label">Duration</span>
                  <span className="results-factor-value">{factors.durationDays} days</span>
                </div>
              )}
              {factors.itchingLevel > 0 && (
                <div className="results-factor">
                  <span className="results-factor-label">Itching</span>
                  <span className="results-factor-value">{factors.itchingLevel}/10</span>
                </div>
              )}
              {factors.redness > 0 && (
                <div className="results-factor">
                  <span className="results-factor-label">Redness</span>
                  <span className="results-factor-value">{factors.redness}/10</span>
                </div>
              )}
              {factors.dryness > 0 && (
                <div className="results-factor">
                  <span className="results-factor-label">Dryness</span>
                  <span className="results-factor-value">{factors.dryness}/10</span>
                </div>
              )}
              {factors.skinArea && (
                <div className="results-factor">
                  <span className="results-factor-label">Skin Area</span>
                  <span className="results-factor-value">{factors.skinArea}</span>
                </div>
              )}
            </div>
            {factors.symptoms?.length > 0 && (
              <div className="results-factor-symptoms">
                <span className="results-factor-label">Reported Symptoms</span>
                <div className="results-tag-list" style={{ marginTop: 8 }}>
                  {factors.symptoms.map((s) => (
                    <span key={s} className="results-tag results-tag-symptom">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="results-disclaimer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <div>
            <strong>Medical Disclaimer</strong>
            <p>This is an AI-assisted analysis, not a medical diagnosis. Confidence reflects the model's statistical estimate, not medical certainty. Always consult a board-certified dermatologist for diagnosis and treatment.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="results-actions">
          <Link to="/chat" className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Ask DermaAI About This
          </Link>
          <Link to="/analyze" className="btn btn-outline">New Analysis</Link>
          <Link to="/history" className="btn btn-ghost">View History</Link>
        </div>
      </div>
    </div>
  );
}
