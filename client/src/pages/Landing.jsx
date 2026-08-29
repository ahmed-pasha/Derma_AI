import { Link } from "react-router-dom";

const FEATURES = [
  { icon: "🧠", title: "AI Skin Analysis", desc: "Analyze skin images using a CNN-based deep learning pipeline." },
  { icon: "🔗", title: "Multimodal Diagnosis", desc: "Combine image data with clinical information for richer context." },
  { icon: "📊", title: "Severity Prediction", desc: "Classify severity as Mild, Moderate, or Severe." },
  { icon: "📷", title: "Live Camera Scan", desc: "Capture a skin image directly from your device camera." },
  { icon: "📚", title: "Medical Information", desc: "Learn about Atopic Dermatitis, triggers, and care options." },
  { icon: "💬", title: "AI Chat Assistant", desc: "Ask questions about skin health and get educational answers." },
  { icon: "🗂️", title: "Prediction History", desc: "Review and track your previous analyses over time." },
];

const STEPS = [
  { n: "01", title: "Upload or Capture", desc: "Upload a skin image or capture one using your device camera." },
  { n: "02", title: "Provide Clinical Information", desc: "Share age, symptoms, medical history, and other relevant details." },
  { n: "03", title: "AI Analysis", desc: "The system extracts image features, encodes clinical data, and fuses them for prediction." },
  { n: "04", title: "Results", desc: "View predicted condition, confidence, severity, and recommended next steps." },
];

export default function Landing() {
  return (
    <>
      {/* HERO */}
      <section className="section" style={{ paddingTop: 64 }}>
        <div className="container" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 48, alignItems: "center" }}>
          <div>
            <span className="eyebrow">Final-Year AI Healthcare Project</span>
            <h1 style={{ fontSize: "3rem" }}>Understand Your Skin With the Power of AI.</h1>
            <p style={{ fontSize: "1.1rem", maxWidth: 520 }}>
              DermaAI combines skin image analysis and clinical information to assist with Atopic Dermatitis
              detection and severity assessment.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link to="/analyze" className="btn btn-primary">Analyze Your Skin</Link>
              <a href="#how-it-works" className="btn btn-outline">Learn How It Works</a>
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <div className="card card-pad" style={{ background: "linear-gradient(160deg,#fff,var(--primary-light))" }}>
              <div style={{ aspectRatio: "1/1", borderRadius: "var(--radius)", background: "linear-gradient(135deg,#dff3f0,#eef1fd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>
                🩺
              </div>
            </div>
            <div className="card card-pad" style={{ position: "absolute", bottom: -24, left: -24, width: 220, background: "#fff" }}>
              <p className="hint" style={{ marginBottom: 6 }}>AI Analysis (illustrative)</p>
              <p style={{ fontWeight: 700, marginBottom: 2 }}>Atopic Dermatitis</p>
              <span className="badge badge-moderate">Moderate</span>
              <p style={{ fontSize: "0.8rem", marginTop: 8, marginBottom: 0 }}>Confidence: <strong>92%</strong></p>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="section" id="about" style={{ background: "var(--surface)" }}>
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">About</span>
            <h2>What is DermaAI?</h2>
            <p>
              DermaAI is a multimodal AI healthcare-support platform designed to assist with Atopic Dermatitis
              detection and severity prediction. Traditional diagnosis often depends heavily on visual
              examination and specialist expertise — which can be subjective, time-consuming, and hard to
              access consistently.
            </p>
          </div>
          <div className="grid grid-3">
            {[
              { t: "Subjectivity", d: "Visual assessment alone can vary between examiners." },
              { t: "Specialist Availability", d: "Dermatologist access is not equally available to everyone." },
              { t: "Inconsistent Severity", d: "Manual severity scoring can differ from one evaluation to the next." },
            ].map((x) => (
              <div key={x.t} className="card card-pad">
                <h4>{x.t}</h4>
                <p style={{ marginBottom: 0 }}>{x.d}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 32, textAlign: "center" }}>
            DermaAI attempts to improve accessibility and consistency by combining skin images, symptoms,
            medical history, and demographic information into a single multimodal prediction pipeline.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">How It Works</span>
            <h2>From image to insight in four steps</h2>
          </div>
          <div className="grid grid-4">
            {STEPS.map((s) => (
              <div key={s.n} className="card card-pad">
                <div style={{ color: "var(--primary)", fontWeight: 800, fontSize: "1.3rem", marginBottom: 8 }}>{s.n}</div>
                <h4>{s.title}</h4>
                <p style={{ marginBottom: 0, fontSize: "0.9rem" }}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="card card-pad" style={{ marginTop: 32, textAlign: "center", fontFamily: "monospace", fontSize: "0.85rem", color: "var(--text-muted)", whiteSpace: "pre-wrap" }}>
{`Skin Image → CNN Feature Extraction → Clinical Data Encoding → Multimodal Feature Fusion → Prediction Model`}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section" id="features" style={{ background: "var(--surface)" }}>
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Features</span>
            <h2>Everything you need for a modern skin-health assistant</h2>
          </div>
          <div className="grid grid-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card card-pad">
                <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
                <h4>{f.title}</h4>
                <p style={{ marginBottom: 0, fontSize: "0.9rem" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <div className="card card-pad" style={{ textAlign: "center", background: "linear-gradient(135deg,var(--primary-light),#eef1fd)", padding: 56 }}>
            <h2>Ready to try DermaAI?</h2>
            <p style={{ maxWidth: 480, margin: "0 auto 24px" }}>Create a free account to upload an image, get an AI-assisted analysis, and track your history over time.</p>
            <Link to="/signup" className="btn btn-primary">Get Started</Link>
          </div>
        </div>
      </section>
    </>
  );
}
