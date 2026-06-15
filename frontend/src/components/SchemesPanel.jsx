export default function SchemesPanel({ report }) {
  if (!report) return null;
  return (
    <section id="schemes" className="panel">
      <h3>Relevant Government Schemes</h3>
      {report.suggestions.length === 0 ? (
        <p className="muted">No clearly relevant schemes found for this document.</p>
      ) : (
        <ul className="scheme-list">
          {report.suggestions.map((s, i) => (
            <li key={i}>
              <div className="scheme-row">
                <strong>{s.name}</strong>
                {s.official_url && (
                  <a href={s.official_url} target="_blank" rel="noreferrer">
                    Official site ↗
                  </a>
                )}
              </div>
              <p>{s.reason}</p>
            </li>
          ))}
        </ul>
      )}
      <p className="disclaimer">{report.disclaimer}</p>
    </section>
  );
}
