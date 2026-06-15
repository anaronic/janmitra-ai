"""JanMitra AI FastAPI application entrypoint."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routers import chat, demo_documents, documents, insights

logger = logging.getLogger("janmitra")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    s = get_settings()
    logger.info("JanMitra starting. Allowed CORS origins: %s", s.cors_origin_list or "(none set!)")
    logger.info("Gemini configured: %s | model: %s", bool(s.gemini_api_key), s.gemini_model)
    if not s.cors_origin_list:
        logger.warning("CORS_ORIGINS is empty — browser requests from your frontend will be blocked.")
    yield


app = FastAPI(
    title="JanMitra AI",
    description="Multilingual financial and legal literacy assistant (educational use only).",
    version="0.1.0",
    lifespan=lifespan,
)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, object]:
    s = get_settings()
    return {
        "status": "ok",
        "service": "janmitra-ai",
        "gemini_configured": bool(s.gemini_api_key),
        "allowed_origins": s.cors_origin_list,
    }


app.include_router(documents.router)
app.include_router(demo_documents.router)
app.include_router(chat.router)
app.include_router(insights.router)
