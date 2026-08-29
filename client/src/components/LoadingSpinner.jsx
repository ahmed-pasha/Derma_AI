export default function LoadingSpinner({ full, label = "Loading..." }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 12, padding: full ? "120px 0" : "40px 0", color: "var(--text-muted)", fontSize: "0.9rem",
    }}>
      <div className="spinner spinner-dark" />
      {label}
    </div>
  );
}
