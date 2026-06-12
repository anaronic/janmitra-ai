const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Surface which backend the app is talking to. On a deployed site this should be
// your Render URL — if it still shows localhost, VITE_API_BASE_URL was not set at
// build time (Vite bakes env vars in at build), so redeploy after setting it.
if (typeof console !== "undefined") {
  console.info(`[JanMitra] API base URL: ${API_BASE_URL}`);
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch {
    // Network-level failure ("Failed to fetch"): wrong/unset API URL, backend
    // asleep or down, CORS block, or mixed content (https page -> http API).
    const isLocal = API_BASE_URL.includes("localhost") || API_BASE_URL.includes("127.0.0.1");
    const hint = isLocal
      ? "The app is pointing at localhost. If this is the deployed site, set VITE_API_BASE_URL to your backend URL in Vercel and redeploy."
      : "Could not reach the backend. It may be waking from sleep (try again in ~30s), down, or blocking this origin via CORS.";
    throw new Error(`Cannot reach the server at ${API_BASE_URL}. ${hint}`);
  }
  if (!response.ok) {
    let detail = await response.text();
    try {
      detail = JSON.parse(detail).detail || detail;
    } catch {
      // keep raw text
    }
    throw new Error(detail || `Request failed (${response.status})`);
  }
  return response.json();
}

export function getHealth() {
  return request("/health");
}

export function uploadDocument(file) {
  const form = new FormData();
  form.append("file", file);
  return request("/api/documents", { method: "POST", body: form });
}

export function analyzeDocument(id) {
  return request(`/api/documents/${id}/analyze`, { method: "POST" });
}

export function getRisk(id) {
  return request(`/api/documents/${id}/risk`);
}

export function getRights(id) {
  return request(`/api/documents/${id}/rights`);
}

export function getSuggestedQuestions(id) {
  return request(`/api/documents/${id}/suggested-questions`);
}

export function getSchemes(id) {
  return request(`/api/documents/${id}/schemes`);
}

export function getChatHistory(id) {
  return request(`/api/documents/${id}/chat`);
}

export function sendChat(id, message, educationLevel) {
  return request(`/api/documents/${id}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, education_level: educationLevel }),
  });
}

export { API_BASE_URL };
