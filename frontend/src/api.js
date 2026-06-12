const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
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
