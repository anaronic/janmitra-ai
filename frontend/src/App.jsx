import { useEffect, useState } from "react";
import Chat from "./components/Chat";
import RightsPanel from "./components/RightsPanel";
import RiskDashboard from "./components/RiskDashboard";
import SchemesPanel from "./components/SchemesPanel";
import Upload from "./components/Upload";
import AshokaChakra from "./components/AshokaChakra";
import { getRights, getRisk, getSchemes } from "./api";
import "./App.css";

const FONT_STEPS = [0.9, 1, 1.1];

function App() {
  const [doc, setDoc] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [risk, setRisk] = useState(null);
  const [rights, setRights] = useState(null);
  const [schemes, setSchemes] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [fontStep, setFontStep] = useState(1);

  useEffect(() => {
    document.documentElement.style.fontSize = `${FONT_STEPS[fontStep] * 100}%`;
  }, [fontStep]);

  useEffect(() => {
    if (!doc) return;
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
    setLoadingInsights(true);
  }

  function reset() {
    setDoc(null);
    setAnalysis(null);
    setLoadingInsights(false);
  }

  return (
    <div className="gov-page">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <div className="utility-bar">
        <div className="utility-inner">
          <span className="utility-tag">भारत · Digital Public Service</span>
          <div className="utility-actions">
            <span className="font-controls" role="group" aria-label="Adjust text size">
              <button
                type="button"
                className="font-btn"
                onClick={() => setFontStep((s) => Math.max(0, s - 1))}
                disabled={fontStep === 0}
                aria-label="Decrease text size"
              >
                A-
              </button>
              <button
                type="button"
                className="font-btn"
                onClick={() => setFontStep(1)}
                aria-label="Reset text size"
              >
                A
              </button>
              <button
                type="button"
                className="font-btn"
                onClick={() => setFontStep((s) => Math.min(FONT_STEPS.length - 1, s + 1))}
                disabled={fontStep === FONT_STEPS.length - 1}
                aria-label="Increase text size"
              >
                A+
              </button>
            </span>
            <span className="utility-lang">English | हिन्दी</span>
          </div>
        </div>
      </div>

      <header className="masthead">
        <div className="masthead-inner">
          <div className="emblem-wrap">
            <AshokaChakra size={52} />
          </div>
          <div className="masthead-titles">
            <p className="masthead-hindi">जनमित्र एआई</p>
            <h1 className="masthead-en">JanMitra AI</h1>
            <p className="masthead-sub">Digital Document Companion for Every Citizen</p>
          </div>
        </div>
      </header>

      <div className="tricolour-strip" aria-hidden="true">
        <span className="band-saffron" />
        <span className="band-white" />
        <span className="band-green" />
      </div>

      <nav className="gov-nav" aria-label="Primary">
        <div className="gov-nav-inner">
          <a className="nav-item active" href="#main-content" aria-current="page">
            Home
          </a>
          <a className="nav-item" href="#document-analysis">
            Document Analysis
          </a>
          {doc ? (
            <>
              <a className="nav-item" href="#rights">
                Rights
              </a>
              <a className="nav-item" href="#schemes">
                Schemes
              </a>
            </>
          ) : (
            <>
              <span className="nav-item disabled" aria-disabled="true">
                Rights
              </span>
              <span className="nav-item disabled" aria-disabled="true">
                Schemes
              </span>
            </>
          )}
        </div>
      </nav>

      <main id="main-content" className="gov-main">
        <p className="page-intro">
          Understand your documents, rights, risks, and government schemes — in your language.
        </p>

        {!doc ? (
          <Upload onReady={handleReady} />
        ) : (
          <section id="document-analysis" className="workspace">
            <div className="doc-bar">
              <div>
                <strong>{doc.filename}</strong>
                {analysis?.document_type && (
                  <span className="muted"> · {analysis.document_type}</span>
                )}
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
          </section>
        )}
      </main>

      <footer className="gov-footer">
        <div className="gov-footer-inner">
          <div className="footer-brand">
            <AshokaChakra size={34} color="#ffffff" />
            <div>
              <strong>JanMitra AI</strong>
              <p className="footer-note">Digital Document Companion</p>
            </div>
          </div>
          <p className="footer-disclaimer">
            Educational use only. JanMitra AI does not provide legal or financial advice. Scheme
            eligibility must be verified through official sources.
          </p>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} JanMitra AI</span>
          <span>Built for citizen empowerment</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
