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
import {
  analyzeDocument,
  deleteDocument,
  getActionPlan,
  getAnalysis,
  getDocument,
  getRights,
  getRisk,
  getSchemes,
} from "./api";
import { LANGUAGES, SECTION_LABELS, languageMeta, outputLanguage as languageName, tr } from "./i18n";
import "./App.css";

const RECENT_DOCUMENTS_KEY = "janmitra.recentDocuments";
const FONT_STEPS = [0.9, 1, 1.1];
const SECTIONS = ["snapshot", "action-plan", "risks", "rights", "schemes", "chat"];

function loadRecentDocuments() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_DOCUMENTS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecentDocuments(items) {
  localStorage.setItem(RECENT_DOCUMENTS_KEY, JSON.stringify(items.slice(0, 6)));
}

function listLines(items = []) {
  if (!items?.length) return "- Not found in this document.";
  return items.map((item) => `- ${item}`).join("\n");
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function htmlList(items = [], fallback) {
  if (!items?.length) return `<li>${escapeHtml(fallback)}</li>`;
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function buildReport({ doc, analysis, risk, rights, actionPlan, schemes, language }) {
  const title = tr(language, "reportTitle");
  const sections = [
    `# ${title}`,
    `**${tr(language, "document")}:** ${doc?.filename || tr(language, "document")}`,
    `**${tr(language, "type")}:** ${analysis?.document_type || "Unknown"}`,
    "",
    `## ${SECTION_LABELS[language]?.snapshot || SECTION_LABELS.en.snapshot}`,
    `**${tr(language, "peopleEntities")}**\n${listLines(analysis?.entities)}`,
    `**${tr(language, "dates")}**\n${listLines(analysis?.dates)}`,
    `**${tr(language, "amounts")}**\n${listLines(analysis?.amounts)}`,
    `**${tr(language, "keyClauses")}**\n${listLines(analysis?.clauses)}`,
    "",
    `## ${tr(language, "actionPlan")}`,
    `${listLines(actionPlan?.immediate_actions)}`,
    `**${tr(language, "documentsToCollect")}**\n${listLines(actionPlan?.documents_to_collect)}`,
    `**${tr(language, "deadlines")}**\n${listLines(actionPlan?.deadlines)}`,
    "",
    `## ${tr(language, "risks")}`,
    risk?.items?.length
      ? risk.items.map((item) => `- ${item.category} (${item.level}): ${item.explanation}`).join("\n")
      : `- ${tr(language, "noRisks")}`,
    "",
    `## ${tr(language, "rightsResponsibilities")}`,
    `**${tr(language, "whatYouMustDo")}**\n${listLines(rights?.you_must_do)}`,
    `**${tr(language, "otherPartyMustDo")}**\n${listLines(rights?.other_party_must_do)}`,
    "",
    `## ${tr(language, "schemes")}`,
    schemes?.suggestions?.length
      ? schemes.suggestions.map((scheme) => `- ${scheme.name}: ${scheme.reason || scheme.eligibility_notes || ""}`).join("\n")
      : `- ${tr(language, "noSchemes")}`,
    "",
    `_${tr(language, "reportDisclaimer")}_`,
  ];
  return sections.join("\n\n");
}

function buildReportHtml({ doc, analysis, risk, rights, actionPlan, schemes, language }) {
  const meta = languageMeta(language);
  const title = tr(language, "reportTitle");
  const notFound = tr(language, "notFound");
  const riskItems = risk?.items?.length
    ? risk.items
        .map(
          (item) => `
            <article class="card">
              <strong>${escapeHtml(item.category)} · ${escapeHtml(item.level)}</strong>
              <p>${escapeHtml(item.explanation)}</p>
              ${item.evidence ? `<blockquote>${escapeHtml(item.evidence)}</blockquote>` : ""}
            </article>
          `,
        )
        .join("")
    : `<p>${escapeHtml(tr(language, "noRisks"))}</p>`;
  const schemeItems = schemes?.suggestions?.length
    ? schemes.suggestions
        .map(
          (scheme) => `
            <article class="card">
              <strong>${escapeHtml(scheme.name)}</strong>
              <p>${escapeHtml(scheme.reason || scheme.eligibility_notes || "")}</p>
              ${
                scheme.required_documents?.length
                  ? `<p><b>${escapeHtml(tr(language, "documentsToCollect"))}:</b> ${escapeHtml(scheme.required_documents.join(", "))}</p>`
                  : ""
              }
            </article>
          `,
        )
        .join("")
    : `<p>${escapeHtml(tr(language, "noSchemes"))}</p>`;

  return `<!doctype html>
<html lang="${meta.htmlLang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; background: #f7f3e8; color: #1f2a24; line-height: 1.55; }
    main { max-width: 760px; margin: 0 auto; padding: 20px 14px 32px; }
    header { background: linear-gradient(135deg, #0f5132, #166534); color: white; border-radius: 22px; padding: 22px; }
    h1 { font-size: clamp(1.55rem, 6vw, 2.3rem); margin: 0 0 8px; }
    h2 { font-size: 1.2rem; margin: 24px 0 10px; }
    section, .card { background: #fffdf7; border: 1px solid #e2d9bd; border-radius: 18px; padding: 16px; margin-top: 12px; box-shadow: 0 8px 26px rgba(31, 42, 36, 0.08); }
    ul { padding-left: 1.2rem; margin: 8px 0 0; }
    li { margin: 6px 0; }
    blockquote { border-left: 4px solid #f59e0b; margin: 10px 0 0; padding: 8px 12px; background: #fff7df; border-radius: 10px; }
    .meta { opacity: 0.9; margin: 0; }
    .grid { display: grid; gap: 12px; }
    .disclaimer { font-size: 0.92rem; color: #5f5240; }
    @media (min-width: 720px) { .grid.two { grid-template-columns: repeat(2, 1fr); } }
    @media print { body { background: white; } main { max-width: none; padding: 0; } section, .card, header { box-shadow: none; break-inside: avoid; } }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>${escapeHtml(title)}</h1>
      <p class="meta"><b>${escapeHtml(tr(language, "document"))}:</b> ${escapeHtml(doc?.filename || tr(language, "document"))}</p>
      <p class="meta"><b>${escapeHtml(tr(language, "type"))}:</b> ${escapeHtml(analysis?.document_type || "Unknown")}</p>
    </header>

    <section>
      <h2>${escapeHtml(SECTION_LABELS[language]?.snapshot || SECTION_LABELS.en.snapshot)}</h2>
      <div class="grid two">
        <div><b>${escapeHtml(tr(language, "peopleEntities"))}</b><ul>${htmlList(analysis?.entities, notFound)}</ul></div>
        <div><b>${escapeHtml(tr(language, "dates"))}</b><ul>${htmlList(analysis?.dates, notFound)}</ul></div>
        <div><b>${escapeHtml(tr(language, "amounts"))}</b><ul>${htmlList(analysis?.amounts, notFound)}</ul></div>
        <div><b>${escapeHtml(tr(language, "keyClauses"))}</b><ul>${htmlList(analysis?.clauses, notFound)}</ul></div>
      </div>
    </section>

    <section>
      <h2>${escapeHtml(tr(language, "actionPlan"))}</h2>
      <b>${escapeHtml(tr(language, "immediateActions"))}</b><ul>${htmlList(actionPlan?.immediate_actions, notFound)}</ul>
      <b>${escapeHtml(tr(language, "documentsToCollect"))}</b><ul>${htmlList(actionPlan?.documents_to_collect, notFound)}</ul>
      <b>${escapeHtml(tr(language, "deadlines"))}</b><ul>${htmlList(actionPlan?.deadlines, notFound)}</ul>
    </section>

    <section>
      <h2>${escapeHtml(tr(language, "risks"))}</h2>
      ${riskItems}
    </section>

    <section>
      <h2>${escapeHtml(tr(language, "rightsResponsibilities"))}</h2>
      <b>${escapeHtml(tr(language, "whatYouMustDo"))}</b><ul>${htmlList(rights?.you_must_do, notFound)}</ul>
      <b>${escapeHtml(tr(language, "otherPartyMustDo"))}</b><ul>${htmlList(rights?.other_party_must_do, notFound)}</ul>
    </section>

    <section>
      <h2>${escapeHtml(tr(language, "schemes"))}</h2>
      ${schemeItems}
    </section>

    <p class="disclaimer">${escapeHtml(tr(language, "reportDisclaimer"))}</p>
  </main>
</body>
</html>`;
}

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
  const [recentDocs, setRecentDocs] = useState(loadRecentDocuments);
  const [reportStatus, setReportStatus] = useState("");
  const [fontStep, setFontStep] = useState(1);
  const [language, setLanguage] = useState("en");
  const [contentLanguage, setContentLanguage] = useState("en");
  const [activeSection, setActiveSection] = useState("snapshot");
  const sectionLabels = SECTION_LABELS[language] || SECTION_LABELS.en;
  const outputLanguage = languageName(language);

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
    rememberDocument(document, analysisResult, language);
  }

  function rememberDocument(document, analysisResult, documentLanguage = language) {
    const nextItem = {
      id: document.id,
      filename: document.filename || document.title || "Document",
      document_type: analysisResult?.document_type || "",
      language: documentLanguage,
      saved_at: new Date().toISOString(),
    };
    const nextItems = [nextItem, ...recentDocs.filter((item) => item.id !== document.id)].slice(0, 6);
    setRecentDocs(nextItems);
    saveRecentDocuments(nextItems);
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

  async function openRecentDocument(item) {
    setErrors({});
    setLoading((current) => ({ ...current, recent: true }));
    const nextLanguage = item.language || language;
    try {
      setLanguage(nextLanguage);
      const [document, analysisResult] = await Promise.all([
        getDocument(item.id),
        getAnalysis(item.id).catch(() =>
          analyzeDocument(item.id, {
            language: languageName(nextLanguage),
          }),
        ),
      ]);
      setDoc(document);
      setAnalysis(analysisResult);
      setRisk(null);
      setRights(null);
      setSchemes(null);
      setActionPlan(null);
      setContentLanguage(nextLanguage);
      setActiveSection("snapshot");
      rememberDocument(document, analysisResult, nextLanguage);
    } catch (err) {
      const nextItems = recentDocs.filter((recent) => recent.id !== item.id);
      setRecentDocs(nextItems);
      saveRecentDocuments(nextItems);
      setErrors((current) => ({ ...current, recent: actionableError(err.message) }));
    } finally {
      setLoading((current) => ({ ...current, recent: false }));
    }
  }

  async function removeDocument(item) {
    try {
      await deleteDocument(item.id);
    } catch (err) {
      if (!/not found/i.test(err.message)) {
        setErrors((current) => ({ ...current, recent: actionableError(err.message) }));
        return;
      }
    }
    const nextItems = recentDocs.filter((recent) => recent.id !== item.id);
    setRecentDocs(nextItems);
    saveRecentDocuments(nextItems);
    if (doc?.id === item.id) {
      reset();
    }
  }

  function currentReport() {
    return buildReport({ doc, analysis, risk, rights, actionPlan, schemes, language });
  }

  function currentReportHtml() {
    return buildReportHtml({ doc, analysis, risk, rights, actionPlan, schemes, language });
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(currentReport());
      setReportStatus(tr(language, "reportCopied"));
    } catch {
      downloadReport();
      setReportStatus(tr(language, "clipboardFallback"));
    }
  }

  function downloadReport() {
    const blob = new Blob([currentReportHtml()], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(doc?.filename || "janmitra-report").replace(/\.[^.]+$/, "")}-mobile-report.html`;
    link.click();
    URL.revokeObjectURL(url);
    setReportStatus(tr(language, "reportDownloaded"));
  }

  function printReport() {
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) {
      downloadReport();
      setReportStatus(tr(language, "popupFallback"));
      return;
    }
    reportWindow.document.write(currentReportHtml());
    reportWindow.document.close();
    reportWindow.focus();
    setTimeout(() => reportWindow.print(), 250);
    setReportStatus(tr(language, "printHint"));
  }

  return (
    <div className="gov-page">
      <a className="skip-link" href="#main-content">
        {tr(language, "skip")}
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
              <span>{tr(language, "language")}</span>
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
            {tr(language, "home")}
          </a>
          <a className="nav-item" href="#document-analysis">
            {tr(language, "documentAnalysis")}
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
              <span className="nav-item locked" aria-disabled="true" title={tr(language, "uploadFirst")}>
                🔒 {sectionLabels["action-plan"]}
              </span>
              <span className="nav-item locked" aria-disabled="true" title={tr(language, "uploadFirst")}>
                🔒 {sectionLabels.rights}
              </span>
              <span className="nav-item locked" aria-disabled="true" title={tr(language, "uploadFirst")}>
                🔒 {sectionLabels.schemes}
              </span>
            </>
          )}
        </div>
      </nav>

      <main id="main-content" className="gov-main">
        <p className="page-intro">
          {tr(language, "pageIntro")}
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
            {recentDocs.length > 0 && (
              <section className="panel recent-panel">
                <div className="panel-head">
                  <h3>{tr(language, "recentDocuments")}</h3>
                  {loading.recent && <span className="muted">{tr(language, "opening")}</span>}
                </div>
                {errors.recent && <p className="error">{errors.recent}</p>}
                <div className="recent-list">
                  {recentDocs.map((item) => (
                    <article className="recent-card" key={item.id}>
                      <div>
                        <strong>{item.filename}</strong>
                        <p className="muted">
                          {item.document_type || tr(language, "document")} ·{" "}
                          {new Date(item.saved_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="recent-actions">
                        <button type="button" onClick={() => openRecentDocument(item)} disabled={loading.recent}>
                          {tr(language, "open")}
                        </button>
                        <button type="button" className="ghost" onClick={() => removeDocument(item)}>
                          {tr(language, "delete")}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
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
                {tr(language, "uploadAnother")}
              </button>
              <div className="doc-actions">
                <button type="button" className="ghost" onClick={copyReport}>
                  {tr(language, "copyReport")}
                </button>
                <button type="button" onClick={downloadReport}>
                  {tr(language, "mobileReport")}
                </button>
                <button type="button" onClick={printReport}>
                  {tr(language, "savePdf")}
                </button>
              </div>
            </div>
            {reportStatus && <p className="status-note">{reportStatus}</p>}

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
                  {loading.analysis ? (
                    <section className="panel">
                      <h3>{tr(language, "snapshotLoadingTitle")}</h3>
                      <p className="muted">
                        {tr(language, "snapshotRegenerating")}
                      </p>
                    </section>
                  ) : (
                    <DocumentSnapshot analysis={analysis} language={language} />
                  )}
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
