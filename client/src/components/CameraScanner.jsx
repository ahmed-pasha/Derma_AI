import { useEffect, useRef, useState } from "react";

/**
 * Live camera scanner: requests camera permission, shows a live feed, lets the
 * user capture a still frame. Analysis always happens on the CAPTURED frame —
 * this component does not (and cannot) run per-frame disease detection on raw
 * video; it hands a single captured image to the parent for real ML inference.
 */
export default function CameraScanner({ onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState("");
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");
  const [ready, setReady] = useState(false);

  const startCamera = async (mode = facingMode) => {
    setError("");
    stopCamera();
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Your browser does not support camera access. Please upload an image instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setReady(true);
    } catch (err) {
      setError("Camera permission denied. Please allow camera access or upload an image instead.");
      setReady(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    startCamera();
    return stopCamera;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchCamera = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCamera(next);
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      const file = new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" });
      setCapturedUrl(URL.createObjectURL(blob));
      onCapture(file);
      stopCamera();
    }, "image/jpeg", 0.92);
  };

  const retake = () => {
    setCapturedUrl(null);
    onCapture(null);
    startCamera();
  };

  return (
    <div className="card card-pad">
      {error && <div className="disclaimer" style={{ background: "#fbe7e2", borderColor: "#f0b8a6", color: "#7a2a12" }}>{error}</div>}

      {!capturedUrl ? (
        <div>
          <div style={{ position: "relative", background: "#0b1a17", borderRadius: "var(--radius)", overflow: "hidden", aspectRatio: "4/3" }}>
            <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {!ready && !error && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                <div className="spinner" />
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 20 }}>
            <button className="btn btn-outline" onClick={switchCamera} disabled={!ready}>Switch Camera</button>
            <button className="btn btn-primary" onClick={capture} disabled={!ready} style={{ paddingInline: 36 }}>● Capture</button>
          </div>
        </div>
      ) : (
        <div>
          <img src={capturedUrl} alt="Captured skin area" style={{ width: "100%", borderRadius: "var(--radius)" }} />
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 20 }}>
            <button className="btn btn-outline" onClick={retake}>Retake</button>
          </div>
        </div>
      )}
      <p className="hint" style={{ marginTop: 16, textAlign: "center" }}>
        Each analysis is based on a single captured frame, then processed by the ML pipeline — not a continuous live diagnosis.
      </p>
    </div>
  );
}
