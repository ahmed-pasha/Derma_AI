export default function Research() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <span className="eyebrow">Research</span>
        <h1>Research Foundation</h1>

        <h3>Problem</h3>
        <p>Traditional diagnosis of Atopic Dermatitis can be subjective and depends heavily on specialist expertise, leading to inconsistent severity assessment and limited accessibility for many patients.</p>

        <h3>Existing Systems</h3>
        <ul>
          <li>Manual diagnosis based on visual examination</li>
          <li>Image-based CNN classification systems</li>
          <li>SCORAD-based (Scoring Atopic Dermatitis) severity assessment</li>
        </ul>

        <h3>Proposed System</h3>
        <p>DermaAI proposes a multimodal AI approach that combines skin images with clinical data (symptoms, duration, itching/redness/dryness levels, medical history) to produce a more informed and consistent prediction than either signal alone.</p>

        <h3>Methodology</h3>
        <div className="card card-pad" style={{ fontFamily: "monospace", fontSize: "0.85rem", whiteSpace: "pre-wrap", color: "var(--text-muted)" }}>
{`Data Collection
      ↓
Preprocessing
      ↓
Feature Extraction
      ↓
Multimodal Fusion
      ↓
Training
      ↓
Evaluation
      ↓
Prediction`}
        </div>

        <p style={{ marginTop: 24, fontSize: "0.85rem" }}>
          This page summarizes the research direction underlying this final-year project. See the
          <code> ml/README.md</code> and <code>ml/dataset/README.md</code> in the project source for full
          technical and dataset documentation.
        </p>
      </div>
    </section>
  );
}
