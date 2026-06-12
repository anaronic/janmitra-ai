"""Gemini client wrapper for document understanding and generation.

The LLM layer is isolated here so the rest of the app depends on plain functions,
making it straightforward to swap providers (or add a local model) later.
"""
from __future__ import annotations

import json
from functools import lru_cache
from typing import Any

from fastapi import HTTPException

from app.config import get_settings


class GeminiUnavailable(HTTPException):
    def __init__(self) -> None:
        super().__init__(
            status_code=503,
            detail="Gemini API is not configured. Set GEMINI_API_KEY in the backend .env.",
        )


@lru_cache
def _get_client():
    settings = get_settings()
    if not settings.gemini_api_key:
        raise GeminiUnavailable()
    from google import genai  # imported lazily so the app boots without a key

    return genai.Client(api_key=settings.gemini_api_key)


def is_configured() -> bool:
    return bool(get_settings().gemini_api_key)


def _extract_json(text: str) -> dict[str, Any]:
    """Best-effort parse of a JSON object from a model response."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```", 2)[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(text[start : end + 1])
        raise


EXTRACTION_PROMPT = """You are a document understanding engine for JanMitra AI, an educational
tool for Indian citizens. Analyze the attached document and return ONLY valid JSON with this shape:

{
  "raw_text": "full extracted text of the document",
  "document_type": "short label, e.g. Loan Agreement, Rental Contract, Insurance Policy",
  "entities": ["named people, organizations, banks, etc."],
  "dates": ["important dates with context, e.g. 'EMI due: 5th of each month'"],
  "amounts": ["monetary amounts with context, e.g. 'Principal: Rs 2,00,000'"],
  "clauses": ["key clauses summarized in one line each"],
  "signatories": ["parties expected to sign"]
}

Extract faithfully from the document. Do not invent information. If a field has no data, use an
empty list (or empty string for raw_text/document_type)."""


def analyze_document(file_bytes: bytes, mime_type: str) -> dict[str, Any]:
    """Run Gemini extraction over a document, returning structured fields."""
    client = _get_client()
    settings = get_settings()
    from google.genai import types

    part = types.Part.from_bytes(data=file_bytes, mime_type=mime_type)
    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=[EXTRACTION_PROMPT, part],
        config=types.GenerateContentConfig(response_mime_type="application/json"),
    )
    return _extract_json(response.text or "{}")
