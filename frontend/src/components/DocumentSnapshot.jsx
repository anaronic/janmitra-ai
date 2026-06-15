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
  const hi = language === "hi";
  return (
    <section className="panel snapshot-panel">
      <div className="panel-head">
        <h3>{hi ? "दस्तावेज़ सारांश" : "Document Snapshot"}</h3>
        <span className="badge badge-soft">{analysis.document_type || (hi ? "दस्तावेज़" : "Document")}</span>
      </div>
      <div className="snapshot-grid">
        <SnapshotList
          title={hi ? "लोग / संस्थाएँ" : "People / entities"}
          items={analysis.entities}
          empty={hi ? "कोई नामित संस्था नहीं मिली।" : "No named entities found."}
        />
        <SnapshotList
          title={hi ? "महत्वपूर्ण तारीखें" : "Important dates"}
          items={analysis.dates}
          empty={hi ? "कोई तारीख नहीं मिली।" : "No dates detected."}
        />
        <SnapshotList
          title={hi ? "राशियाँ" : "Amounts"}
          items={analysis.amounts}
          empty={hi ? "कोई राशि नहीं मिली।" : "No amounts detected."}
        />
        <SnapshotList
          title={hi ? "मुख्य शर्तें" : "Key clauses"}
          items={analysis.clauses}
          empty={hi ? "कोई शर्त नहीं निकाली गई।" : "No clauses extracted."}
        />
        <SnapshotList
          title={hi ? "हस्ताक्षरकर्ता" : "Signatories"}
          items={analysis.signatories}
          empty={hi ? "कोई हस्ताक्षरकर्ता नहीं मिला।" : "No signatories detected."}
        />
      </div>
    </section>
  );
}
