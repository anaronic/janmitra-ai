import { useEffect, useRef, useState } from "react";
import { getSuggestedQuestions, sendChat } from "../api";
import { outputLanguage as languageName, tr } from "../i18n";
import { isSpeechSupported, speak, stopSpeaking } from "../speech";

const LEVELS = [
  { value: "basic", labelKey: "levelBasic" },
  { value: "standard", labelKey: "levelStandard" },
  { value: "advanced", labelKey: "levelAdvanced" },
];

export default function Chat({ documentId, language }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [level, setLevel] = useState("standard");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const bottomRef = useRef(null);
  const outputLanguage = languageName(language);

  useEffect(() => {
    if (!documentId) return;
    getSuggestedQuestions(documentId, { language: outputLanguage }).then((q) => setSuggestions(q.questions)).catch(() => {});
  }, [documentId, outputLanguage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text) {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    setError("");
    setInput("");
    setMessages((m) => [...m, { role: "user", content: message, citations: [] }]);
    setBusy(true);
    try {
      const res = await sendChat(documentId, message, level, outputLanguage);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: res.reply, citations: res.citations, language: res.language },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel chat-panel">
      <div className="panel-head">
        <h3>{tr(language, "askAboutDocument")}</h3>
        <label className="level-select">
          {tr(language, "level")}:{" "}
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {tr(language, l.labelKey)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {messages.length === 0 && suggestions.length > 0 && (
        <div className="suggestions">
          <p className="muted">{tr(language, "tryAsking")}</p>
          {suggestions.map((q, i) => (
            <button key={i} className="chip" onClick={() => send(q)}>
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="messages">
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.role}`}>
            <div className="bubble">
              <p>{m.content}</p>
              {m.citations?.length > 0 && (
                <ul className="citations">
                  {m.citations.map((c, j) => (
                    <li key={j} title={c.quote}>
                      📌 {c.source}
                    </li>
                  ))}
                </ul>
              )}
              {m.role === "assistant" && isSpeechSupported() && (
                <div className="bubble-actions">
                  <button className="listen" onClick={() => speak(m.content, m.language)}>
                    🔊 {tr(language, "listen")}
                  </button>
                  <button className="listen ghost" onClick={stopSpeaking}>
                    ⏹ {tr(language, "stop")}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && <p className="muted">{tr(language, "thinking")}</p>}
        <div ref={bottomRef} />
      </div>

      {error && <p className="error">{error}</p>}

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={tr(language, "chatPlaceholder")}
          disabled={busy}
        />
        <button type="submit" disabled={busy || !input.trim()}>
          {tr(language, "send")}
        </button>
      </form>
    </section>
  );
}
