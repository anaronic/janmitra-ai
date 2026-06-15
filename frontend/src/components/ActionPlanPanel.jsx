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

export default function ActionPlanPanel({ plan, loading, error, onRetry }) {
  return (
    <section id="action-plan" className="panel">
      <div className="panel-head">
        <h3>Citizen Action Plan</h3>
        {error && (
          <button type="button" className="ghost small-btn" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
      {loading && <p className="muted">Preparing practical next steps…</p>}
      {error && (
        <div className="error-box">
          <strong>Action plan unavailable.</strong>
          <p>{error}</p>
          <p className="muted">If the backend is waking up, wait 30 seconds and retry.</p>
        </div>
      )}
      {!loading && !error && plan && (
        <>
          <PlanGroup
            title="Do first"
            items={plan.immediate_actions}
            empty="No immediate action was identified."
          />
          <PlanGroup
            title="Documents to collect"
            items={plan.documents_to_collect}
            empty="No extra documents listed."
          />
          <PlanGroup title="Deadlines" items={plan.deadlines} empty="No deadlines extracted." />
          <PlanGroup
            title="Questions to ask"
            items={plan.questions_to_ask}
            empty="No questions suggested."
          />
          <PlanGroup
            title="Verify before acting"
            items={plan.verification_steps}
            empty="Verify with the issuing office or official portal."
          />
          {plan.disclaimer && <p className="disclaimer">{plan.disclaimer}</p>}
        </>
      )}
      {!loading && !error && !plan && <p className="muted">Action plan will appear here.</p>}
    </section>
  );
}
