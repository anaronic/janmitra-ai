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

export default function DocumentSnapshot({ analysis, language }) {
  if (!analysis) return null;
  return (
    <section className="panel snapshot-panel">
      <div className="panel-head">
        <h3>{tr(language, "snapshotLoadingTitle")}</h3>
        <span className="badge badge-soft">{analysis.document_type || tr(language, "document")}</span>
      </div>
      <div className="snapshot-grid">
        <SnapshotList
          title={tr(language, "peopleEntities")}
          items={analysis.entities}
          empty={tr(language, "noEntities")}
        />
        <SnapshotList
          title={tr(language, "importantDates")}
          items={analysis.dates}
          empty={tr(language, "noDates")}
        />
        <SnapshotList
          title={tr(language, "amounts")}
          items={analysis.amounts}
          empty={tr(language, "noAmounts")}
        />
        <SnapshotList
          title={tr(language, "keyClauses")}
          items={analysis.clauses}
          empty={tr(language, "noClauses")}
        />
        <SnapshotList
          title={tr(language, "signatories")}
          items={analysis.signatories}
          empty={tr(language, "noSignatories")}
        />
      </div>
    </section>
  );
}
import { tr } from "../i18n";
