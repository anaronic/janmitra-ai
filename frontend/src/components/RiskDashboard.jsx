function levelClass(level) {
  const l = (level || "").toLowerCase();
  if (l === "high") return "risk-high";
  if (l === "medium") return "risk-medium";
  return "risk-low";
}

export default function RiskDashboard({ report, loading, error, language, onRetry }) {
  const hi = language === "hi";
  return (
    <section id="risks" className="panel">
      <div className="panel-head">
        <h3>{hi ? "जोखिम विश्लेषण" : "Risk Intelligence"}</h3>
        {report?.overall_risk && (
          <span className={`badge ${levelClass(report.overall_risk)}`}>
            {report.overall_risk} {hi ? "जोखिम" : "Risk"}
          </span>
        )}
      </div>
      <p className="muted">
        {hi
          ? "High = तत्काल कानूनी/वित्तीय चिंता, Medium = जल्द समीक्षा करें, Low = रिकॉर्ड के लिए रखें।"
          : "High = urgent legal/financial concern, Medium = review soon, Low = keep for records."}
      </p>
      {loading && <p className="muted">{hi ? "जोखिम संकेत और स्रोत प्रमाण देखे जा रहे हैं…" : "Checking for risk signals and source evidence…"}</p>}
      {error && (
        <div className="error-box">
          <strong>{hi ? "जोखिम जानकारी उपलब्ध नहीं है।" : "Risk insights unavailable."}</strong>
          <p>{error}</p>
          <button type="button" className="ghost small-btn" onClick={onRetry}>
            {hi ? "जोखिम फिर जाँचें" : "Retry risks"}
          </button>
        </div>
      )}
      {!loading && !error && !report && <p className="muted">{hi ? "जोखिम जानकारी यहाँ दिखाई देगी।" : "Risk insights will appear here."}</p>}
      {!loading && !error && report?.items?.length === 0 ? (
        <div className="empty-state">
          <strong>{hi ? "कोई प्रमुख जोखिम नहीं मिला।" : "No notable risks detected."}</strong>
          <p>{hi ? "फिर भी दस्तावेज़ की सत्यता, तारीखें और भुगतान निर्देश सत्यापित करें।" : "Still verify document authenticity, dates, and payment instructions."}</p>
        </div>
      ) : (
        !loading &&
        !error &&
        report?.items?.length > 0 && (
          <ul className="risk-list">
            {report.items.map((item, i) => (
              <li key={i} className="evidence-card">
                <div className="risk-row">
                  <strong>{item.category || "Risk signal"}</strong>
                  <span className={`badge ${levelClass(item.level)}`}>{item.level || "Review"}</span>
                </div>
                <p>{item.explanation}</p>
                {item.recommended_action && (
                  <p className="action-line">{hi ? "अगला कदम" : "Next step"}: {item.recommended_action}</p>
                )}
                {item.evidence && <p className="source">{hi ? "उद्धरण" : "Quote"}: {item.evidence}</p>}
                {item.source && <p className="source">{hi ? "प्रमाण/स्रोत" : "Evidence/source"}: {item.source}</p>}
              </li>
            ))}
          </ul>
        )
      )}
    </section>
  );
}
