import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function History() {
  const [predictions, setPredictions] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortDesc, setSortDesc] = useState(true);

  const load = () => {
    api
      .get("/predictions")
      .then(({ data }) => setPredictions(data.predictions))
      .catch(() => setError("Unable to load your history."));
  };

  useEffect(load, []);

  const remove = async (id) => {
    if (!window.confirm("Delete this analysis from your history? This cannot be undone."))
      return;
    await api.delete(`/predictions/${id}`);
    setPredictions((prev) => prev.filter((p) => p._id !== id));
  };

  const filtered = useMemo(() => {
    if (!predictions) return [];
    let list = predictions.filter((p) =>
      p.condition.toLowerCase().includes(search.toLowerCase())
    );
    list = [...list].sort((a, b) =>
      sortDesc
        ? new Date(b.createdAt) - new Date(a.createdAt)
        : new Date(a.createdAt) - new Date(b.createdAt)
    );
    return list;
  }, [predictions, search, sortDesc]);

  return (
    <section className="section">
      <div className="container">
        <div className="section-header" style={{ marginBottom: 24, maxWidth: "none" }}>
          <span className="eyebrow">History</span>
          <h2>Your Analysis History</h2>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
          <input
            placeholder="Search by condition..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 240 }}
          />
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setSortDesc((s) => !s)}
          >
            Sort: {sortDesc ? "Newest First" : "Oldest First"}
          </button>
        </div>

        {predictions === null && !error && <LoadingSpinner />}
        {error && <p className="error-text">{error}</p>}
        {predictions && filtered.length === 0 && (
          <div className="card card-pad" style={{ textAlign: "center" }}>
            <p style={{ marginBottom: 12 }}>No analyses match your filters yet.</p>
            <Link to="/analyze" className="btn btn-primary btn-sm">
              Analyze Your Skin
            </Link>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map((p) => (
            <div
              key={p._id}
              className="card card-pad"
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <img
                src={p.imageUrl}
                alt=""
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "var(--radius-sm)",
                  objectFit: "cover",
                }}
              />
              <div style={{ flex: 1, minWidth: 180 }}>
                <p className="hint" style={{ marginBottom: 2 }}>
                  {new Date(p.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <strong>{p.condition}</strong>
                {p.isLowConfidence && (
                  <span className="badge badge-demo" style={{ marginLeft: 8, fontSize: "0.7rem" }}>
                    Low Confidence
                  </span>
                )}
              </div>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                {(p.confidence * 100).toFixed(1)}%
              </span>
              <Link to={`/results/${p._id}`} className="btn btn-outline btn-sm">
                View Report
              </Link>
              <button
                className="btn btn-ghost btn-sm"
                style={{ color: "var(--danger)" }}
                onClick={() => remove(p._id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
