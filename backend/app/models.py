"""Pydantic schemas for API requests and responses."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class DocumentSummary(BaseModel):
    id: str
    filename: str
    content_type: str | None = None
    status: str
    created_at: str


class DocumentList(BaseModel):
    documents: list[DocumentSummary]


class DocumentAnalysis(BaseModel):
    document_id: str
    document_type: str = ""
    raw_text: str = ""
    entities: list[str] = []
    dates: list[str] = []
    amounts: list[str] = []
    clauses: list[str] = []
    signatories: list[str] = []


EducationLevel = Literal["basic", "standard", "advanced"]


class Citation(BaseModel):
    source: str
    quote: str = ""


class ChatRequest(BaseModel):
    message: str
    education_level: EducationLevel = "standard"
    language: str | None = None


class ChatMessage(BaseModel):
    role: str
    content: str
    citations: list[Citation] = []
    language: str | None = None
    created_at: str | None = None


class ChatResponse(BaseModel):
    reply: str
    citations: list[Citation] = []
    language: str


class ChatHistory(BaseModel):
    messages: list[ChatMessage]


class RiskItem(BaseModel):
    category: str
    level: str = "Low"
    explanation: str = ""
    source: str = ""


class RiskReport(BaseModel):
    overall_risk: str = "Low"
    items: list[RiskItem] = []


class RightsReport(BaseModel):
    you_must_do: list[str] = []
    other_party_must_do: list[str] = []
    important_deadlines: list[str] = []
    if_you_fail_to_comply: list[str] = []


class SuggestedQuestions(BaseModel):
    questions: list[str] = []


class SchemeSuggestion(BaseModel):
    name: str
    reason: str = ""
    official_url: str = ""


class SchemeReport(BaseModel):
    suggestions: list[SchemeSuggestion] = []
    disclaimer: str = "Eligibility must be verified through official sources."
