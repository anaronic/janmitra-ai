function levelClass(level) {
  const l = (level || "").toLowerCase();
  if (l === "high") return "risk-high";
  if (l === "medium") return "risk-medium";
  return "risk-low";
}

export default function RiskDashboard({ report }) {
  if (!report) return null;
  return (
    <section className="panel">
      <div className="panel-head">
        <h3>Risk Intelligence</h3>
        <span className={`badge ${levelClass(report.overall_risk)}`}>
          {report.overall_risk} Risk
        </span>
      </div>
      {report.items.length === 0 ? (
        <p className="muted">No notable risks detected.</p>
      ) : (
        <ul className="risk-list">
          {report.items.map((item, i) => (
            <li key={i}>
              <div className="risk-row">
                <strong>{item.category}</strong>
                <span className={`badge ${levelClass(item.level)}`}>{item.level}</span>
              </div>
              <p>{item.explanation}</p>
              {item.source && <p className="source">Source: {item.source}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
