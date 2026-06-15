# JanMitra AI Vision

## Product Vision

JanMitra AI helps Indian citizens turn complex financial, legal, and government documents into understandable, actionable guidance in their preferred language. The product is optimized for public-interest demos, literacy use cases, and first-step navigation before a user consults official sources or experts.

## Target Users

- Citizens who need to understand loans, notices, benefits, leases, forms, or other formal documents.
- Community volunteers, NGOs, and help-desk operators assisting citizens with paperwork.
- Hackathon/demo evaluators who need to see end-to-end value quickly through sample documents.

## Core Problem

Important documents often contain legal, financial, or bureaucratic language that is hard to interpret. Citizens need a safe assistant that explains what a document says, what risks or rights may exist, and what practical next steps to take without pretending to be a lawyer, financial advisor, or official eligibility authority.

## V2 / Hackathon Polish Scope

### 1. Guided Journey

The homepage should guide users through trying a demo, uploading a document, reviewing insights, and asking follow-up questions. Navigation should reflect the current state so users understand what is available next.

### 2. Demo Document Mode

Users can explore curated sample documents without uploading private files. The frontend uses:

- `GET /api/demo-documents` to list samples.
- `POST /api/demo-documents/{sample_id}` to import/analyze a selected sample.

### 3. Document Snapshot

Each analyzed document should expose a concise snapshot: document type, parties, dates, monetary amounts, obligations, key facts, and extracted metadata when available. The snapshot is a fast orientation layer before deeper analysis.

### 4. Risk, Rights, and Schemes

The product should present:

- risks ranked by severity with evidence from the document;
- rights and responsibilities in citizen-friendly language;
- relevant government schemes with source/ranking fields where available;
- scheme personalization through `state`, `age`, `occupation`, `income_band`, `category`, `residence`, `gender`, and `language` query params on `/api/documents/{document_id}/schemes`.

### 5. Citizen Action Plan

`GET /api/documents/{document_id}/action-plan` should return practical next steps, such as what to verify, what documents to gather, which offices or sources to check, and what questions to ask an expert.

### 6. Language and Accessibility

The experience should support English and Hindi selection, simple reading levels, clear loading/retry states, and Hindi text-to-speech where supported by the browser. Once a user selects a language, generated sections should stay in that language instead of mixing languages.

## Non-Goals and Guardrails

- Do not provide binding legal or financial advice.
- Do not guarantee scheme eligibility; always point users to official verification.
- Do not require user accounts for the current implementation.
- Do not store secrets or private credentials in the repository.

## Success Criteria

- A first-time user can complete the demo flow without a real document.
- Uploaded or demo documents show a snapshot, risks, rights/responsibilities, schemes, suggested questions, chat, and action plan.
- Scheme results can be refined using citizen profile query parameters.
- The UI remains understandable during backend cold starts, retries, and loading states.

## Expansion Roadmap

The next expansion should proceed one capability at a time, prioritizing stable deployment and safe user experience over feature volume.

### 1. Persistence and Sharing

Users should be able to return to recent document sessions in the same browser, delete stored document data when they are done, and export a plain-language report/checklist they can save or share offline. This first phase must remain safe without user accounts: no public sharing links, no secrets, and clear reminders that data durability depends on the deployment storage.

Account login belongs in the next persistence phase, once JanMitra has a managed auth provider and durable database. Auth should unlock cross-device history, saved reports, and private share links, but should not block the hackathon demo or be simulated with insecure local-only credentials.

### 2. Real Multilingual Expansion

After the English/Hindi foundation is stable, JanMitra should expand to more Indian languages while ensuring the selected language applies to generated content, labels, demo documents, chat, and exports. Language additions should be incremental and tested with representative sample documents.

### 3. Better Scheme Intelligence

Scheme matching should grow beyond the initial curated catalog into state-aware and eligibility-aware recommendations. Future work should rank schemes by likely relevance, ask only necessary profile questions, show required documents, and cite official sources.

### 4. Safety, Privacy, and Compliance

Before broader public use, JanMitra should harden privacy and safety: explicit delete controls, retention messaging, prompt-injection safeguards for uploaded documents, rate limits, stronger disclaimers, and clear boundaries around legal/financial advice.
