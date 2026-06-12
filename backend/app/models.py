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
