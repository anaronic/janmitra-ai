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


def _generate(contents: list[Any], *, json_mode: bool = False, retries: int = 4):
    """Call Gemini with simple backoff, mapping API failures to clean 503s."""
    from google.genai import errors, types

    client = _get_client()
    settings = get_settings()
    config = (
        types.GenerateContentConfig(response_mime_type="application/json")
        if json_mode
        else None
    )

    models = _model_chain()
    last_error: Exception | None = None
    for model in models:
        for attempt in range(retries):
            try:
                return client.models.generate_content(
                    model=model, contents=contents, config=config
                )
            except errors.APIError as exc:  # transient (429/503) or quota errors
                last_error = exc
                if exc.code in (429, 503) and attempt < retries - 1:
                    time.sleep(2 * (attempt + 1))
                    continue
                break  # move on to the next fallback model

    raise GeminiUnavailable(
        f"Gemini request failed across models {models}: "
        f"{getattr(last_error, 'message', str(last_error))}"
    )


def _model_chain() -> list[str]:
    """Configured model first, then fallbacks, de-duplicated and order-preserving."""
    settings = get_settings()
    chain = [settings.gemini_model] + [
        m.strip() for m in settings.gemini_fallback_models.split(",") if m.strip()
    ]
    seen: set[str] = set()
    return [m for m in chain if not (m in seen or seen.add(m))]


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


def analyze_document(file_bytes: bytes, mime_type: str, language: str | None = None) -> dict[str, Any]:
    """Run Gemini extraction over a document, returning structured fields."""
    from google.genai import types

    part = types.Part.from_bytes(data=file_bytes, mime_type=mime_type)
    prompt = (
        f"{EXTRACTION_PROMPT}\n\n{_language_instruction(language)} Translate document_type, dates, "
        "amounts, clauses, and signatories into the selected language. Keep raw_text as faithful "
        "extracted text from the document."
    )
    response = _generate([prompt, part], json_mode=True)
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


def _language_instruction(language: str | None) -> str:
    normalized = (language or "").strip().lower()
    if normalized in {"hi", "hindi", "हिन्दी", "हिंदी"}:
        return (
            "Write every user-facing JSON string value in Hindi using Devanagari script. "
            "Do not leave explanations, actions, questions, reasons, deadlines, or document names in English unless they are official names, IDs, URLs, or exact quoted source text."
        )
    if normalized in {"en", "english"}:
        return "Write every user-facing JSON string value in English."
    if normalized:
        return f"Write every user-facing JSON string value in {language}."
    return "Write every user-facing JSON string value in the user's selected language if provided; otherwise use English."

CHAT_SYSTEM_PROMPT = """You are JanMitra AI, a multilingual financial and legal literacy assistant
for Indian citizens. You are educational only and must never give legal or financial advice.

Strict rules:
1. Answer ONLY using the DOCUMENT CONTENT provided below. Never invent information.
2. If the answer is not in the document, reply that the document does not mention it (translated
   into the user's language).
3. If a selected output language is provided below, reply ENTIRELY in that language and script.
   Otherwise detect the user's language from their LATEST message and reply in that same language.
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
    *,
    raw_text: str,
    message: str,
    education_level: str,
    history: list[dict[str, str]],
    preferred_language: str | None = None,
) -> dict[str, Any]:
    """Answer a question about a document, returning reply, language, and citations."""
    guidance = EDUCATION_GUIDANCE.get(education_level, EDUCATION_GUIDANCE["standard"])
    language_rule = _language_instruction(preferred_language)
    system = CHAT_SYSTEM_PROMPT.format(education=f"{guidance} {language_rule}")

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


def extract_risks(raw_text: str, language: str | None = None) -> dict[str, Any]:
    prompt = (
        f"{RISK_PROMPT}\n\n{_language_instruction(language)} Keep overall_risk and item level "
        "values exactly as Low, Medium, or High.\n\n"
        f"=== DOCUMENT CONTENT ===\n{raw_text}"
    )
    response = _generate([prompt], json_mode=True)
    return _extract_json(response.text or "{}")


def extract_rights(raw_text: str, language: str | None = None) -> dict[str, Any]:
    prompt = f"{RIGHTS_PROMPT}\n\n{_language_instruction(language)}\n\n=== DOCUMENT CONTENT ===\n{raw_text}"
    response = _generate([prompt], json_mode=True)
    return _extract_json(response.text or "{}")


def suggest_questions(raw_text: str, language: str | None = None) -> dict[str, Any]:
    prompt = f"{QUESTIONS_PROMPT}\n\n{_language_instruction(language)}\n\n=== DOCUMENT CONTENT ===\n{raw_text}"
    response = _generate([prompt], json_mode=True)
    return _extract_json(response.text or "{}")


ACTION_PLAN_FALLBACK = {
    "immediate_actions": [
        "Read the document end-to-end and highlight fees, dates, signatures, penalties, and cancellation terms.",
        "Confirm the document issuer, reference number, and contact details through an official channel.",
    ],
    "documents_to_collect": [
        "Government ID and address proof, if requested by the document issuer.",
        "Copies of the signed document, payment receipts, notices, and related correspondence.",
    ],
    "deadlines": [
        "Verify all dates mentioned in the document before taking action.",
        "If a deadline is unclear, ask the issuer in writing before it expires.",
    ],
    "questions_to_ask": [
        "What charges, penalties, or obligations apply to me?",
        "Which office, website, or helpline can confirm this document?",
        "What documents are required for the next step?",
    ],
    "verification_steps": [
        "Cross-check official URLs, phone numbers, and scheme or account details independently.",
        "Do not share OTPs, passwords, or original documents unless the channel is verified.",
        "Keep dated copies or screenshots of every submission and acknowledgement.",
    ],
    "disclaimer": "This is educational guidance only. Verify details with the document issuer or an official source.",
}

ACTION_PLAN_FALLBACK_HI = {
    "immediate_actions": [
        "दस्तावेज़ पूरा पढ़ें और शुल्क, तारीखें, हस्ताक्षर, जुर्माने और रद्द करने की शर्तें चिह्नित करें।",
        "दस्तावेज़ जारी करने वाले, संदर्भ संख्या और संपर्क विवरण को आधिकारिक माध्यम से सत्यापित करें।",
    ],
    "documents_to_collect": [
        "यदि जारीकर्ता ने माँगा हो तो सरकारी पहचान पत्र और पते का प्रमाण।",
        "हस्ताक्षरित दस्तावेज़, भुगतान रसीदें, नोटिस और संबंधित पत्राचार की प्रतियाँ।",
    ],
    "deadlines": [
        "कार्रवाई से पहले दस्तावेज़ में दी गई सभी तारीखें सत्यापित करें।",
        "यदि समयसीमा स्पष्ट नहीं है, तो समाप्त होने से पहले जारीकर्ता से लिखित पुष्टि लें।",
    ],
    "questions_to_ask": [
        "मुझ पर कौन से शुल्क, जुर्माने या जिम्मेदारियाँ लागू होती हैं?",
        "कौन सा कार्यालय, वेबसाइट या हेल्पलाइन इस दस्तावेज़ की पुष्टि कर सकती है?",
        "अगले कदम के लिए कौन से दस्तावेज़ चाहिए?",
    ],
    "verification_steps": [
        "आधिकारिक URL, फोन नंबर और योजना या खाते के विवरण अलग से मिलान करें।",
        "OTP, पासवर्ड या मूल दस्तावेज़ तब तक साझा न करें जब तक माध्यम सत्यापित न हो।",
        "हर जमा और स्वीकृति की तारीख सहित प्रतियाँ या स्क्रीनशॉट रखें।",
    ],
    "disclaimer": "यह केवल शैक्षिक मार्गदर्शन है। विवरण दस्तावेज़ जारीकर्ता या आधिकारिक स्रोत से सत्यापित करें।",
}


ACTION_PLAN_PROMPT = """You are JanMitra AI helping an Indian citizen understand next steps for a
financial, legal, or government-service document. Use ONLY the document content. Do not invent
deadlines, required documents, offices, benefits, or eligibility. If the document is silent, use a
conservative verification reminder instead of a specific claim.

