import { Link } from "react-router-dom";

export default function ResultCard({ prediction, compact }) {
  if (!prediction) return null;
  const {
    condition,
    confidence,
    severity,
    topPredictions,
    isLowConfidence,
    imageUrl,
    demoMode,
    modelVersion,
    errorMessage,
    createdAt,
    _id,
  } = prediction;

  const confPct = (confidence * 100).toFixed(1);
  const severityColors = { mild: "var(--mild)", moderate: "var(--moderate)", severe: "var(--severe)" };
  const severityColor = severityColors[severity] || "var(--mild)";

  return (
    <div className="card card-pad">
      {demoMode && (
        <div className="badge badge-demo" style={{ marginBottom: 16 }}>
          Demo Mode — no trained model loaded
        </div>
      )}

      {isLowConfidence && !demoMode && (
        <div className="low-confidence-warning" style={{ marginBottom: 16 }}>
          Low Confidence Warning — the model is uncertain about this prediction.
          Please consult a dermatologist.
        </div>
      )}

      {errorMessage && (
        <div className="low-confidence-warning" style={{ marginBottom: 16 }}>
          {errorMessage}
        </div>
      )}

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Analyzed skin area"
            style={{
              width: compact ? 100 : 180,
              height: compact ? 100 : 180,
              objectFit: "cover",
              borderRadius: "var(--radius-sm)",
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 200 }}>
          <p className="hint" style={{ marginBottom: 2 }}>
            Predicted Condition
          </p>
          <h3 style={{ marginBottom: 10 }}>{condition}</h3>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Confidence: <strong style={{ color: "var(--text)" }}>{confPct}%</strong>
            </span>
            {severity && (
              <span style={{
                fontSize: "0.78rem", fontWeight: 700, color: severityColor,
                background: `${severityColor}15`, padding: "3px 10px", borderRadius: 999,
              }}>
                {severity.charAt(0).toUpperCase() + severity.slice(1)}
              </span>
            )}
            {modelVersion && (
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Model v{modelVersion}
              </span>
            )}
          </div>

          {!compact && topPredictions && topPredictions.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <p className="hint" style={{ marginBottom: 6 }}>Top Predictions</p>
              {topPredictions.map((pred, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: 3 }}>
                    <span style={{ fontWeight: 600 }}>{i + 1}. {pred.condition}</span>
                    <span style={{ color: "var(--text-muted)" }}>{(pred.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="confidence-bar-track">
                    <div className="confidence-bar-fill" style={{ width: `${pred.confidence * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {createdAt && (
            <p className="hint" style={{ marginTop: 8 }}>{new Date(createdAt).toLocaleString()}</p>
          )}
        </div>
      </div>

      {!compact && (
        <p style={{ fontSize: "0.85rem", marginTop: 12 }}>
          This confidence score reflects the model&apos;s estimate, not medical
          certainty. Please consult a dermatologist for a confirmed diagnosis.
        </p>
      )}

      {!compact && _id && (
        <Link to={`/results/${_id}`} className="btn btn-outline btn-sm">
          View Full Report
        </Link>
      )}
    </div>
  );
}
