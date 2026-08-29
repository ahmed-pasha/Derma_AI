import { useEffect, useState } from "react";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function ModelMetrics() {
  const [status, setStatus] = useState(null);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    api
      .get("/model/status")
      .then(({ data }) => setStatus(data))
      .catch(() =>
        setStatus({
          status: "Unable to reach ML service.",
          model_loaded: false,
          demo_mode: true,
        })
      );
    api
      .get("/model/metrics")
      .then(({ data }) => setMetrics(data))
      .catch(() => setMetrics({ available: false }));
  }, []);

  if (!status || !metrics) return <LoadingSpinner full />;

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <div className="section-header" style={{ maxWidth: "none" }}>
          <span className="eyebrow">Model Metrics</span>
          <h2>Model Performance</h2>
        </div>

        <div className="card card-pad" style={{ marginBottom: 24 }}>
          <p style={{ marginBottom: 4 }}>
            <strong>Model version:</strong> {status.model_version || "unknown"}
          </p>
          <p style={{ marginBottom: 4 }}>
            <strong>Architecture:</strong> {status.backbone || "unknown"}
          </p>
          <p style={{ marginBottom: 4 }}>
            <strong>Classes:</strong> {status.num_classes || "unknown"}
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>Status:</strong> {status.status}
          </p>
          {status.demo_mode && (
            <span className="badge badge-demo" style={{ marginTop: 10 }}>
              Demo Mode Active — No trained model loaded
            </span>
          )}
        </div>

        {!metrics.available ? (
          <div className="card card-pad" style={{ textAlign: "center" }}>
            <h4>Model status: Training required</h4>
            <p style={{ marginBottom: 0 }}>
              No trained model metrics found. Train the model first with{" "}
              <code>python -m training.train</code> from the{" "}
              <code>ml/</code> directory.
            </p>
          </div>
        ) : (
          <>
            <h3>Overall Metrics (100-Class Classification)</h3>
            <div className="grid grid-4">
              <Stat label="Accuracy" value={metrics.accuracy} />
              <Stat label="Precision (macro)" value={metrics.precision_macro} />
              <Stat label="Recall (macro)" value={metrics.recall_macro} />
              <Stat label="F1 Score (macro)" value={metrics.f1_macro} />
            </div>

            <h3 style={{ marginTop: 32 }}>Weighted Metrics</h3>
            <div className="grid grid-3">
              <Stat label="Precision (weighted)" value={metrics.precision_weighted} />
              <Stat label="Recall (weighted)" value={metrics.recall_weighted} />
              <Stat label="F1 Score (weighted)" value={metrics.f1_weighted} />
            </div>

            {metrics.per_class && Object.keys(metrics.per_class).length > 0 && (
              <>
                <h3 style={{ marginTop: 32 }}>Per-Class Metrics (Top Conditions)</h3>
                <div style={{ maxHeight: 400, overflowY: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border)", background: "var(--bg)" }}>
                        <th style={{ textAlign: "left", padding: "10px 12px" }}>Class</th>
                        <th style={{ textAlign: "right", padding: "10px 12px" }}>Precision</th>
                        <th style={{ textAlign: "right", padding: "10px 12px" }}>Recall</th>
                        <th style={{ textAlign: "right", padding: "10px 12px" }}>F1</th>
                        <th style={{ textAlign: "right", padding: "10px 12px" }}>Support</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(metrics.per_class)
                        .sort((a, b) => b[1].support - a[1].support)
                        .slice(0, 30)
                        .map(([cls, m]) => (
                          <tr key={cls} style={{ borderBottom: "1px solid var(--border)" }}>
                            <td style={{ padding: "8px 12px", fontWeight: 500 }}>{cls}</td>
                            <td style={{ padding: "8px 12px", textAlign: "right" }}>{(m.precision * 100).toFixed(1)}%</td>
                            <td style={{ padding: "8px 12px", textAlign: "right" }}>{(m["recall"] * 100).toFixed(1)}%</td>
                            <td style={{ padding: "8px 12px", textAlign: "right" }}>{(m["f1-score"] * 100).toFixed(1)}%</td>
                            <td style={{ padding: "8px 12px", textAlign: "right", color: "var(--text-muted)" }}>{m.support}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <p className="hint" style={{ marginTop: 20 }}>
              Evaluated on {metrics.evaluated_on_samples} held-out test samples. These are
              real measured values from <code>ml/training/evaluate.py</code> — never fabricated.
            </p>
          </>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  if (value == null) return null;
  return (
    <div className="card card-pad" style={{ textAlign: "center" }}>
      <p className="hint" style={{ marginBottom: 4 }}>{label}</p>
      <p
        style={{
          fontWeight: 800,
          fontSize: "1.4rem",
          marginBottom: 0,
          color: "var(--primary-dark)",
        }}
      >
        {(value * 100).toFixed(1)}%
      </p>
    </div>
  );
}
