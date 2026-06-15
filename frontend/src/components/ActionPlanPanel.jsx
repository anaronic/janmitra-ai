function PlanGroup({ title, items, empty }) {
  return (
    <div className="plan-group">
      <h4>{title}</h4>
      {items?.length ? (
        <ol>
          {items.map((item, i) => (
            <li key={`${title}-${i}`}>{item}</li>
          ))}
        </ol>
      ) : (
        <p className="muted">{empty}</p>
      )}
    </div>
  );
}

export default function ActionPlanPanel({ plan, loading, error, language, onRetry }) {
  const hi = language === "hi";
  return (
    <section id="action-plan" className="panel">
      <div className="panel-head">
        <h3>{hi ? "नागरिक कार्य योजना" : "Citizen Action Plan"}</h3>
        {error && (
          <button type="button" className="ghost small-btn" onClick={onRetry}>
            {hi ? "फिर कोशिश करें" : "Retry"}
          </button>
        )}
      </div>
      {loading && <p className="muted">{hi ? "व्यावहारिक अगले कदम तैयार हो रहे हैं…" : "Preparing practical next steps…"}</p>}
      {error && (
        <div className="error-box">
          <strong>{hi ? "कार्य योजना उपलब्ध नहीं है।" : "Action plan unavailable."}</strong>
          <p>{error}</p>
          <p className="muted">
            {hi
              ? "अगर backend शुरू हो रहा है, 30 सेकंड रुककर फिर कोशिश करें।"
              : "If the backend is waking up, wait 30 seconds and retry."}
          </p>
        </div>
      )}
      {!loading && !error && plan && (
        <>
          <PlanGroup
            title={hi ? "पहले यह करें" : "Do first"}
            items={plan.immediate_actions}
            empty={hi ? "कोई तत्काल कदम नहीं मिला।" : "No immediate action was identified."}
          />
          <PlanGroup
            title={hi ? "इकट्ठा करने वाले दस्तावेज़" : "Documents to collect"}
            items={plan.documents_to_collect}
            empty={hi ? "कोई अतिरिक्त दस्तावेज़ सूचीबद्ध नहीं है।" : "No extra documents listed."}
          />
          <PlanGroup
            title={hi ? "समयसीमाएँ" : "Deadlines"}
            items={plan.deadlines}
            empty={hi ? "कोई समयसीमा नहीं मिली।" : "No deadlines extracted."}
          />
          <PlanGroup
            title={hi ? "पूछने योग्य प्रश्न" : "Questions to ask"}
            items={plan.questions_to_ask}
            empty={hi ? "कोई प्रश्न सुझाया नहीं गया।" : "No questions suggested."}
          />
          <PlanGroup
            title={hi ? "कार्रवाई से पहले सत्यापित करें" : "Verify before acting"}
            items={plan.verification_steps}
            empty={hi ? "जारी करने वाले कार्यालय या आधिकारिक पोर्टल से सत्यापित करें।" : "Verify with the issuing office or official portal."}
          />
          {plan.disclaimer && <p className="disclaimer">{plan.disclaimer}</p>}
        </>
      )}
      {!loading && !error && !plan && (
        <p className="muted">{hi ? "कार्य योजना यहाँ दिखाई देगी।" : "Action plan will appear here."}</p>
      )}
    </section>
  );
}
