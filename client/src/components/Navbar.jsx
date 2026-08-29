import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/#about", label: "About" },
  { to: "/#how-it-works", label: "How It Works" },
  { to: "/team", label: "Team" },
  { to: "/#features", label: "Features" },
  { to: "/research", label: "Research" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(251,253,253,0.85)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--border)" }}>
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: "1.25rem" }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,var(--primary),var(--accent))", display: "inline-block" }} />
          DermaAI
        </Link>

        <nav className="nav-desktop" style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {links.map((l) => (
            <a key={l.label} href={l.to} style={{ fontSize: "0.92rem", fontWeight: 500, color: "var(--text-muted)" }}>
              {l.label}
            </a>
          ))}
        </nav>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {user ? (
            <>
              <Link to="/dashboard" className="btn btn-outline btn-sm">Dashboard</Link>
              <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate("/"); }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm nav-desktop">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
          <button aria-label="Toggle menu" className="btn btn-ghost nav-mobile-toggle" onClick={() => setOpen((o) => !o)} style={{ display: "none" }}>
            ☰
          </button>
        </div>
      </div>

      {open && (
        <div className="container" style={{ paddingBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {links.map((l) => (
            <a key={l.label} href={l.to} onClick={() => setOpen(false)}>{l.label}</a>
          ))}
          {!user && <Link to="/login" onClick={() => setOpen(false)}>Login</Link>}
        </div>
      )}

      <style>{`
        @media (max-width: 860px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-toggle { display: inline-flex !important; }
        }
      `}</style>
    </header>
  );
}
