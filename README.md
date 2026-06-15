# JanMitra AI

JanMitra AI is a multilingual financial and legal literacy assistant for Indian citizens. It helps people understand uploaded documents, risks, rights, responsibilities, and relevant government schemes in plain language across English, Hindi, Bengali, Marathi, Tamil, and Telugu UI flows.

> **Educational use only.** JanMitra AI does not provide legal or financial advice. Scheme eligibility and legal conclusions must always be verified through official sources or qualified professionals.

## Hackathon Polish / V2 Highlights

- **Guided citizen journey:** homepage flow for trying a demo, uploading a document, reviewing insights, and asking follow-up questions.
- **Demo document mode:** load curated sample documents without needing a real file upload, including farmer KCC, rental agreement, and ration-card address-update examples.
- **Document Snapshot:** quick panel with the document type, parties, dates, amounts, obligations, and key extracted facts when available.
- **Tabbed document workspace:** only one section is visible at a time after upload, keeping Snapshot, Action Plan, Risks, Rights, Schemes, and Ask Doc readable on desktop and mobile.
- **Risk, rights, and schemes UI:** clearer cards with evidence, ranking, eligibility explanations, and source links/labels where the backend provides them.
- **Citizen Action Plan:** document-specific next steps that translate analysis into practical actions.
- **Scheme personalization:** filter scheme matches by state, age, occupation, income band, category, residence, gender, and language.
- **Expanded language selector:** user-controlled language experience for app chrome, generated sections, scheme matching, reports, and chat responses across English, Hindi, Bengali, Marathi, Tamil, and Telugu. Deterministic demo copy is strongest for English/Hindi; uploaded documents and non-Hindi demo regeneration rely on Gemini following the selected language instruction.
- **Resilience UX:** state-aware navigation, loading states, retry handling, and cold-start messaging for free-tier backend hosting.
- **Persistence and sharing MVP:** browser-local recent documents, safe delete, copyable text reports, mobile-first HTML export, and browser save-as-PDF support.

## Core Features

- Document upload and understanding for PDFs, images, and scanned documents via Gemini.
- Multilingual AI chat with source-based answers and a "not found in the document" guardrail.
- Text-to-speech through the browser Web Speech API where the browser supports the response language.
- Education-level adaptation: Basic, Standard, and Advanced.
- Risk Intelligence Dashboard with low/medium/high risk framing.
- Rights & Responsibilities engine for citizen-friendly obligations and entitlements.
- Government scheme discovery from a curated knowledge base.
- Auto-generated suggested questions.
- Local recent-document reopening and deletion from the current browser.
- Standalone mobile HTML report download, text report copy, and browser print/save-as-PDF flow.

## Demo Flow

1. Start the backend and frontend locally.
2. Open the frontend at `http://localhost:5173`.
3. Choose **Show sample documents** to fetch judge-ready samples, or upload a PDF/image.
4. Select a sample; the app imports it through the backend demo endpoint.
5. Review one workspace tab at a time: Document Snapshot, Action Plan, Risks, Rights, Schemes, or Ask Doc.
6. Ask follow-up questions in a supported language.
7. Export a mobile report or use **Save PDF** for a shareable offline copy.

## Language Support

The frontend language selector currently exposes:

| Code | Language | Native label |
| --- | --- | --- |
| `en` | English | English |
| `hi` | Hindi | हिन्दी |
| `bn` | Bengali | বাংলা |
| `mr` | Marathi | मराठी |
| `ta` | Tamil | தமிழ் |
| `te` | Telugu | తెలుగు |

The selected language is passed to backend analysis, risk, rights, action-plan, scheme, suggested-question, and chat endpoints. The UI and exported reports use a shared frontend translation layer. English/Hindi demo responses are deterministic for presentation reliability; other languages depend on Gemini regeneration and should be validated with representative documents before production use.

## API Additions

Backend API docs are available at `http://localhost:8000/docs` when running locally.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/demo-documents` | Lists curated sample documents available for demos. |
| `POST` | `/api/demo-documents/{sample_id}` | Imports/analyzes a selected demo sample as a document. |
| `GET` | `/api/documents/{document_id}/action-plan` | Returns practical next steps for the analyzed document. |
| `GET` | `/api/documents/{document_id}/schemes` | Returns relevant schemes; supports optional personalization query params. |
| `DELETE` | `/api/documents/{document_id}` | Deletes the document record, related rows, and stored file when available. |

Supported scheme query params: `state`, `age`, `occupation`, `income_band`, `category`, `residence`, `gender`, and `language`.

Recent documents are stored only in the user's browser local storage. Backend document durability depends on the deployment storage; Render free-tier filesystem data may reset on redeploy. The mobile report download is a standalone HTML file that opens well on phones; use **Save PDF** to trigger the browser/OS print-to-PDF flow.

## Persistence, Sharing, and Auth

JanMitra currently uses a no-login persistence model:

- recent documents are remembered in browser local storage;
- document records, analysis, and chat are stored in backend SQLite while the deployment filesystem persists;
- users can delete a document record and stored file through the app/API;
- reports are offline exports, not public sharing links.

Account creation/login is intentionally deferred. It makes sense only when JanMitra adds a managed auth provider and durable cloud database for cross-device history, saved reports, and private share links. Do not implement local-only username/password auth for demos; it would create a false sense of security.

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Python + FastAPI
- **AI / OCR:** Google Gemini API
- **Storage:** SQLite for documents/chat history plus browser local storage for recent sessions; no user accounts yet
- **Voice:** Browser Web Speech API
- **Deployment:** Vercel frontend + Render/Railway backend

## Project Structure

```text
JanMitra/
├── backend/        FastAPI app, Gemini services, SQLite storage
├── frontend/       React + Vite client
└── vision.md       Product vision and compact PRD
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- A Google Gemini API key

### Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env        # then add your GEMINI_API_KEY
uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000` with OpenAPI docs at `/docs`.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Environment Variables

See `backend/.env.example`. Never commit your real `.env`.

## Deployment

Deploy the **backend first** so you have its URL for the frontend, then deploy the frontend, then configure backend CORS for the frontend URL.

### 1. Backend — Render

`render.yaml` defines the Python service. In Render, choose **New > Blueprint** and point it at this repo. Set:

- `GEMINI_API_KEY` — your Gemini key.
- `CORS_ORIGINS` — your Vercel frontend URL, once available.

The free plan uses an ephemeral filesystem, so uploaded documents and chat history reset on redeploy. Use a paid instance with a disk for durable storage.

### 2. Frontend — Vercel

`frontend/vercel.json` configures the Vite build. In Vercel, import the repo, set the root directory to `frontend`, and add:

- `VITE_API_BASE_URL` — the backend URL from Render/Railway.

### 3. Connect and keep warm

Set `CORS_ORIGINS` on the backend to the Vercel URL and redeploy.

Render free tier sleeps after idle periods, so the app shows cold-start/loading UX. To reduce cold starts, enable `.github/workflows/keep-alive.yml` and set the repository Actions variable `BACKEND_URL` to your backend URL, or run:

```powershell
python scripts/keep_alive.py https://<your-backend>.onrender.com --loop
```

## Quota Notes

Gemini free-tier API keys can hit `429` rate limits or `503` model-busy responses. The backend falls back across configured models (`GEMINI_MODEL` → `GEMINI_FALLBACK_MODELS`). For reliable production demos, use pay-as-you-go API billing.
