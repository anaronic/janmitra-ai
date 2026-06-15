import { useCallback, useEffect, useState } from "react";
import ActionPlanPanel from "./components/ActionPlanPanel";
import Chat from "./components/Chat";
import DocumentSnapshot from "./components/DocumentSnapshot";
import GuidedJourney from "./components/GuidedJourney";
import RightsPanel from "./components/RightsPanel";
import RiskDashboard from "./components/RiskDashboard";
import SchemesPanel from "./components/SchemesPanel";
import Upload from "./components/Upload";
import AshokaChakra from "./components/AshokaChakra";
import { getActionPlan, getRights, getRisk, getSchemes } from "./api";
import "./App.css";

const FONT_STEPS = [0.9, 1, 1.1];
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
];

function actionableError(message) {
  const text = message || "Request failed.";
  if (/quota|rate|limit|429/i.test(text)) {
    return `${text} This can happen during demos; retry after a minute.`;
  }
  if (/cannot reach|failed to fetch|server|backend|cors|sleep/i.test(text)) {
    return `${text} The backend may be waking from cold start. Retry in about 30 seconds.`;
  }
  return text;
}

function App() {
  const [doc, setDoc] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [risk, setRisk] = useState(null);
  const [rights, setRights] = useState(null);
  const [schemes, setSchemes] = useState(null);
  const [actionPlan, setActionPlan] = useState(null);
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  const [schemeParams, setSchemeParams] = useState({});
  const [fontStep, setFontStep] = useState(1);
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    document.documentElement.style.fontSize = `${FONT_STEPS[fontStep] * 100}%`;
  }, [fontStep]);

  const loadInsight = useCallback(
    async (key, loader, setter) => {
      setLoading((current) => ({ ...current, [key]: true }));
      setErrors((current) => ({ ...current, [key]: "" }));
      try {
        setter(await loader());
      } catch (err) {
        setErrors((current) => ({ ...current, [key]: actionableError(err.message) }));
      } finally {
        setLoading((current) => ({ ...current, [key]: false }));
      }
    },
    [],
  );

  const loadRisk = useCallback(
    (documentId = doc?.id) => {
      if (!documentId) return Promise.resolve();
      return loadInsight("risk", () => getRisk(documentId), setRisk);
    },
    [doc?.id, loadInsight],
  );

  const loadRights = useCallback(
    (documentId = doc?.id) => {
      if (!documentId) return Promise.resolve();
      return loadInsight("rights", () => getRights(documentId), setRights);
    },
    [doc?.id, loadInsight],
  );

  const loadActionPlan = useCallback(
    (documentId = doc?.id) => {
      if (!documentId) return Promise.resolve();
      return loadInsight("actionPlan", () => getActionPlan(documentId), setActionPlan);
    },
    [doc?.id, loadInsight],
  );

  const fetchSchemes = useCallback(
    (documentId, params) => {
      setSchemeParams(params);
      return loadInsight("schemes", () => getSchemes(documentId, params), setSchemes);
    },
    [loadInsight],
  );

  const loadSchemes = useCallback(
    (params = schemeParams) => {
      if (!doc) return Promise.resolve();
      const nextParams = { ...params, language };
      return fetchSchemes(doc.id, nextParams);
    },
    [doc, fetchSchemes, language, schemeParams],
  );

  useEffect(() => {
    if (!doc) return;
    loadRisk(doc.id);
    loadRights(doc.id);
    loadActionPlan(doc.id);
    fetchSchemes(doc.id, { language });
  }, [doc, fetchSchemes, language, loadActionPlan, loadRights, loadRisk]);

  function handleReady(document, analysisResult) {
    setDoc(document);
    setAnalysis(analysisResult);
    setRisk(null);
    setRights(null);
    setSchemes(null);
    setActionPlan(null);
    setErrors({});
    setLoading({});
    setSchemeParams({ language });
  }

  function reset() {
    setDoc(null);
    setAnalysis(null);
    setRisk(null);
    setRights(null);
    setSchemes(null);
    setActionPlan(null);
    setLoading({});
    setErrors({});
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
            <label className="language-select">
              <span>Language</span>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                {LANGUAGES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
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
              <a className="nav-item" href="#action-plan">
                Action Plan
              </a>
              <a className="nav-item" href="#risks">
                Risks
              </a>
              <a className="nav-item" href="#rights">
                Rights
              </a>
              <a className="nav-item" href="#schemes">
                Schemes
              </a>
              <a className="nav-item" href="#chat">
                Chat
              </a>
            </>
          ) : (
            <>
              <span className="nav-item locked" aria-disabled="true" title="Upload a document first">
                🔒 Action Plan
              </span>
              <span className="nav-item locked" aria-disabled="true" title="Upload a document first">
                🔒 Rights
              </span>
              <span className="nav-item locked" aria-disabled="true" title="Upload a document first">
                🔒 Schemes
              </span>
            </>
          )}
        </div>
      </nav>

      <main id="main-content" className="gov-main">
        <p className="page-intro">
          {language === "hi"
            ? "अपने दस्तावेज़, अधिकार, जोखिम और सरकारी योजनाएँ सरल भाषा में समझें।"
            : "Understand your documents, rights, risks, and government schemes — in your language."}
        </p>

        {!doc ? (
          <>
            <GuidedJourney />
            <Upload onReady={handleReady} language={language} />
          </>
        ) : (
          <section id="document-analysis" className="workspace">
            <div className="doc-bar">
              <div>
                <strong>{doc.filename || doc.title || "Uploaded document"}</strong>
                {analysis?.document_type && (
                  <span className="muted"> · {analysis.document_type}</span>
                )}
              </div>
              <button className="ghost" onClick={reset}>
                Upload another
              </button>
            </div>

            <div className="workspace-grid">
              <div className="insights-area">
                <DocumentSnapshot analysis={analysis} />
                <ActionPlanPanel
                  plan={actionPlan}
                  loading={loading.actionPlan}
                  error={errors.actionPlan}
                  onRetry={() => loadActionPlan()}
                />
                <div className="insight-cards">
                  <RiskDashboard
                    report={risk}
                    loading={loading.risk}
                    error={errors.risk}
                    onRetry={() => loadRisk()}
                  />
                  <RightsPanel
                    report={rights}
                    loading={loading.rights}
                    error={errors.rights}
                    onRetry={() => loadRights()}
                  />
                  <SchemesPanel
                    report={schemes}
                    loading={loading.schemes}
                    error={errors.schemes}
                    language={language}
                    onApply={loadSchemes}
                    onRetry={() => loadSchemes(schemeParams)}
                  />
                </div>
              </div>
              <aside id="chat" className="chat-area" aria-label="Document chat assistant">
                <Chat documentId={doc.id} language={language} />
              </aside>
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
