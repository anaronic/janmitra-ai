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
  const hi = language === "hi";

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
        <h3>{hi ? "संबंधित सरकारी योजनाएँ" : "Relevant Government Schemes"}</h3>
        {error && (
          <button type="button" className="ghost small-btn" onClick={onRetry}>
            {hi ? "फिर कोशिश करें" : "Retry"}
          </button>
        )}
      </div>
      <form className="scheme-form" onSubmit={submit}>
        <label>
          {hi ? "राज्य" : "State"}
          <input value={filters.state} onChange={(e) => update("state", e.target.value)} placeholder="e.g. Bihar" />
        </label>
        <label>
          {hi ? "आयु" : "Age"}
          <input value={filters.age} onChange={(e) => update("age", e.target.value)} inputMode="numeric" />
        </label>
        <label>
          {hi ? "पेशा" : "Occupation"}
          <input
            value={filters.occupation}
            onChange={(e) => update("occupation", e.target.value)}
            placeholder="farmer, student…"
          />
        </label>
        <label>
          {hi ? "आय वर्ग" : "Income band"}
          <select value={filters.income_band} onChange={(e) => update("income_band", e.target.value)}>
            <option value="">{hi ? "पता नहीं" : "Not sure"}</option>
            <option value="low">{hi ? "कम आय" : "Low income"}</option>
            <option value="middle">{hi ? "मध्यम आय" : "Middle income"}</option>
            <option value="high">{hi ? "उच्च आय" : "High income"}</option>
          </select>
        </label>
        <label>
          {hi ? "श्रेणी" : "Category"}
          <input value={filters.category} onChange={(e) => update("category", e.target.value)} placeholder="SC/ST/OBC/General" />
        </label>
        <label>
          {hi ? "निवास" : "Residence"}
          <select value={filters.residence} onChange={(e) => update("residence", e.target.value)}>
            <option value="">{hi ? "पता नहीं" : "Not sure"}</option>
            <option value="rural">{hi ? "ग्रामीण" : "Rural"}</option>
            <option value="urban">{hi ? "शहरी" : "Urban"}</option>
          </select>
        </label>
        <label>
          {hi ? "लिंग" : "Gender"}
          <select value={filters.gender} onChange={(e) => update("gender", e.target.value)}>
            <option value="">{hi ? "बताना नहीं चाहते" : "Prefer not to say"}</option>
            <option value="female">{hi ? "महिला" : "Female"}</option>
            <option value="male">{hi ? "पुरुष" : "Male"}</option>
            <option value="other">{hi ? "अन्य" : "Other"}</option>
          </select>
        </label>
        <button type="submit" disabled={loading}>
          {hi ? "बेहतर मिलान खोजें" : "Find better matches"}
        </button>
      </form>
      {loading && (
        <p className="muted">
          {hi
            ? "आपके दस्तावेज़ और प्रोफाइल के लिए योजनाएँ खोजी जा रही हैं…"
            : "Finding schemes for your document and profile…"}
        </p>
      )}
      {error && (
        <div className="error-box">
          <strong>{hi ? "योजना खोज उपलब्ध नहीं है।" : "Scheme search unavailable."}</strong>
          <p>{error}</p>
        </div>
      )}
      {!loading && !error && !report && (
        <p className="muted">{hi ? "योजना सुझाव यहाँ दिखाई देंगे।" : "Scheme suggestions will appear here."}</p>
      )}
      {!loading && !error && report?.suggestions?.length === 0 ? (
        <div className="empty-state">
          <strong>{hi ? "कोई स्पष्ट रूप से संबंधित योजना नहीं मिली।" : "No clearly relevant schemes found."}</strong>
          <p>
            {hi
              ? "राज्य, आयु, पेशा या आय विवरण जोड़कर फिर खोजें।"
              : "Try adding state, age, occupation, or income details, then search again."}
          </p>
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
                      {hi ? "आधिकारिक साइट ↗" : "Official site ↗"}
                    </a>
                  )}
                </div>
                <p>{s.reason || s.eligibility_notes}</p>
                {s.eligibility_notes && (
                  <p className="action-line">{hi ? "पात्रता" : "Eligibility"}: {s.eligibility_notes}</p>
                )}
                {s.confidence !== undefined && s.confidence !== null && (
                  <p className="source">
                    {hi ? "मिलान भरोसा" : "Match confidence"}: {Math.round(Number(s.confidence) * 100)}%
                  </p>
                )}
                {s.required_documents && (
                  <p className="source">
                    {hi ? "दस्तावेज़" : "Documents"}:{" "}
                    {s.required_documents.join?.(", ") || s.required_documents}
                  </p>
                )}
                {s.source && <p className="source">{hi ? "स्रोत" : "Source"}: {s.source}</p>}
              </li>
            ))}
          </ul>
        )
      )}
      {report?.disclaimer && <p className="disclaimer">{report.disclaimer}</p>}
    </section>
  );
}
