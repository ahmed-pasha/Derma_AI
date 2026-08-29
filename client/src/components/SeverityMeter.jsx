const LEVELS = [
  { key: "mild", label: "Mild", color: "var(--mild)", emoji: "🟢" },
  { key: "moderate", label: "Moderate", color: "var(--moderate)", emoji: "🟡" },
  { key: "severe", label: "Severe", color: "var(--severe)", emoji: "🔴" },
];

export default function SeverityMeter({ severity }) {
  const activeIndex = LEVELS.findIndex((l) => l.key === severity);
  const active = LEVELS[activeIndex] || LEVELS[0];

  return (
    <div className="severity-meter">
      <div className="severity-track">
        {LEVELS.map((level, i) => (
          <div
            key={level.key}
            className={`severity-segment ${i <= activeIndex ? "severity-segment-active" : ""}`}
            style={{
              "--seg-color": level.color,
              flex: 1,
            }}
          >
            <div className="severity-dot" style={{
              background: i <= activeIndex ? level.color : "var(--border)",
              boxShadow: i === activeIndex ? `0 0 0 6px ${level.color}22, 0 0 12px ${level.color}33` : "none",
            }} />
            <span className="severity-label" style={{
              color: i <= activeIndex ? level.color : "var(--text-muted)",
              fontWeight: i === activeIndex ? 700 : 500,
            }}>
              {level.emoji} {level.label}
            </span>
          </div>
        ))}
      </div>
      <div className="severity-bar">
        <div className="severity-bar-fill" style={{
          width: `${((activeIndex + 1) / LEVELS.length) * 100}%`,
          background: `linear-gradient(90deg, var(--mild), ${active.color})`,
        }} />
      </div>
    </div>
  );
}
