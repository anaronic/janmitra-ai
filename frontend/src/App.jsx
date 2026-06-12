import { useEffect, useState } from "react";
import Chat from "./components/Chat";
import RightsPanel from "./components/RightsPanel";
import RiskDashboard from "./components/RiskDashboard";
import SchemesPanel from "./components/SchemesPanel";
import Upload from "./components/Upload";
import { getRights, getRisk, getSchemes } from "./api";
import "./App.css";

function App() {
  const [doc, setDoc] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [risk, setRisk] = useState(null);
  const [rights, setRights] = useState(null);
  const [schemes, setSchemes] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    if (!doc) return;
    setLoadingInsights(true);
    Promise.allSettled([getRisk(doc.id), getRights(doc.id), getSchemes(doc.id)])
      .then(([r, ri, s]) => {
        if (r.status === "fulfilled") setRisk(r.value);
        if (ri.status === "fulfilled") setRights(ri.value);
        if (s.status === "fulfilled") setSchemes(s.value);
      })
      .finally(() => setLoadingInsights(false));
  }, [doc]);

  function handleReady(document, analysisResult) {
    setDoc(document);
    setAnalysis(analysisResult);
    setRisk(null);
    setRights(null);
    setSchemes(null);
  }

  function reset() {
    setDoc(null);
    setAnalysis(null);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>JanMitra AI</h1>
        <p className="tagline">
          Understand your documents, rights, risks, and government schemes — in your language.
        </p>
      </header>

      {!doc ? (
        <Upload onReady={handleReady} />
      ) : (
        <main className="workspace">
          <div className="doc-bar">
            <div>
              <strong>{doc.filename}</strong>
              {analysis?.document_type && <span className="muted"> · {analysis.document_type}</span>}
            </div>
            <button className="ghost" onClick={reset}>
              Upload another
            </button>
          </div>

          {loadingInsights && <p className="muted">Generating insights…</p>}

          <div className="grid">
            <div className="column">
              <RiskDashboard report={risk} />
              <RightsPanel report={rights} />
              <SchemesPanel report={schemes} />
            </div>
            <div className="column">
              <Chat documentId={doc.id} />
            </div>
          </div>
        </main>
      )}

      <footer className="app-footer">
        Educational use only. JanMitra AI does not provide legal or financial advice. Scheme
        eligibility must be verified through official sources.
      </footer>
    </div>
  );
}

export default App;
