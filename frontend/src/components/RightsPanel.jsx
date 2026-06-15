function List({ title, items, empty }) {
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
        <p className="muted">{empty}</p>
      )}
    </div>
  );
}

export default function RightsPanel({ report, loading, error, language, onRetry }) {
  const hi = language === "hi";
  return (
    <section id="rights" className="panel">
      <div className="panel-head">
        <h3>{hi ? "अधिकार और जिम्मेदारियाँ" : "Rights & Responsibilities"}</h3>
        {error && (
          <button type="button" className="ghost small-btn" onClick={onRetry}>
            {hi ? "फिर कोशिश करें" : "Retry"}
          </button>
        )}
      </div>
      <p className="muted">
        {hi
          ? "जिम्मेदारियों, समयसीमाओं और परिणामों का कार्य-उन्मुख सारांश।"
          : "Action-oriented summary of obligations, deadlines, and consequences."}
      </p>
      {loading && <p className="muted">{hi ? "दस्तावेज़ से अधिकार और कर्तव्य पढ़े जा रहे हैं…" : "Reading duties and rights from the document…"}</p>}
      {error && (
        <div className="error-box">
          <strong>{hi ? "अधिकार सारांश उपलब्ध नहीं है।" : "Rights summary unavailable."}</strong>
          <p>{error}</p>
        </div>
      )}
      {!loading && !error && !report && <p className="muted">{hi ? "अधिकार सारांश यहाँ दिखाई देगा।" : "Rights summary will appear here."}</p>}
      {!loading && !error && report && (
        <div className="rights-grid">
          <List
            title={hi ? "आपको क्या करना है" : "What you must do"}
            items={report.you_must_do}
            empty={hi ? "इस भाग में कुछ विशेष नहीं मिला।" : "Nothing specific found in this section."}
          />
          <List
            title={hi ? "दूसरे पक्ष को क्या करना है" : "What the other party must do"}
            items={report.other_party_must_do}
            empty={hi ? "इस भाग में कुछ विशेष नहीं मिला।" : "Nothing specific found in this section."}
          />
          <List
            title={hi ? "महत्वपूर्ण समयसीमाएँ" : "Important deadlines"}
            items={report.important_deadlines}
            empty={hi ? "कोई समयसीमा नहीं मिली।" : "No deadlines found."}
          />
          <List
            title={hi ? "पालन न करने पर" : "If you fail to comply"}
            items={report.if_you_fail_to_comply}
            empty={hi ? "कोई परिणाम नहीं मिला।" : "No consequences found."}
          />
        </div>
      )}
    </section>
  );
}
