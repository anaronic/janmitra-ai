const steps = [
  {
    title: "1. Upload",
    hindi: "अपलोड",
    text: "Add a PDF/image or choose a judge-ready sample document.",
  },
  {
    title: "2. Understand",
    hindi: "समझें",
    text: "See document type, key people, dates, amounts, risks, and rights.",
  },
  {
    title: "3. Act",
    hindi: "कार्रवाई",
    text: "Get a citizen action plan, schemes, and chat guidance in simple language.",
  },
];

export default function GuidedJourney({ locked = true }) {
  return (
    <section className="journey" aria-label="How JanMitra works">
      <div className="journey-head">
        <p className="eyebrow">Guided citizen journey</p>
        <h2>Upload → Understand → Act</h2>
        <p className="muted">
          JanMitra turns dense public-service documents into next steps you can verify.
        </p>
      </div>
      <div className="journey-steps">
        {steps.map((step) => (
          <article className="journey-step" key={step.title}>
            <span className="step-pill">{step.hindi}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </article>
        ))}
      </div>
      {locked && (
        <div className="locked-preview" aria-live="polite">
          <strong>Locked until a document is ready</strong>
          <span>Rights, schemes, chat, and action plan appear after upload or sample selection.</span>
        </div>
      )}
    </section>
  );
}
