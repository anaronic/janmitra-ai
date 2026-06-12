function List({ title, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="rights-block">
      <h4>{title}</h4>
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function RightsPanel({ report }) {
  if (!report) return null;
  return (
    <section className="panel">
      <h3>Rights & Responsibilities</h3>
      <List title="What you must do" items={report.you_must_do} />
      <List title="What the other party must do" items={report.other_party_must_do} />
      <List title="Important deadlines" items={report.important_deadlines} />
      <List title="If you fail to comply" items={report.if_you_fail_to_comply} />
    </section>
  );
}
