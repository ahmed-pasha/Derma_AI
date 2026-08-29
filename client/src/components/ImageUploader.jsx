import { useRef, useState } from "react";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_MB = 8;

export default function ImageUploader({ onFileSelected, file }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const preview = file ? URL.createObjectURL(file) : null;

  const validateAndSet = (f) => {
    setError("");
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) {
      setError("Unsupported file type. Please upload a JPG, PNG, or WEBP image.");
      return;
    }
    if (f.size === 0) {
      setError("That file appears to be empty. Please choose a different image.");
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${MAX_MB}MB.`);
      return;
    }
    onFileSelected(f);
  };

  return (
    <div className="uploader">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); validateAndSet(e.dataTransfer.files?.[0]); }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        className={`uploader-zone ${dragOver ? "uploader-zone-active" : ""} ${preview ? "uploader-zone-preview" : ""}`}
      >
        {preview ? (
          <div className="uploader-preview">
            <img src={preview} alt="Selected skin area preview" className="uploader-preview-img" />
            <div className="uploader-preview-overlay">
              <button
                type="button"
                className="uploader-overlay-btn"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                Change
              </button>
              <button
                type="button"
                className="uploader-overlay-btn uploader-overlay-btn-danger"
                onClick={(e) => { e.stopPropagation(); onFileSelected(null); }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="uploader-empty">
            <div className="uploader-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <p className="uploader-title">Drag & drop your skin image here</p>
            <p className="uploader-sub">or click to browse files</p>
            <div className="uploader-badges">
              <span className="uploader-badge">JPG</span>
              <span className="uploader-badge">PNG</span>
              <span className="uploader-badge">WEBP</span>
              <span className="uploader-badge">Max {MAX_MB}MB</span>
            </div>
          </div>
        )}
        <input
          ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden
          onChange={(e) => validateAndSet(e.target.files?.[0])}
        />
      </div>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
