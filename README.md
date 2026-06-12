# JanMitra AI

A multilingual financial and legal literacy assistant that helps Indian citizens understand
documents, rights, obligations, risks, and relevant government schemes in their preferred language
and at their chosen education level.

> **Educational use only.** JanMitra AI does not provide legal or financial advice. Scheme
> eligibility must always be verified through official sources.

## Features (V1)
- 📄 Document upload & understanding (PDF, images, scanned documents) via Gemini
- 💬 Multilingual AI chat (10 Indian languages) with automatic language detection
- 🔊 Hindi text-to-speech ("Listen") using the browser Web Speech API
- 🎓 Education-level adaptation (Basic / Standard / Advanced)
- 📌 Source-based citations (page / section), with a "not found" guarantee
- ⚠️ Risk Intelligence Dashboard (Low / Medium / High)
- ⚖️ Rights & Responsibilities engine
- 🏛️ Government scheme discovery (curated knowledge base)
- ❓ Auto-generated suggested questions

## Tech Stack
- **Frontend:** React + Vite
- **Backend:** Python + FastAPI
- **AI / OCR:** Google Gemini API
- **Storage:** SQLite (documents + chat history; no user accounts)
- **Voice:** Browser Web Speech API
- **Deployment:** Vercel (frontend) + Render/Railway (backend)

## Project Structure
```
JanMitra/
├── backend/        FastAPI app (API, Gemini services, SQLite)
├── frontend/       React + Vite client
└── vision.md       Product requirements
```

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- A Google Gemini API key

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env        # then add your GEMINI_API_KEY
uvicorn app.main:app --reload
```
Backend runs at http://localhost:8000 (docs at `/docs`).

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at http://localhost:5173.

## Environment Variables (backend)
See `backend/.env.example`. Never commit your real `.env`.

## Deployment

Deploy the **backend first** (you need its URL for the frontend), then the frontend, then
point the backend's CORS at the frontend URL.

### 1. Backend — Render
`render.yaml` (repo root) defines the service (Python pinned to 3.12 for reproducible builds).
In Render: **New > Blueprint** and point at this repo. Set the secret env vars when prompted:
- `GEMINI_API_KEY` — your Gemini key
- `CORS_ORIGINS` — set after step 2 to your Vercel URL (e.g. `https://janmitra-ai.vercel.app`).
  You can deploy first and edit this once you have the frontend URL.

Note the backend URL Render gives you, e.g. `https://janmitra-backend.onrender.com`.

> The free plan uses an ephemeral filesystem, so uploaded documents and chat history reset on
> redeploy. Upgrade to a paid instance with a disk for durable storage (see comments in `render.yaml`).

### 2. Frontend — Vercel
`frontend/vercel.json` configures the Vite build. In Vercel, import the repo, set the
**root directory** to `frontend`, and add the env var:
- `VITE_API_BASE_URL` — the backend URL from step 1.

Vercel gives you the shareable link (e.g. `https://janmitra-ai.vercel.app`).

### 3. Connect them
Back in Render, set `CORS_ORIGINS` to your Vercel URL and redeploy. Done.

> Heads-up on quota: a Gemini API key on the **free tier** is rate-limited (429) and the popular
> models can be busy (503). The backend automatically falls back across models
> (`GEMINI_MODEL` → `GEMINI_FALLBACK_MODELS`). For reliable production use, enable pay-as-you-go
> billing in Google AI Studio. (Google AI Plus is a consumer Gemini-app plan and does not grant API quota.)


