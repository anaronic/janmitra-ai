import { useRef, useState } from "react";
import { analyzeDemoDocument, analyzeDocument, getDemoDocuments, uploadDocument } from "../api";
import { tr } from "../i18n";

function friendlyError(message) {
  const text = message || "Something went wrong.";
  if (/quota|rate|limit|429/i.test(text)) {
    return `${text} Try a sample document or retry in a minute.`;
  }
  if (/cannot reach|failed to fetch|server|backend|cors|sleep/i.test(text)) {
    return `${text} The backend may be waking up; please retry shortly.`;
  }
  return text;
}

export default function Upload({ onReady, language, outputLanguage, languages }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [sampleBusy, setSampleBusy] = useState("");
  const [samples, setSamples] = useState([]);
  const [samplesLoaded, setSamplesLoaded] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file) {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const doc = await uploadDocument(file);
      const analysis = await analyzeDocument(doc.id, { language: outputLanguage });
      onReady(doc, analysis);
    } catch (err) {
      setError(friendlyError(err.message));
    } finally {
      setBusy(false);
    }
  }

  async function loadSamples() {
    setError("");
    setSamplesLoaded(true);
    try {
      const res = await getDemoDocuments();
      setSamples(res.samples || []);
    } catch (err) {
      setError(friendlyError(err.message));
    }
  }

  async function handleSample(sampleId) {
    setError("");
    setSampleBusy(sampleId);
    try {
      const res = await analyzeDemoDocument(sampleId, { language: outputLanguage });
      onReady(res.document, res.analysis);
    } catch (err) {
      setError(friendlyError(err.message));
    } finally {
      setSampleBusy("");
    }
  }

  return (
    <div id="document-analysis" className="upload-card">
      <h2>{tr(language, "uploadDocument")}</h2>
      <p className="muted">
        {tr(language, "uploadHelp")}
      </p>
      <p className="supported-languages">
        {tr(language, "supportedLanguages")}:{" "}
        {(languages || []).map((item) => item.nativeName || item.label).join(" · ")}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/*"
        disabled={busy}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {busy && (
        <p className="muted">
          {tr(language, "uploading")}
        </p>
      )}
      {error && (
        <div className="error-box">
          <strong>{tr(language, "couldNotComplete")}</strong>
          <p>{error}</p>
          <button type="button" className="ghost" onClick={() => inputRef.current?.click()}>
            {tr(language, "chooseFileAgain")}
          </button>
        </div>
      )}

      <div className="sample-mode">
        <div>
          <h3>{tr(language, "judgeDemoMode")}</h3>
          <p className="muted">
            {tr(language, "judgeDemoHelp")}
          </p>
        </div>
        {!samplesLoaded ? (
          <button type="button" className="ghost" onClick={loadSamples} disabled={busy}>
            {tr(language, "showSamples")}
          </button>
        ) : (
          <div className="sample-grid">
            {samples.length === 0 ? (
              <p className="muted">
                {tr(language, "noSamples")}
              </p>
            ) : (
              samples.map((sample) => (
                <button
                  type="button"
                  className="sample-card"
                  key={sample.id}
                  onClick={() => handleSample(sample.id)}
                  disabled={Boolean(sampleBusy) || busy}
                >
                  <strong>{sample.title}</strong>
                  <span>{sample.description}</span>
                  <small>
                    {sample.document_type} · {sample.language}
                  </small>
                  {sampleBusy === sample.id && <em>{tr(language, "loading")}</em>}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
