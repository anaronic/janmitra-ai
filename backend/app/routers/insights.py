"""Document insight endpoints: risk, rights, suggested questions, scheme discovery."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.database import get_connection
from app.models import (
    ActionPlan,
    RightsReport,
    RiskReport,
    SchemeReport,
    SuggestedQuestions,
)
from app.services import gemini, retrieval, sample_documents, schemes_kb

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
def risk(document_id: str, language: str | None = None) -> RiskReport:
    sample_id = sample_documents.sample_id_from_document_id(document_id)
    if sample_id:
        return RiskReport(**sample_documents.risk_for(sample_id, language))
    context = _context_or_404(document_id)
    return RiskReport(**_clean(gemini.extract_risks(context, language), RiskReport))


@router.get("/rights", response_model=RightsReport)
def rights(document_id: str, language: str | None = None) -> RightsReport:
    sample_id = sample_documents.sample_id_from_document_id(document_id)
    if sample_id:
        return RightsReport(**sample_documents.rights_for(sample_id, language))
    context = _context_or_404(document_id)
    return RightsReport(**_clean(gemini.extract_rights(context, language), RightsReport))


@router.get("/action-plan", response_model=ActionPlan)
def action_plan(document_id: str, language: str | None = None) -> ActionPlan:
    sample_id = sample_documents.sample_id_from_document_id(document_id)
    if sample_id:
        return ActionPlan(**sample_documents.action_plan_for(sample_id, language))
    context = _context_or_404(document_id)
    return ActionPlan(**_clean(gemini.generate_action_plan(context, language), ActionPlan))


@router.get("/suggested-questions", response_model=SuggestedQuestions)
def suggested_questions(document_id: str, language: str | None = None) -> SuggestedQuestions:
    sample_id = sample_documents.sample_id_from_document_id(document_id)
    if sample_id:
        return SuggestedQuestions(**sample_documents.questions_for(sample_id, language))
    context = _context_or_404(document_id)
    return SuggestedQuestions(**_clean(gemini.suggest_questions(context, language), SuggestedQuestions))


@router.get("/schemes", response_model=SchemeReport)
def schemes(
    document_id: str,
    query: str | None = None,
    state: str | None = None,
    age: str | None = None,
    occupation: str | None = None,
    income_band: str | None = None,
    category: str | None = None,
    residence: str | None = None,
    gender: str | None = None,
    language: str | None = None,
) -> SchemeReport:
    sample_id = sample_documents.sample_id_from_document_id(document_id)
    if sample_id:
        return SchemeReport(**sample_documents.schemes_for(sample_id, language))
    context = _context_or_404(document_id)
    eligibility = {
        "state": state,
        "age": age,
        "occupation": occupation,
        "income_band": income_band,
        "category": category,
        "residence": residence,
        "gender": gender,
        "language": language,
    }
    result = gemini.match_schemes(
        context,
        schemes_kb.scheme_catalog_text(),
        query,
        {k: v for k, v in eligibility.items() if v},
    )
    return SchemeReport(**_clean(result, SchemeReport))


def _clean(data: dict, model) -> dict:
    """Keep only keys the model knows about to avoid validation errors."""
    allowed = set(model.model_fields.keys())
    return {k: v for k, v in data.items() if k in allowed}
