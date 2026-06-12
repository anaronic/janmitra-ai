"""Document insight endpoints: risk, rights, suggested questions, scheme discovery."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.database import get_connection
from app.models import (
    RightsReport,
    RiskReport,
    SchemeReport,
    SuggestedQuestions,
)
from app.services import gemini, retrieval, schemes_kb

router = APIRouter(prefix="/api/documents/{document_id}", tags=["insights"])


def _context_or_404(document_id: str) -> str:
    conn = get_connection()
    try:
        context = retrieval.get_document_context(conn, document_id)
    finally:
        conn.close()
    if context is None:
        raise HTTPException(
            status_code=404, detail="Document not analyzed yet. Run analyze first."
        )
    return context


@router.get("/risk", response_model=RiskReport)
def risk(document_id: str) -> RiskReport:
    context = _context_or_404(document_id)
    return RiskReport(**_clean(gemini.extract_risks(context), RiskReport))


@router.get("/rights", response_model=RightsReport)
def rights(document_id: str) -> RightsReport:
    context = _context_or_404(document_id)
    return RightsReport(**_clean(gemini.extract_rights(context), RightsReport))


@router.get("/suggested-questions", response_model=SuggestedQuestions)
def suggested_questions(document_id: str) -> SuggestedQuestions:
    context = _context_or_404(document_id)
    return SuggestedQuestions(**_clean(gemini.suggest_questions(context), SuggestedQuestions))


@router.get("/schemes", response_model=SchemeReport)
def schemes(document_id: str, query: str | None = None) -> SchemeReport:
    context = _context_or_404(document_id)
    result = gemini.match_schemes(context, schemes_kb.scheme_catalog_text(), query)
    return SchemeReport(**_clean(result, SchemeReport))


def _clean(data: dict, model) -> dict:
    """Keep only keys the model knows about to avoid validation errors."""
    allowed = set(model.model_fields.keys())
    return {k: v for k, v in data.items() if k in allowed}
