import { tr } from "../i18n";

const steps = [
  { titleKey: "journeyStepUploadTitle", pillKey: "journeyStepUploadPill", textKey: "journeyStepUploadText" },
  { titleKey: "journeyStepUnderstandTitle", pillKey: "journeyStepUnderstandPill", textKey: "journeyStepUnderstandText" },
  { titleKey: "journeyStepActTitle", pillKey: "journeyStepActPill", textKey: "journeyStepActText" },
];

export default function GuidedJourney({ language, locked = true }) {
  return (
    <section className="journey" aria-label={tr(language, "journeyAria")}>
      <div className="journey-head">
        <p className="eyebrow">{tr(language, "guidedCitizenJourney")}</p>
        <h2>{tr(language, "journeyHeadline")}</h2>
        <p className="muted">
          {tr(language, "journeyIntro")}
        </p>
      </div>
      <div className="journey-steps">
        {steps.map((step) => (
          <article className="journey-step" key={step.titleKey}>
            <span className="step-pill">{tr(language, step.pillKey)}</span>
            <h3>{tr(language, step.titleKey)}</h3>
            <p>{tr(language, step.textKey)}</p>
          </article>
        ))}
      </div>
      {locked && (
        <div className="locked-preview" aria-live="polite">
          <strong>{tr(language, "journeyLockedTitle")}</strong>
          <span>{tr(language, "journeyLockedText")}</span>
        </div>
      )}
    </section>
  );
}
