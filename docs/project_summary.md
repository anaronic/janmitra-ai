# JanMitra AI — Project Summary

> **Educational use only.** JanMitra AI does not provide legal or financial advice. Scheme eligibility and legal conclusions must always be verified through official sources or qualified professionals.

## Project Overview

**What problem does it solve?**
Formal documents in India — loan notices, rental agreements, government-service letters, insurance policies — are written in dense legal, financial, and bureaucratic language. Ordinary citizens struggle to understand what a document *says*, what *risks* it carries, what their *rights and obligations* are, and what to *do next*. JanMitra AI turns an uploaded document into plain-language, multilingual guidance: a snapshot, ranked risks, rights/responsibilities, relevant government schemes, an action plan, and a grounded chat assistant.

**Who are the users?**
- Citizens trying to understand loans, notices, benefits, leases, or forms.
- Community volunteers, NGOs, and help-desk operators assisting citizens with paperwork.
- Hackathon/demo evaluators who want to see end-to-end value quickly via curated samples.

**Why it matters.**
It lowers the literacy and language barrier to understanding official paperwork — a first, safe navigation step *before* a citizen consults an expert or official source. The product is deliberately framed as educational, with guardrails ("not found in the document") and disclaimers throughout, so it informs without impersonating a lawyer, financial advisor, or eligibility authority.

## Key Features

- **Document understanding** — Upload a PDF or image; Gemini extracts text, document type, entities, dates, amounts, key clauses, and signatories (`gemini.analyze_document`).
- **Demo document mode** — Three curated samples (Kisan Credit Card notice, rental agreement, ration-card address update) load instantly without a real upload, with deterministic English/Hindi responses for reliable demos.
- **Document Snapshot** — A fast orientation panel of type, parties, dates, amounts, and clauses.
- **Risk Intelligence** — Risks ranked Low/Medium/High with plain-language explanations, source, and evidence quotes.
- **Rights & Responsibilities** — "You must do", "Other party must do", deadlines, and consequences of non-compliance.
- **Citizen Action Plan** — Immediate actions, documents to collect, deadlines, questions to ask, and verification steps (with a safe fallback when the model returns nothing).
- **Government scheme discovery** — Matches a curated catalog of ~19 central schemes to the document, personalizable by state, age, occupation, income band, category, residence, gender, and language.
- **Grounded multilingual chat** — Answers strictly from document content, with citations and a "not in the document" guardrail; replies in the selected language.
- **Text-to-speech** — Browser Web Speech API reads responses aloud where the browser supports the language.
- **Education-level adaptation** — Basic, Standard, and Advanced reading levels.
- **Persistence & sharing MVP** — Browser-local recent documents, safe delete, copyable text reports, mobile-first standalone HTML export, and browser save-as-PDF.
- **Resilience UX** — Cold-start messaging, retries, and actionable error hints for free-tier hosting.

## Technology Stack

| Layer | Technology |
| --- | --- |
| **Frontend language/framework** | JavaScript, React 19, Vite 8 |
| **Backend language/framework** | Python 3.11+ (3.12 in deploy), FastAPI, Uvicorn |
| **Data validation** | Pydantic v2, pydantic-settings |
| **AI / OCR** | Google Gemini API via `google-genai` SDK (default model `gemini-2.5-flash`, with fallbacks) |
| **Database** | SQLite (documents, analysis, chat history) |
| **Client storage** | Browser `localStorage` (recent documents) |
| **Voice** | Browser Web Speech API (`speechSynthesis`) |
| **Deployment** | Render (backend, `render.yaml`) + Vercel (frontend, `vercel.json`) |
| **Keep-warm** | GitHub Actions cron (`.github/workflows/keep-alive.yml`) + `scripts/keep_alive.py` |

## How It Works

