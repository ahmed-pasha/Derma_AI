import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const S = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...S}>{children}</svg>
);

const FEATURES = [
  {
    title: "AI skin analysis",
    desc: "Deep-learning scans of your photos in seconds.",
    icon: (
      <Icon><path d="M12 2l1.8 4.9L18.5 8l-4.7 1.1L12 14l-1.8-4.9L5.5 8l4.7-1.1z" /><path d="M18 15l.9 2.1 2.1.9-2.1.9L18 21l-.9-2.1-2.1-.9 2.1-.9z" /></Icon>
    ),
  },
  {
    title: "Track your history",
    desc: "Monitor how your skin changes over time.",
    icon: (
      <Icon><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></Icon>
    ),
  },
  {
    title: "Ask Dr. AI",
    desc: "Get educational answers around the clock.",
    icon: (
      <Icon><path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z" /><path d="M9 10h6M9 14h4" /></Icon>
    ),
  },
  {
    title: "Privacy first",
    desc: "Your data is encrypted and never sold.",
    icon: (
      <Icon><path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></Icon>
    ),
  },
];

const strengthOf = (pw) => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score += 1;
  return score;
};

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["#eef0f4", "#e0522c", "#e0a52c", "#37b26c", "#0f9b8e"];

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "", age: "", gender: "prefer_not_to_say", agreedToTerms: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (patch) => setForm({ ...form, ...patch });

  const strength = strengthOf(form.password);
  const strengthColor = STRENGTH_COLORS[strength];

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!form.agreedToTerms) {
      setError("Please agree to the terms to continue.");
      return;
    }
    setLoading(true);
    try {
      await register({ ...form, age: form.age ? Number(form.age) : undefined });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-shell">
        <aside className="auth-aside">
          <div className="auth-aside-mark">
            <svg viewBox="0 0 24 24" width="24" height="24" {...S}>
              <path d="M12 3l1.8 4.9L18.5 9l-4.7 1.1L12 15l-1.8-4.9L5.5 9l4.7-1.1z" />
            </svg>
          </div>
          <p className="auth-aside-brand">Derma<span>AI</span></p>
          <h2 className="auth-aside-title">Your AI-powered skin care companion</h2>
          <p className="auth-aside-sub">Smarter analysis. Clearer skin. All in one place.</p>

          <ul className="auth-aside-features">
            {FEATURES.map((f) => (
              <li key={f.title} className="auth-aside-feature">
                <span className="auth-aside-icon">{f.icon}</span>
                <span className="auth-aside-feature-text">
                  <strong>{f.title}</strong>
                  <span>{f.desc}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="auth-aside-note">
            <svg viewBox="0 0 24 24" width="16" height="16" {...S}><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></svg>
            Educational information only — not a medical diagnosis.
          </div>
        </aside>

        <div className="auth-form-side">
          <span className="auth-eyebrow">Join DermaAI</span>
          <h2 className="auth-title">Create your account</h2>
          <p className="auth-sub">Start your skin health journey — it takes less than a minute.</p>

          <form onSubmit={submit} noValidate>
            <div className="auth-field">
              <span className="auth-field-icon">
                <Icon><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Icon>
              </span>
              <input className="auth-input" id="name" required value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Jane Doe" autoComplete="name" />
              <span className="auth-field-bar"></span>
            </div>

            <div className="auth-field">
              <span className="auth-field-icon">
                <Icon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></Icon>
              </span>
              <input className="auth-input" id="email" type="email" required value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="you@example.com" autoComplete="email" />
            </div>

            <div className="auth-grid">
              <div>
                <div className="auth-field">
                  <span className="auth-field-icon">
                    <Icon><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Icon>
                  </span>
                  <input className="auth-input" id="password" type="password" required minLength={8} value={form.password} onChange={(e) => set({ password: e.target.value })} placeholder="At least 8 characters" autoComplete="new-password" />
                </div>
                <div className="auth-strength">
                  {[1, 2, 3, 4].map((s) => (
                    <span key={s} className="auth-strength-seg" style={s <= strength ? { background: strengthColor } : undefined} />
                  ))}
                  <span className="auth-strength-label" style={{ color: strength ? strengthColor : "var(--text-muted)" }}>
                    {strength ? STRENGTH_LABELS[strength] : "Password strength"}
                  </span>
                </div>
              </div>

              <div className="auth-field">
                <span className="auth-field-icon">
                  <Icon><path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></Icon>
                </span>
                <input className="auth-input" id="confirmPassword" type="password" required value={form.confirmPassword} onChange={(e) => set({ confirmPassword: e.target.value })} placeholder="Re-enter password" autoComplete="new-password" />
              </div>
            </div>

            <div className="auth-grid">
              <div className="auth-field">
                <span className="auth-field-icon">
                  <Icon><circle cx="12" cy="12" r="9" /><path d="M12 3a15 15 0 0 0 0 18M3 12h18M12 3a15 15 0 0 1 0 18" /></Icon>
                </span>
                <input className="auth-input" id="age" type="number" min="1" max="120" value={form.age} onChange={(e) => set({ age: e.target.value })} placeholder="e.g. 29" />
              </div>

              <div className="auth-field auth-field-select">
                <span className="auth-field-icon">
                  <Icon><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></Icon>
                </span>
                <select className="auth-input auth-select" id="gender" value={form.gender} onChange={(e) => set({ gender: e.target.value })}>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <label className="auth-terms">
              <input type="checkbox" className="auth-checkbox" checked={form.agreedToTerms}
                onChange={(e) => set({ agreedToTerms: e.target.checked })} />
              <span>
                I understand DermaAI provides <strong>AI-assisted educational information</strong>, not a medical diagnosis, and I agree to the
                <Link to="/conditions" onClick={(e) => e.stopPropagation()}> terms of use</Link>.
              </span>
            </label>

            {error && <p className="auth-error">{error}</p>}

            <button className="btn auth-submit" type="submit" disabled={loading}>
              {loading ? <span className="spinner auth-spinner" /> : (
                <>
                  Create Account
                  <svg viewBox="0 0 24 24" width="18" height="18" {...S}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </>
              )}
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </section>
  );
}