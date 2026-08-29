const FAQS = [
  { q: "Is DermaAI a replacement for a dermatologist?", a: "No. DermaAI provides AI-assisted, educational information. It does not replace examination, diagnosis, or treatment by a qualified healthcare professional." },
  { q: "How does the AI work?", a: "It combines image analysis (a CNN-based model) with clinical information you provide, fusing both into a single prediction of condition and severity." },
  { q: "What condition does the current model detect?", a: "The current model focuses on Atopic Dermatitis detection and severity classification (Mild, Moderate, Severe)." },
  { q: "Can I upload an image?", a: "Yes — JPG, PNG, and WEBP images are supported via drag-and-drop or file selection." },
  { q: "Can I use my phone camera?", a: "Yes. The Live Scan page uses your browser's camera access to capture a still image for analysis." },
  { q: "Does DermaAI store my results?", a: "Authenticated users can have their prediction history securely stored and reviewed later." },
  { q: "Is the prediction guaranteed to be correct?", a: "No. AI predictions are assistive and should be professionally verified by a dermatologist." },
];

export default function FAQ() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="section-header">
          <span className="eyebrow">FAQ</span>
          <h2>Frequently Asked Questions</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {FAQS.map((f) => (
            <details key={f.q} className="card card-pad">
              <summary style={{ fontWeight: 700, cursor: "pointer" }}>{f.q}</summary>
              <p style={{ marginTop: 10, marginBottom: 0 }}>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
