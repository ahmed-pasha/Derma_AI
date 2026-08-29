const SYMPTOM_OPTIONS = [
  { label: "Dry skin", icon: "🏜️" },
  { label: "Itching", icon: "✋" },
  { label: "Redness", icon: "🔴" },
  { label: "Irritation", icon: "⚡" },
  { label: "Rash", icon: "🔴" },
  { label: "Swelling", icon: "💧" },
  { label: "Cracking/flaking", icon: "🌿" },
  { label: "Pain/soreness", icon: "💢" },
  { label: "Blisters", icon: "💧" },
  { label: "Discoloration", icon: "🎨" },
];

const SKIN_AREAS = [
  { value: "face", label: "Face", icon: "😊" },
  { value: "arms", label: "Arms", icon: "💪" },
  { value: "legs", label: "Legs", icon: "🦵" },
  { value: "torso", label: "Torso", icon: "🫁" },
  { value: "hands", label: "Hands", icon: "🤲" },
  { value: "scalp", label: "Scalp", icon: "💇" },
  { value: "neck", label: "Neck", icon: "🦴" },
  { value: "other", label: "Other", icon: "❓" },
];

export default function ClinicalForm({ value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch });

  const toggleSymptom = (symptom) => {
    const symptoms = value.symptoms.includes(symptom)
      ? value.symptoms.filter((s) => s !== symptom)
      : [...value.symptoms, symptom];
    set({ symptoms });
  };

  return (
    <div className="clinical">
      {/* Basic Info */}
      <div className="clinical-row">
        <div className="clinical-field">
          <label className="clinical-label" htmlFor="age">Age</label>
          <input id="age" type="number" min="0" max="120" value={value.age}
            onChange={(e) => set({ age: e.target.value })} placeholder="e.g. 29"
            className="clinical-input" />
        </div>
        <div className="clinical-field">
          <label className="clinical-label" htmlFor="duration">Duration (days)</label>
          <input id="duration" type="number" min="0" value={value.durationDays}
            onChange={(e) => set({ durationDays: e.target.value })} placeholder="e.g. 14"
            className="clinical-input" />
        </div>
      </div>

      {/* Symptoms */}
      <div className="clinical-field">
        <label className="clinical-label">Symptoms <span className="clinical-label-hint">— select all that apply</span></label>
        <div className="clinical-symptoms">
          {SYMPTOM_OPTIONS.map((s) => (
            <button
              key={s.label}
              type="button"
              className={`clinical-symptom ${value.symptoms.includes(s.label) ? "clinical-symptom-active" : ""}`}
              onClick={() => toggleSymptom(s.label)}
            >
              <span className="clinical-symptom-icon">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="clinical-sliders">
        {[
          { key: "itchingLevel", label: "Itching", color: "#f59e0b" },
          { key: "redness", label: "Redness", color: "#ef4444" },
          { key: "dryness", label: "Dryness", color: "#6366f1" },
        ].map(({ key, label, color }) => (
          <div className="clinical-slider" key={key}>
            <div className="clinical-slider-header">
              <label className="clinical-label" htmlFor={key}>{label}</label>
              <span className="clinical-slider-value" style={{ color }}>{value[key]}/10</span>
            </div>
            <div className="clinical-slider-track-wrapper">
              <input id={key} type="range" min="0" max="10" value={value[key]}
                onChange={(e) => set({ [key]: Number(e.target.value) })}
                className="clinical-range"
                style={{ "--range-color": color, "--range-pct": `${(value[key] / 10) * 100}%` }} />
            </div>
            <div className="clinical-slider-labels">
              <span>None</span><span>Mild</span><span>Severe</span>
            </div>
          </div>
        ))}
      </div>

      {/* Skin Area */}
      <div className="clinical-field">
        <label className="clinical-label">Affected Skin Area</label>
        <div className="clinical-areas">
          {SKIN_AREAS.map((a) => (
            <button
              key={a.value}
              type="button"
              className={`clinical-area ${value.skinArea === a.value ? "clinical-area-active" : ""}`}
              onClick={() => set({ skinArea: a.value })}
            >
              <span className="clinical-area-icon">{a.icon}</span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Previous Diagnosis */}
      <div className="clinical-field">
        <label className="clinical-label">Previous Diagnosis</label>
        <div className="clinical-toggle-group">
          <button
            type="button"
            className={`clinical-toggle ${!value.previousDiagnosis ? "clinical-toggle-active" : ""}`}
            onClick={() => set({ previousDiagnosis: false })}
          >
            No
          </button>
          <button
            type="button"
            className={`clinical-toggle ${value.previousDiagnosis ? "clinical-toggle-active" : ""}`}
            onClick={() => set({ previousDiagnosis: true })}
          >
            Yes
          </button>
        </div>
      </div>

      {/* Medical History */}
      <div className="clinical-field">
        <label className="clinical-label" htmlFor="history">Medical History <span className="clinical-label-hint">— optional</span></label>
        <textarea id="history" rows={3} value={value.medicalHistory}
          onChange={(e) => set({ medicalHistory: e.target.value })}
          placeholder="e.g. family history of eczema, allergies, asthma..."
          className="clinical-textarea" />
      </div>
    </div>
  );
}

export const defaultClinicalData = {
  age: "",
  symptoms: [],
  medicalHistory: "",
  durationDays: "",
  itchingLevel: 0,
  redness: 0,
  dryness: 0,
  skinArea: "face",
  previousDiagnosis: false,
};
