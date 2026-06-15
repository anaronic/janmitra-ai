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
import { analyzeDocument, getActionPlan, getRights, getRisk, getSchemes } from "./api";
import "./App.css";

const FONT_STEPS = [0.9, 1, 1.1];
const LANGUAGES = [
  { value: "en", label: "English", nativeName: "English" },
  { value: "hi", label: "Hindi", nativeName: "हिन्दी" },
];
const SECTION_LABELS = {
  en: {
    snapshot: "Snapshot",
    "action-plan": "Action Plan",
    risks: "Risks",
    rights: "Rights",
    schemes: "Schemes",
    chat: "Ask Doc",
  },
  hi: {
    snapshot: "सारांश",
    "action-plan": "कार्य योजना",
    risks: "जोखिम",
    rights: "अधिकार",
    schemes: "योजनाएँ",
    chat: "प्रश्न पूछें",
  },
};
const SECTIONS = ["snapshot", "action-plan", "risks", "rights", "schemes", "chat"];

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
  const [contentLanguage, setContentLanguage] = useState("en");
  const [activeSection, setActiveSection] = useState("snapshot");
  const sectionLabels = SECTION_LABELS[language] || SECTION_LABELS.en;
  const outputLanguage = LANGUAGES.find((item) => item.value === language)?.label || "English";

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
      return loadInsight("risk", () => getRisk(documentId, { language: outputLanguage }), setRisk);
    },
    [doc?.id, loadInsight, outputLanguage],
  );

  const loadRights = useCallback(
    (documentId = doc?.id) => {
      if (!documentId) return Promise.resolve();
      return loadInsight("rights", () => getRights(documentId, { language: outputLanguage }), setRights);
    },
    [doc?.id, loadInsight, outputLanguage],
  );

  const loadActionPlan = useCallback(
    (documentId = doc?.id) => {
      if (!documentId) return Promise.resolve();
      return loadInsight("actionPlan", () => getActionPlan(documentId, { language: outputLanguage }), setActionPlan);
    },
    [doc?.id, loadInsight, outputLanguage],
  );

  const loadAnalysis = useCallback(
    (documentId = doc?.id) => {
      if (!documentId) return Promise.resolve();
      return loadInsight("analysis", () => analyzeDocument(documentId, { language: outputLanguage }), (value) => {
        setAnalysis(value);
        setContentLanguage(language);
      });
    },
    [doc?.id, language, loadInsight, outputLanguage],
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
      const nextParams = { ...params, language: outputLanguage };
      return fetchSchemes(doc.id, nextParams);
    },
    [doc, fetchSchemes, outputLanguage, schemeParams],
  );

  useEffect(() => {
    if (!doc || contentLanguage === language) return;
    setAnalysis(null);
    loadAnalysis(doc.id);
  }, [contentLanguage, doc, language, loadAnalysis]);

  useEffect(() => {
    if (!doc) return;
    setRisk(null);
    setRights(null);
    setActionPlan(null);
    setSchemes(null);
    loadRisk(doc.id);
    loadRights(doc.id);
    loadActionPlan(doc.id);
    fetchSchemes(doc.id, { language: outputLanguage });
  }, [doc, fetchSchemes, outputLanguage, loadActionPlan, loadRights, loadRisk]);

  function handleReady(document, analysisResult) {
    setDoc(document);
    setAnalysis(analysisResult);
    setRisk(null);
    setRights(null);
    setSchemes(null);
    setActionPlan(null);
    setErrors({});
    setLoading({});
    setSchemeParams({ language: outputLanguage });
    setContentLanguage(language);
    setActiveSection("snapshot");
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
    setContentLanguage(language);
    setActiveSection("snapshot");
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
                    {item.nativeName}
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
              {SECTIONS.slice(1).map((section) => (
                <button
                  type="button"
                  key={section}
                  className={`nav-item nav-button ${activeSection === section ? "active" : ""}`}
                  onClick={() => setActiveSection(section)}
                >
                  {sectionLabels[section]}
                </button>
              ))}
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
            <Upload
              onReady={handleReady}
              language={language}
              outputLanguage={outputLanguage}
              languages={LANGUAGES}
            />
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
                <div className="section-tabs" role="tablist" aria-label="Document sections">
                  {SECTIONS.map((section) => (
                    <button
                      type="button"
                      key={section}
                      role="tab"
                      aria-selected={activeSection === section}
                      className={activeSection === section ? "active" : ""}
                      onClick={() => setActiveSection(section)}
                    >
                      {sectionLabels[section]}
                    </button>
                  ))}
                </div>

                <div className="section-pane" hidden={activeSection !== "snapshot"}>
                  <DocumentSnapshot analysis={analysis} language={language} />
                </div>
                <div className="section-pane" hidden={activeSection !== "action-plan"}>
                  <ActionPlanPanel
                    plan={actionPlan}
                    loading={loading.actionPlan}
                    error={errors.actionPlan}
                    language={language}
                    onRetry={() => loadActionPlan()}
                  />
                </div>
                <div className="section-pane" hidden={activeSection !== "risks"}>
                  <RiskDashboard
                    report={risk}
                    loading={loading.risk}
                    error={errors.risk}
                    language={language}
                    onRetry={() => loadRisk()}
                  />
                </div>
                <div className="section-pane" hidden={activeSection !== "rights"}>
                  <RightsPanel
                    report={rights}
                    loading={loading.rights}
                    error={errors.rights}
                    language={language}
                    onRetry={() => loadRights()}
                  />
                </div>
                <div className="section-pane" hidden={activeSection !== "schemes"}>
                  <SchemesPanel
                    report={schemes}
                    loading={loading.schemes}
                    error={errors.schemes}
                    language={language}
                    onApply={loadSchemes}
                    onRetry={() => loadSchemes(schemeParams)}
                  />
                </div>
                <div id="chat" className="section-pane chat-area" hidden={activeSection !== "chat"}>
                  <Chat key={`${doc.id}-${language}`} documentId={doc.id} language={language} />
                </div>
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
