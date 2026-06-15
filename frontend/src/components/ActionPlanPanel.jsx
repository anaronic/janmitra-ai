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
  return (
    <section id="action-plan" className="panel">
      <div className="panel-head">
        <h3>{tr(language, "citizenActionPlan")}</h3>
        {error && (
          <button type="button" className="ghost small-btn" onClick={onRetry}>
            {tr(language, "retry")}
          </button>
        )}
      </div>
      {loading && <p className="muted">{tr(language, "preparingSteps")}</p>}
      {error && (
        <div className="error-box">
          <strong>{tr(language, "actionPlanUnavailable")}</strong>
          <p>{error}</p>
          <p className="muted">
            {tr(language, "coldStartRetry")}
          </p>
        </div>
      )}
      {!loading && !error && plan && (
        <>
          <PlanGroup
            title={tr(language, "doFirst")}
            items={plan.immediate_actions}
            empty={tr(language, "noImmediateAction")}
          />
          <PlanGroup
            title={tr(language, "documentsToCollect")}
            items={plan.documents_to_collect}
            empty={tr(language, "noExtraDocuments")}
          />
          <PlanGroup
            title={tr(language, "deadlines")}
            items={plan.deadlines}
            empty={tr(language, "noDeadlines")}
          />
          <PlanGroup
            title={tr(language, "questionsToAsk")}
            items={plan.questions_to_ask}
            empty={tr(language, "noQuestions")}
          />
          <PlanGroup
            title={tr(language, "verifyBeforeActing")}
            items={plan.verification_steps}
            empty={tr(language, "verifyOfficial")}
          />
          {plan.disclaimer && <p className="disclaimer">{plan.disclaimer}</p>}
        </>
      )}
      {!loading && !error && !plan && (
        <p className="muted">{tr(language, "actionPlanWillAppear")}</p>
      )}
    </section>
  );
}
import { tr } from "../i18n";
