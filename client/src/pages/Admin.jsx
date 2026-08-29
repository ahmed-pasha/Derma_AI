import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Admin() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [predictions, setPredictions] = useState(null);

  useEffect(() => {
    api.get("/model/status").then(({ data }) => setStatus(data)).catch(() => {});
    api.get("/model/metrics").then(({ data }) => setMetrics(data)).catch(() => {});
    api.get("/predictions").then(({ data }) => setPredictions(data.predictions)).catch(() => {});
  }, []);

  if (user && user.role !== "admin") {
    return (
      <section className="section container" style={{ textAlign: "center" }}>
        <p>Admin access required. This area is restricted to administrator accounts.</p>
      </section>
    );
  }

  if (!status || !predictions) return <LoadingSpinner full />;

  return (
    <section className="section">
      <div className="container">
        <div className="section-header" style={{ maxWidth: "none" }}>
          <span className="eyebrow">Admin</span>
          <h2>Admin Dashboard</h2>
          <p>
            Note: this scaffold's "Total Users" / "Total Analyses" counts reflect only data reachable via
            the current user-scoped API. Wire dedicated admin-only aggregate endpoints (e.g.
            <code> GET /api/admin/stats</code>) before relying on this in production.
          </p>
        </div>

        <div className="grid grid-4" style={{ marginBottom: 32 }}>
          <div className="card card-pad" style={{ textAlign: "center" }}>
            <p className="hint">Model Version</p>
            <p style={{ fontWeight: 800, marginBottom: 0 }}>{status.model_version || "—"}</p>
          </div>
          <div className="card card-pad" style={{ textAlign: "center" }}>
            <p className="hint">Demo Mode</p>
            <p style={{ fontWeight: 800, marginBottom: 0 }}>{status.demo_mode ? "Yes" : "No"}</p>
          </div>
          <div className="card card-pad" style={{ textAlign: "center" }}>
            <p className="hint">Accuracy</p>
            <p style={{ fontWeight: 800, marginBottom: 0 }}>{metrics?.available ? `${(metrics.disease.accuracy * 100).toFixed(1)}%` : "N/A"}</p>
          </div>
          <div className="card card-pad" style={{ textAlign: "center" }}>
            <p className="hint">Recent Predictions (this account)</p>
            <p style={{ fontWeight: 800, marginBottom: 0 }}>{predictions.length}</p>
          </div>
        </div>

        <h3>Recent Predictions</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {predictions.slice(0, 10).map((p) => (
            <div key={p._id} className="card card-pad" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <span>{p.condition}</span>
              <span>{p.severity}</span>
              <span>{(p.confidence * 100).toFixed(1)}%</span>
              <span className="hint">{new Date(p.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
