function List({ title, items }) {
  return (
    <div className="rights-block">
      <h4>{title}</h4>
      {items?.length ? (
        <ul>
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="muted">Nothing specific found in this section.</p>
      )}
    </div>
  );
}

export default function RightsPanel({ report, loading, error, onRetry }) {
  return (
    <section id="rights" className="panel">
      <div className="panel-head">
        <h3>Rights & Responsibilities</h3>
        {error && (
          <button type="button" className="ghost small-btn" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
      <p className="muted">Action-oriented summary of obligations, deadlines, and consequences.</p>
      {loading && <p className="muted">Reading duties and rights from the document…</p>}
      {error && (
        <div className="error-box">
          <strong>Rights summary unavailable.</strong>
          <p>{error}</p>
        </div>
      )}
      {!loading && !error && !report && <p className="muted">Rights summary will appear here.</p>}
      {!loading && !error && report && (
        <div className="rights-grid">
          <List title="What you must do" items={report.you_must_do} />
          <List title="What the other party must do" items={report.other_party_must_do} />
          <List title="Important deadlines" items={report.important_deadlines} />
          <List title="If you fail to comply" items={report.if_you_fail_to_comply} />
        </div>
      )}
    </section>
  );
}