Return ONLY valid JSON:
{
  "immediate_actions": ["specific next steps supported by the document, or safe verification steps"],
  "documents_to_collect": ["documents explicitly mentioned, or generic copies/ID/address proof if needed for verification"],
  "deadlines": ["dates/time limits exactly as stated, with context; otherwise ask the issuer to confirm deadlines"],
  "questions_to_ask": ["practical questions the citizen should ask the issuer/official helpline"],
  "verification_steps": ["how to verify authenticity, charges, deadlines, and official contact points"],
  "disclaimer": "This is educational guidance only. Verify details with the document issuer or an official source."
}
Keep each item short and plain-language."""


def generate_action_plan(raw_text: str, language: str | None = None) -> dict[str, Any]:
    if not raw_text.strip() or not is_configured():
        return ACTION_PLAN_FALLBACK_HI if (language or "").lower() in {"hi", "hindi"} else ACTION_PLAN_FALLBACK
    prompt = f"{ACTION_PLAN_PROMPT}\n\n{_language_instruction(language)}\n\n=== DOCUMENT CONTENT ===\n{raw_text}"
    response = _generate([prompt], json_mode=True)
    result = _extract_json(response.text or "{}")
    if not any(result.get(key) for key in ("immediate_actions", "documents_to_collect", "deadlines")):
        return ACTION_PLAN_FALLBACK_HI if (language or "").lower() in {"hi", "hindi"} else ACTION_PLAN_FALLBACK
    return result


def match_schemes(
    raw_text: str,
    catalog: str,
    user_query: str | None = None,
    eligibility: dict[str, str] | None = None,
) -> dict[str, Any]:
    profile_lines = []
    for key, value in (eligibility or {}).items():
        if value:
            profile_lines.append(f"- {key.replace('_', ' ').title()}: {value}")
    profile = "\n".join(profile_lines) or "No additional eligibility details provided."
    language_instruction = _language_instruction((eligibility or {}).get("language"))
    prompt = (
        "You are JanMitra AI. Using the document content and conversation context, suggest which "
        "government schemes from the CATALOG may be relevant. Use the optional citizen eligibility "
        "profile to rank better matches, but do not invent eligibility. Only suggest from the catalog. "
        "For each, explain briefly why it may be relevant. Always include the disclaimer that "
        "eligibility must be verified through official sources. "
        f"{language_instruction}\n\n"
        "Return ONLY valid JSON: {\"suggestions\": [{\"name\": \"...\", \"reason\": \"...\", "
        "\"official_url\": \"...\", \"confidence\": 0.0, \"eligibility_notes\": \"...\", "
        "\"required_documents\": [\"...\"]}], "
        "\"disclaimer\": \"Eligibility must be verified through official sources.\"}\n\n"
        f"=== CATALOG ===\n{catalog}\n\n=== DOCUMENT CONTENT ===\n{raw_text}\n\n"
        f"=== CITIZEN ELIGIBILITY PROFILE ===\n{profile}\n\n"
        f"=== USER QUERY ===\n{user_query or 'What schemes may be relevant to me?'}"
    )
    response = _generate([prompt], json_mode=True)
    return _extract_json(response.text or "{}")
