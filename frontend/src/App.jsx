import { useEffect, useState } from "react";
import { getHealth } from "./api";
import "./App.css";

function App() {
  const [backendStatus, setBackendStatus] = useState("checking…");

  useEffect(() => {
    getHealth()
      .then((data) => setBackendStatus(data.status === "ok" ? "connected" : "unknown"))
      .catch(() => setBackendStatus("unavailable"));
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>JanMitra AI</h1>
        <p className="tagline">
          Understand your documents, rights, risks, and government schemes — in your language.
        </p>
      </header>

      <main className="app-main">
        <p className="status">
          Backend: <strong className={`status-${backendStatus}`}>{backendStatus}</strong>
        </p>
        <p className="disclaimer">
          Educational use only. JanMitra AI does not provide legal or financial advice.
        </p>
      </main>
    </div>
  );
}

export default App;
