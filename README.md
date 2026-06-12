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
