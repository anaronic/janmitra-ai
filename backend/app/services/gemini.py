"""Gemini client wrapper for document understanding and generation.

The LLM layer is isolated here so the rest of the app depends on plain functions,
making it straightforward to swap providers (or add a local model) later.
"""
from __future__ import annotations

import json
import time
from functools import lru_cache
from typing import Any

from fastapi import HTTPException

from app.config import get_settings


class GeminiUnavailable(HTTPException):
    def __init__(self, detail: str | None = None) -> None:
        super().__init__(
            status_code=503,
            detail=detail
            or "Gemini API is not configured. Set GEMINI_API_KEY in the backend .env.",
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


def _generate(contents: list[Any], *, json_mode: bool = False, retries: int = 3):
    """Call Gemini with simple backoff, mapping API failures to clean 503s."""
    from google.genai import errors, types

    client = _get_client()
    settings = get_settings()
    config = (
        types.GenerateContentConfig(response_mime_type="application/json")
        if json_mode
        else None
    )

    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            return client.models.generate_content(
                model=settings.gemini_model, contents=contents, config=config
            )
        except errors.APIError as exc:  # transient (429/503) or quota errors
            last_error = exc
            if exc.code in (429, 503) and attempt < retries - 1:
                time.sleep(2 * (attempt + 1))
                continue
            break

    raise GeminiUnavailable(
        f"Gemini request failed: {getattr(last_error, 'message', str(last_error))}"
    )


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
    from google.genai import types

    part = types.Part.from_bytes(data=file_bytes, mime_type=mime_type)
    response = _generate([EXTRACTION_PROMPT, part], json_mode=True)
    return _extract_json(response.text or "{}")


EDUCATION_GUIDANCE = {
    "basic": (
        "Audience: primary-school education, first-time banking users. Use very short sentences "
        "and everyday examples. Avoid all legal/financial jargon. Example: instead of 'The borrower "
        "shall indemnify the lender', say 'If the bank loses money because of this agreement, you "
        "may have to pay them back.'"
    ),
    "standard": "Audience: an average adult. Use moderate terminology with brief explanations.",
    "advanced": (
        "Audience: lawyers, finance professionals, students. Preserve original terminology and "
        "explain clauses precisely."
    ),
}

CHAT_SYSTEM_PROMPT = """You are JanMitra AI, a multilingual financial and legal literacy assistant
for Indian citizens. You are educational only and must never give legal or financial advice.

Strict rules:
1. Answer ONLY using the DOCUMENT CONTENT provided below. Never invent information.
2. If the answer is not in the document, reply that the document does not mention it (translated
   into the user's language).
3. Detect the user's language from their message and reply ENTIRELY in that same language.
4. {education}
5. Every factual statement must be backed by citations referencing the document (page/section/heading).

Return ONLY valid JSON with this shape:
{{
  "reply": "your answer in the user's language",
  "language": "the language you replied in (English name, e.g. 'Hindi')",
  "citations": [{{"source": "e.g. 'Page 2, Section 4' or 'Loan Terms'", "quote": "short supporting text"}}]
}}
If the document does not contain the answer, return an empty citations list."""


def chat_about_document(
    *, raw_text: str, message: str, education_level: str, history: list[dict[str, str]]
) -> dict[str, Any]:
    """Answer a question about a document, returning reply, language, and citations."""
    guidance = EDUCATION_GUIDANCE.get(education_level, EDUCATION_GUIDANCE["standard"])
    system = CHAT_SYSTEM_PROMPT.format(education=guidance)

    convo = "\n".join(f"{m['role']}: {m['content']}" for m in history[-6:])
    prompt = (
        f"{system}\n\n=== DOCUMENT CONTENT ===\n{raw_text}\n=== END DOCUMENT ===\n\n"
        f"=== CONVERSATION SO FAR ===\n{convo}\n\n=== USER MESSAGE ===\n{message}"
    )
    response = _generate([prompt], json_mode=True)
    return _extract_json(response.text or "{}")


RISK_PROMPT = """You are JanMitra AI analyzing a financial/legal document for an Indian citizen.
Identify risk-relevant terms: interest rates, late payment penalties, hidden fees, guarantor
obligations, property/collateral, arbitration clauses, auto-renewal clauses, and termination
conditions. Use ONLY the document content; never invent terms.

Return ONLY valid JSON:
{
  "overall_risk": "Low|Medium|High",
  "items": [
    {"category": "e.g. Late Payment Penalty", "level": "Low|Medium|High",
     "explanation": "plain-language explanation", "source": "page/section if available"}
  ]
}
If no risks are found, return an empty items list and overall_risk 'Low'."""

RIGHTS_PROMPT = """You are JanMitra AI. From the document content only, generate the user's rights
and responsibilities in simple language. Never invent obligations.

Return ONLY valid JSON:
{
  "you_must_do": ["..."],
  "other_party_must_do": ["..."],
  "important_deadlines": ["..."],
  "if_you_fail_to_comply": ["..."]
}
Use empty lists where the document is silent."""

QUESTIONS_PROMPT = """You are JanMitra AI. Based on the document type and content, generate 5-6
short, useful starter questions a citizen might ask about THIS document. Adapt to the document type.

Return ONLY valid JSON: {"questions": ["...", "..."]}"""


def extract_risks(raw_text: str) -> dict[str, Any]:
    prompt = f"{RISK_PROMPT}\n\n=== DOCUMENT CONTENT ===\n{raw_text}"
    response = _generate([prompt], json_mode=True)
    return _extract_json(response.text or "{}")


def extract_rights(raw_text: str) -> dict[str, Any]:
    prompt = f"{RIGHTS_PROMPT}\n\n=== DOCUMENT CONTENT ===\n{raw_text}"
    response = _generate([prompt], json_mode=True)
    return _extract_json(response.text or "{}")


def suggest_questions(raw_text: str) -> dict[str, Any]:
    prompt = f"{QUESTIONS_PROMPT}\n\n=== DOCUMENT CONTENT ===\n{raw_text}"
    response = _generate([prompt], json_mode=True)
    return _extract_json(response.text or "{}")


def match_schemes(raw_text: str, catalog: str, user_query: str | None = None) -> dict[str, Any]:
    prompt = (
        "You are JanMitra AI. Using the document content and conversation context, suggest which "
        "government schemes from the CATALOG may be relevant. Only suggest from the catalog. For "
        "each, explain briefly why it may be relevant. Always include the disclaimer that "
        "eligibility must be verified through official sources.\n\n"
        "Return ONLY valid JSON: {\"suggestions\": [{\"name\": \"...\", \"reason\": \"...\", "
        "\"official_url\": \"...\"}], \"disclaimer\": \"Eligibility must be verified through official sources.\"}\n\n"
        f"=== CATALOG ===\n{catalog}\n\n=== DOCUMENT CONTENT ===\n{raw_text}\n\n"
        f"=== USER QUERY ===\n{user_query or 'What schemes may be relevant to me?'}"
    )
    response = _generate([prompt], json_mode=True)
    return _extract_json(response.text or "{}")
