# JanMitra AI

JanMitra AI is a multilingual financial and legal literacy assistant for Indian citizens. It helps people understand uploaded documents, risks, rights, responsibilities, and relevant government schemes in plain English or Hindi.

> **Educational use only.** JanMitra AI does not provide legal or financial advice. Scheme eligibility and legal conclusions must always be verified through official sources or qualified professionals.

## Hackathon Polish / V2 Highlights

- **Guided citizen journey:** homepage flow for trying a demo, uploading a document, reviewing insights, and asking follow-up questions.
- **Demo document mode:** load curated sample documents without needing a real file upload.
- **Document Snapshot:** quick panel with the document type, parties, dates, amounts, obligations, and key extracted facts when available.
- **Risk, rights, and schemes UI:** clearer cards with evidence, ranking, and source links/labels where the backend provides them.
- **Citizen Action Plan:** document-specific next steps that translate analysis into practical actions.
- **Scheme personalization:** filter scheme matches by state, age, occupation, income band, category, residence, gender, and language.
- **English/Hindi selector:** user-controlled language experience applied across generated sections, scheme matching, sample metadata, and chat responses.
- **Resilience UX:** state-aware navigation, loading states, retry handling, and cold-start messaging for free-tier backend hosting.
- **Persistence and sharing MVP:** browser-local recent documents, safe delete, and offline Markdown report export/copy.

## Core Features

- Document upload and understanding for PDFs, images, and scanned documents via Gemini.
- Multilingual AI chat with source-based answers and a "not found in the document" guardrail.
- Hindi text-to-speech through the browser Web Speech API.
- Education-level adaptation: Basic, Standard, and Advanced.
- Risk Intelligence Dashboard with low/medium/high risk framing.
- Rights & Responsibilities engine for citizen-friendly obligations and entitlements.
- Government scheme discovery from a curated knowledge base.
- Auto-generated suggested questions.

## Demo Flow

1. Start the backend and frontend locally.
2. Open the frontend at `http://localhost:5173`.
3. Choose **Try demo document** to fetch sample documents.
4. Select a sample; the app imports it through the backend demo endpoint.
5. Review the Document Snapshot, risks, rights, schemes, and Citizen Action Plan.
6. Ask follow-up questions in English or Hindi.

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

Recent documents are stored only in the user's browser local storage. Backend document durability depends on the deployment storage; Render free-tier filesystem data may reset on redeploy.

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Python + FastAPI
- **AI / OCR:** Google Gemini API
- **Storage:** SQLite for documents and chat history; no user accounts
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
