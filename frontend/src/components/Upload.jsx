import { useRef, useState } from "react";
import { analyzeDocument, uploadDocument } from "../api";

export default function Upload({ onReady }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file) {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const doc = await uploadDocument(file);
      const analysis = await analyzeDocument(doc.id);
      onReady(doc, analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="upload-card">
      <h2>Upload a document</h2>
      <p className="muted">PDF, image, or scanned document (max 20 MB).</p>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/*"
        disabled={busy}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {busy && <p className="muted">Uploading and analyzing… this can take a few seconds.</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
