import { useEffect, useRef, useState } from "react";
import { getChatHistory, getSuggestedQuestions, sendChat } from "../api";
import { isSpeechSupported, speak, stopSpeaking } from "../speech";

const LEVELS = [
  { value: "basic", label: "Basic" },
  { value: "standard", label: "Standard" },
  { value: "advanced", label: "Advanced" },
];

export default function Chat({ documentId, language }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [level, setLevel] = useState("standard");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!documentId) return;
    getChatHistory(documentId).then((h) => setMessages(h.messages)).catch(() => {});
    getSuggestedQuestions(documentId).then((q) => setSuggestions(q.questions)).catch(() => {});
  }, [documentId]);

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
      const res = await sendChat(documentId, message, level, language);
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
        <h3>{language === "hi" ? "इस दस्तावेज़ पर सवाल पूछें" : "Ask about this document"}</h3>
        <label className="level-select">
          Level:{" "}
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {messages.length === 0 && suggestions.length > 0 && (
        <div className="suggestions">
          <p className="muted">{language === "hi" ? "पूछ कर देखें:" : "Try asking:"}</p>
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
                    🔊 Listen
                  </button>
                  <button className="listen ghost" onClick={stopSpeaking}>
                    ⏹ Stop
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && <p className="muted">Thinking…</p>}
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
          placeholder={
            language === "hi"
              ? "अपना प्रश्न हिंदी या किसी समर्थित भाषा में लिखें…"
              : "Type your question in any supported language…"
          }
          disabled={busy}
        />
        <button type="submit" disabled={busy || !input.trim()}>
          {language === "hi" ? "भेजें" : "Send"}
        </button>
      </form>
    </section>
  );
}
