function levelClass(level) {
  const l = (level || "").toLowerCase();
  if (l === "high") return "risk-high";
  if (l === "medium") return "risk-medium";
  return "risk-low";
}

export default function RiskDashboard({ report, loading, error, onRetry }) {
  return (
    <section id="risks" className="panel">
      <div className="panel-head">
        <h3>Risk Intelligence</h3>
        {report?.overall_risk && (
          <span className={`badge ${levelClass(report.overall_risk)}`}>
            {report.overall_risk} Risk
          </span>
        )}
      </div>
      <p className="muted">
        High = urgent legal/financial concern, Medium = review soon, Low = keep for records.
      </p>
      {loading && <p className="muted">Checking for risk signals and source evidence…</p>}
      {error && (
        <div className="error-box">
          <strong>Risk insights unavailable.</strong>
          <p>{error}</p>
          <button type="button" className="ghost small-btn" onClick={onRetry}>
            Retry risks
          </button>
        </div>
      )}
      {!loading && !error && !report && <p className="muted">Risk insights will appear here.</p>}
      {!loading && !error && report?.items?.length === 0 ? (
        <div className="empty-state">
          <strong>No notable risks detected.</strong>
          <p>Still verify document authenticity, dates, and payment instructions.</p>
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
                  <p className="action-line">Next step: {item.recommended_action}</p>
                )}
                {item.evidence && <p className="source">Quote: {item.evidence}</p>}
                {item.source && <p className="source">Evidence/source: {item.source}</p>}
              </li>
            ))}
          </ul>
        )
      )}
    </section>
  );
}
