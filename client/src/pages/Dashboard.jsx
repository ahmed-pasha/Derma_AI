import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

const QUICK_ACTIONS = [
  {
    to: "/live-scan",
    title: "Live Skin Scan",
    desc: "Use your camera to capture and analyze",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
    ),
  },
  {
    to: "/analyze",
    title: "Upload Image",
    desc: "Upload a photo from your device",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
  },
  {
    to: "/chat",
    title: "Chat Assistant",
    desc: "Ask questions about your skin health",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    to: "/history",
    title: "Scan History",
    desc: "Review your previous analyses",
    gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/predictions")
      .then(({ data }) => setPredictions(data.predictions))
      .catch(() => setError("Unable to load your recent analyses right now."));
  }, []);

  const latest = predictions?.[0];
  const total = predictions?.length || 0;
  const conditionCounts = {};
  predictions?.forEach((p) => {
    conditionCounts[p.condition] = (conditionCounts[p.condition] || 0) + 1;
  });
  const mostCommon = Object.entries(conditionCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  const lowConfCount = predictions?.filter((p) => p.isLowConfidence).length || 0;

  return (
    <div className="dash">
      <div className="dash-inner">
        {/* Hero Banner */}
        <div className="dash-hero">
          <div className="dash-hero-content">
            <div className="dash-hero-avatar">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <h2 className="dash-hero-title">{greeting()}, {user?.name?.split(" ")[0] || "there"} 👋</h2>
              <p className="dash-hero-sub">Welcome to your DermaAI dashboard</p>
            </div>
          </div>
          <Link to="/analyze" className="dash-hero-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Analysis
          </Link>
        </div>

        {/* Stats Row */}
        <div className="dash-stats">
          <div className="dash-stat-card">
            <div className="dash-stat-icon" style={{ background: "linear-gradient(135deg, #667eea22, #764ba222)", color: "#667eea" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div className="dash-stat-info">
              <span className="dash-stat-value">{total}</span>
              <span className="dash-stat-label">Total Scans</span>
            </div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-icon" style={{ background: "linear-gradient(135deg, #43e97b22, #38f9d722)", color: "#0fa" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div className="dash-stat-info">
              <span className="dash-stat-value">{mostCommon || "—"}</span>
              <span className="dash-stat-label">Most Common</span>
            </div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-icon" style={{ background: "linear-gradient(135deg, #f093fb22, #f5576c22)", color: "#f5576c" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div className="dash-stat-info">
              <span className="dash-stat-value">{lowConfCount > 0 ? lowConfCount : "0"}</span>
              <span className="dash-stat-label">Low Confidence</span>
            </div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-icon" style={{ background: "linear-gradient(135deg, #4facfe22, #00f2fe22)", color: "#4facfe" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div className="dash-stat-info">
              <span className="dash-stat-value">{latest ? new Date(latest.createdAt).toLocaleDateString() : "—"}</span>
              <span className="dash-stat-label">Last Scan</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dash-section-header">
          <h3 className="dash-section-title">Quick Actions</h3>
        </div>
        <div className="dash-actions">
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.to} to={a.to} className="dash-action-card">
              <div className="dash-action-icon" style={{ background: a.gradient }}>
                {a.icon}
              </div>
              <div className="dash-action-info">
                <h4 className="dash-action-title">{a.title}</h4>
                <p className="dash-action-desc">{a.desc}</p>
              </div>
              <svg className="dash-action-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>
          ))}
        </div>

        {/* Bottom Grid: Latest + Health */}
        <div className="dash-bottom">
          {/* Latest Analysis */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3 className="dash-section-title">Latest Analysis</h3>
              {latest && (
                <Link to={`/results/${latest._id}`} className="dash-panel-link">View Report →</Link>
              )}
            </div>
            {predictions === null && !error && (
              <div className="dash-loading">
                <LoadingSpinner />
              </div>
            )}
            {error && <p className="error-text">{error}</p>}
            {predictions && predictions.length === 0 && (
              <div className="dash-empty">
                <div className="dash-empty-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                <p className="dash-empty-text">No analyses yet</p>
                <p className="dash-empty-sub">Start by uploading a skin image or using the live scanner</p>
                <Link to="/analyze" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                  Analyze Your Skin
                </Link>
              </div>
            )}
            {latest && (
              <div className="dash-latest">
                {latest.imageUrl && (
                  <img src={latest.imageUrl} alt="Latest scan" className="dash-latest-img" />
                )}
                <div className="dash-latest-info">
                  <div className="dash-latest-condition">{latest.condition}</div>
                  <div className="dash-latest-meta">
                    <span className="dash-latest-confidence">
                      {((latest.confidence || 0) * 100).toFixed(1)}% confidence
                    </span>
                    {latest.demoMode && <span className="badge badge-demo">Demo</span>}
                  </div>
                  <div className="dash-latest-time">
                    {new Date(latest.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Health Summary */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3 className="dash-section-title">Health Summary</h3>
            </div>
            <div className="dash-health">
              <div className="dash-health-item">
                <div className="dash-health-ring" style={{ "--pct": total > 0 ? Math.min((total / 10) * 100, 100) : 0, "--ring-color": "#667eea" }}>
                  <span className="dash-health-ring-val">{total}</span>
                </div>
                <span className="dash-health-label">Scans</span>
              </div>
              <div className="dash-health-item">
                <div className="dash-health-ring" style={{ "--pct": total > 0 ? Math.max(((total - lowConfCount) / total) * 100, 0) : 0, "--ring-color": "#43e97b" }}>
                  <span className="dash-health-ring-val">{total > 0 ? Math.round(((total - lowConfCount) / total) * 100) : 0}%</span>
                </div>
                <span className="dash-health-label">Accuracy</span>
              </div>
              <div className="dash-health-item">
                <div className="dash-health-ring" style={{ "--pct": 100, "--ring-color": "#4facfe" }}>
                  <span className="dash-health-ring-val">{lowConfCount}</span>
                </div>
                <span className="dash-health-label">Review Needed</span>
              </div>
            </div>

            {total > 0 && (
              <div className="dash-conditions-list">
                <p className="dash-conditions-heading">Condition Breakdown</p>
                {Object.entries(conditionCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cond, count]) => (
                    <div key={cond} className="dash-condition-row">
                      <span className="dash-condition-name">{cond}</span>
                      <div className="dash-condition-bar-track">
                        <div
                          className="dash-condition-bar-fill"
                          style={{ width: `${(count / total) * 100}%` }}
                        />
                      </div>
                      <span className="dash-condition-count">{count}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