```
User selects/uploads a document (or a demo sample)
  → Frontend (React) calls the FastAPI backend
    → Backend stores the file + a documents row in SQLite
    → Gemini extracts structured fields (or deterministic demo data is used)
      → On demand, backend generates Risk / Rights / Action Plan / Schemes / Questions
        → Chat answers questions strictly from the stored document text, with citations
          → Output rendered as tabbed panels; exportable as HTML/PDF/text report
```

Each insight endpoint follows one pattern (see `routers/insights.py`): if the document ID belongs to a demo sample, return curated deterministic data; otherwise pull the stored document text and call the matching Gemini function.

## High-Level Architecture

A classic two-tier web app with an isolated LLM layer:

- **React SPA** (`frontend/src`): state machine for the guided journey, tabbed workspace, language selector, report export, and chat. Talks to the backend through a thin `api.js` fetch wrapper.
- **FastAPI service** (`backend/app`): four routers (`documents`, `demo_documents`, `chat`, `insights`) over a small service layer (`gemini`, `retrieval`, `sample_documents`, `schemes_kb`, `storage`) backed by SQLite.
- **Gemini service** (`services/gemini.py`): the only module that knows about the LLM — prompt templates, JSON-mode generation, multi-model fallback with backoff, and safe parsing.

## Repository Structure

```text
janmitra-ai/
├── backend/
│   └── app/
│       ├── main.py            FastAPI app, CORS, lifespan, /health, router wiring
│       ├── config.py          Pydantic settings from .env (keys, models, CORS)
│       ├── database.py        SQLite connection + schema (documents, analysis, chat)
│       ├── models.py          Pydantic request/response schemas
│       ├── routers/           documents, demo_documents, chat, insights
│       └── services/          gemini, retrieval, sample_documents, schemes_kb, storage
├── frontend/
│   └── src/
│       ├── App.jsx            Main state machine, report builder, orchestration
│       ├── api.js             Fetch wrapper for all backend endpoints
│       ├── i18n.js            6-language UI string + label tables
│       ├── speech.js          Web Speech API wrapper
│       └── components/        Upload, Chat, RiskDashboard, RightsPanel, SchemesPanel, etc.
├── scripts/keep_alive.py      Pings backend /health to beat free-tier cold starts
├── render.yaml                Render backend blueprint
├── vision.md                  Product vision / compact PRD
└── README.md
```

## Innovation Highlights

- **Safety-first AI design.** Prompts force answers to come *only* from document content; chat returns a "not found in the document" response rather than hallucinating, and every factual claim is expected to carry a citation. Disclaimers are baked into models (`SchemeReport`, `ActionPlan`).
- **Demo determinism for reliability.** Curated samples short-circuit the LLM with hand-written English *and* Hindi analysis, risks, rights, schemes, and action plans — guaranteeing a flawless live demo even if Gemini is rate-limited.
- **Graceful degradation everywhere.** Multi-model fallback chain (`gemini-2.5-flash → flash-lite → flash-latest`) with exponential backoff, action-plan fallback content, and frontend cold-start/retry messaging engineered for free-tier hosting.
- **Pluggable retrieval seam.** `retrieval.get_document_context` deliberately returns the whole document today but keeps a `query` parameter so a future RAG/embeddings implementation can drop in without changing callers.
- **Profile-aware scheme matching.** Eligibility hints (state, age, occupation, income band, category, residence, gender) are passed to the model to rank a curated catalog of real central-government schemes with official URLs.

## Future Opportunities

- **Durable storage & accounts.** Move from ephemeral SQLite to a managed cloud database with an auth provider for cross-device history, saved reports, and private share links (intentionally deferred today).
- **Real RAG.** Implement chunking + embeddings + vector search behind the existing retrieval seam for long documents.
- **Smarter scheme intelligence.** State-aware, eligibility-aware ranking with required-document checklists and official-source citations beyond the static catalog.
- **Broader, verified multilingual coverage.** Extend deterministic quality beyond English/Hindi to all supported languages with tested sample documents.
- **Safety & compliance hardening.** Prompt-injection safeguards for uploaded documents, rate limits, retention controls, and stronger disclaimers before broad public use.
