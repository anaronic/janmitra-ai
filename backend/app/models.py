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
