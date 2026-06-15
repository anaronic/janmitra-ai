import { useState } from "react";

const initialFilters = {
  state: "",
  age: "",
  occupation: "",
  income_band: "",
  category: "",
  residence: "",
  gender: "",
};

export default function SchemesPanel({ report, loading, error, language, onApply, onRetry }) {
  const [filters, setFilters] = useState(initialFilters);

  function update(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function submit(e) {
    e.preventDefault();
    onApply({ ...filters, language });
  }

  return (
    <section id="schemes" className="panel">
      <div className="panel-head">
        <h3>Relevant Government Schemes</h3>
        {error && (
          <button type="button" className="ghost small-btn" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
      <form className="scheme-form" onSubmit={submit}>
        <label>
          State
          <input value={filters.state} onChange={(e) => update("state", e.target.value)} placeholder="e.g. Bihar" />
        </label>
        <label>
          Age
          <input value={filters.age} onChange={(e) => update("age", e.target.value)} inputMode="numeric" />
        </label>
        <label>
          Occupation
          <input
            value={filters.occupation}
            onChange={(e) => update("occupation", e.target.value)}
            placeholder="farmer, student…"
          />
        </label>
        <label>
          Income band
          <select value={filters.income_band} onChange={(e) => update("income_band", e.target.value)}>
            <option value="">Not sure</option>
            <option value="low">Low income</option>
            <option value="middle">Middle income</option>
            <option value="high">High income</option>
          </select>
        </label>
        <label>
          Category
          <input value={filters.category} onChange={(e) => update("category", e.target.value)} placeholder="SC/ST/OBC/General" />
        </label>
        <label>
          Residence
          <select value={filters.residence} onChange={(e) => update("residence", e.target.value)}>
            <option value="">Not sure</option>
            <option value="rural">Rural</option>
            <option value="urban">Urban</option>
          </select>
        </label>
        <label>
          Gender
          <select value={filters.gender} onChange={(e) => update("gender", e.target.value)}>
            <option value="">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </label>
        <button type="submit" disabled={loading}>
          Find better matches
        </button>
      </form>
      {loading && <p className="muted">Finding schemes for your document and profile…</p>}
      {error && (
        <div className="error-box">
          <strong>Scheme search unavailable.</strong>
          <p>{error}</p>
        </div>
      )}
      {!loading && !error && !report && <p className="muted">Scheme suggestions will appear here.</p>}
      {!loading && !error && report?.suggestions?.length === 0 ? (
        <div className="empty-state">
          <strong>No clearly relevant schemes found.</strong>
          <p>Try adding state, age, occupation, or income details, then search again.</p>
        </div>
      ) : (
        !loading &&
        !error &&
        report?.suggestions?.length > 0 && (
          <ul className="scheme-list">
            {report.suggestions.map((s, i) => (
              <li key={i} className="evidence-card">
                <div className="scheme-row">
                  <strong>{s.name}</strong>
                  {s.official_url && (
                    <a href={s.official_url} target="_blank" rel="noreferrer">
                      Official site ↗
                    </a>
                  )}
                </div>
                <p>{s.reason || s.eligibility_notes}</p>
                {s.eligibility_notes && <p className="action-line">Eligibility: {s.eligibility_notes}</p>}
                {s.confidence !== undefined && s.confidence !== null && (
                  <p className="source">Match confidence: {Math.round(Number(s.confidence) * 100)}%</p>
                )}
                {s.required_documents && (
                  <p className="source">
                    Documents: {s.required_documents.join?.(", ") || s.required_documents}
                  </p>
                )}
                {s.source && <p className="source">Source: {s.source}</p>}
              </li>
            ))}
          </ul>
        )
      )}
      {report?.disclaimer && <p className="disclaimer">{report.disclaimer}</p>}
    </section>
  );
}
