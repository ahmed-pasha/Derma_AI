import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", padding: "48px 0 28px", marginTop: 60 }}>
      <div className="container">
        <div className="disclaimer">
          <strong>Medical Disclaimer:</strong> DermaAI is an AI-assisted educational and decision-support
          system developed as a student project. It does not replace examination, diagnosis, or treatment
          by a qualified healthcare professional. Predictions may be inaccurate. Users should consult a
          dermatologist or other qualified healthcare professional for medical advice.
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "space-between", marginTop: 24 }}>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>DermaAI</div>
            <p style={{ maxWidth: 320, fontSize: "0.85rem" }}>AI-Powered Skin Health, Smarter Diagnosis. A final-year academic project.</p>
          </div>
          <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: 8 }}>Product</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.85rem" }}>
                <Link to="/conditions">Skin Conditions</Link>
                <Link to="/research">Research</Link>
                <Link to="/faq">FAQ</Link>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: 8 }}>Account</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.85rem" }}>
                <Link to="/login">Login</Link>
                <Link to="/signup">Sign Up</Link>
                <Link to="/contact">Contact</Link>
              </div>
            </div>
          </div>
        </div>
        <p style={{ fontSize: "0.75rem", marginTop: 32 }}>© {new Date().getFullYear()} DermaAI Final-Year Project. All rights reserved.</p>
      </div>
    </footer>
  );
}
