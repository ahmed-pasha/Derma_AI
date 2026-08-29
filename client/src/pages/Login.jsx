import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", remember: true });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 440 }}>
        <div className="card card-pad">
          <h2 style={{ textAlign: "center" }}>Welcome back</h2>
          <p style={{ textAlign: "center" }}>Log in to view your dashboard and analysis history.</p>

          <form onSubmit={submit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" required value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 400, fontSize: "0.85rem" }}>
                <input type="checkbox" checked={form.remember} style={{ width: "auto" }}
                  onChange={(e) => setForm({ ...form, remember: e.target.checked })} />
                Remember me
              </label>
              <Link to="/contact" style={{ fontSize: "0.85rem", color: "var(--primary-dark)" }}>Forgot password?</Link>
            </div>

            {error && <p className="error-text" style={{ marginBottom: 14 }}>{error}</p>}

            <button className="btn btn-primary btn-block" disabled={loading}>
              {loading ? <span className="spinner" /> : "Login"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 18, fontSize: "0.9rem" }}>
            Don't have an account? <Link to="/signup" style={{ color: "var(--primary-dark)", fontWeight: 600 }}>Sign up</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
