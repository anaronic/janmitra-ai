function asList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "object") {
    return Object.entries(value).map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(", ") : val}`);
  }
  return [String(value)];
}

function SnapshotList({ title, items, empty }) {
  const list = asList(items);
  return (
    <div className="snapshot-block">
      <h4>{title}</h4>
      {list.length === 0 ? (
        <p className="muted">{empty}</p>
      ) : (
        <ul>
          {list.map((item, i) => (
            <li key={`${title}-${i}`}>{typeof item === "object" ? JSON.stringify(item) : item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DocumentSnapshot({ analysis }) {
  if (!analysis) return null;
  return (
    <section className="panel snapshot-panel">
      <div className="panel-head">
        <h3>Document Snapshot</h3>
        <span className="badge badge-soft">{analysis.document_type || "Document"}</span>
      </div>
      <div className="snapshot-grid">
        <SnapshotList title="People / entities" items={analysis.entities} empty="No named entities found." />
        <SnapshotList title="Important dates" items={analysis.dates} empty="No dates detected." />
        <SnapshotList title="Amounts" items={analysis.amounts} empty="No amounts detected." />
        <SnapshotList title="Key clauses" items={analysis.clauses} empty="No clauses extracted." />
        <SnapshotList title="Signatories" items={analysis.signatories} empty="No signatories detected." />
      </div>
    </section>
  );
}
