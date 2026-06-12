"""Pydantic schemas for API requests and responses."""
from __future__ import annotations

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
