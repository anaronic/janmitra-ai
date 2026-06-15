import { useRef, useState } from "react";
import { analyzeDemoDocument, analyzeDocument, getDemoDocuments, uploadDocument } from "../api";

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

export default function Upload({ onReady, language, languages }) {
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
      const analysis = await analyzeDocument(doc.id, { language });
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
      const res = await analyzeDemoDocument(sampleId, { language });
      onReady(res.document, res.analysis);
    } catch (err) {
      setError(friendlyError(err.message));
    } finally {
      setSampleBusy("");
    }
  }

  return (
    <div id="document-analysis" className="upload-card">
      <h2>{language === "hi" ? "दस्तावेज़ अपलोड करें" : "Upload a document"}</h2>
      <p className="muted">
        {language === "hi"
          ? "PDF, छवि या स्कैन दस्तावेज़ (अधिकतम 20 MB)। कोई गुप्त जानकारी आवश्यक नहीं।"
          : "PDF, image, or scanned document (max 20 MB). No secrets required."}
      </p>
      <p className="supported-languages">
        {language === "hi" ? "समर्थित भाषाएँ" : "Supported languages"}:{" "}
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
          {language === "hi"
            ? "अपलोड और विश्लेषण हो रहा है… इसमें कुछ सेकंड लग सकते हैं।"
            : "Uploading and analyzing… this can take a few seconds."}
        </p>
      )}
      {error && (
        <div className="error-box">
          <strong>{language === "hi" ? "यह चरण पूरा नहीं हो सका।" : "Could not complete that step."}</strong>
          <p>{error}</p>
          <button type="button" className="ghost" onClick={() => inputRef.current?.click()}>
            {language === "hi" ? "फाइल फिर चुनें" : "Choose file again"}
          </button>
        </div>
      )}

      <div className="sample-mode">
        <div>
          <h3>{language === "hi" ? "डेमो मोड" : "Judge demo mode"}</h3>
          <p className="muted">
            {language === "hi"
              ? "सैंपल दस्तावेज़ से JanMitra तुरंत आज़माएँ।"
              : "Try JanMitra instantly with sample notices, bills, or certificates."}
          </p>
        </div>
        {!samplesLoaded ? (
          <button type="button" className="ghost" onClick={loadSamples} disabled={busy}>
            {language === "hi" ? "सैंपल दस्तावेज़ दिखाएँ" : "Show sample documents"}
          </button>
        ) : (
          <div className="sample-grid">
            {samples.length === 0 ? (
              <p className="muted">
                {language === "hi"
                  ? "अभी कोई सैंपल उपलब्ध नहीं है। कृपया फाइल अपलोड करें।"
                  : "No samples are available yet. Please upload a file."}
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
                  {sampleBusy === sample.id && <em>{language === "hi" ? "लोड हो रहा है…" : "Loading…"}</em>}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
