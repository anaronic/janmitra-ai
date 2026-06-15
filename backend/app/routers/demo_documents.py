"""Demo document endpoints for no-upload judge flows."""
from __future__ import annotations

from fastapi import APIRouter

from app.database import get_connection
from app.models import DemoDocumentList, DemoDocumentLoadResponse
from app.services import sample_documents

router = APIRouter(prefix="/api/demo-documents", tags=["demo-documents"])


@router.get("", response_model=DemoDocumentList)
def list_demo_documents() -> DemoDocumentList:
    return DemoDocumentList(samples=sample_documents.list_samples())


@router.post("/{sample_id}", response_model=DemoDocumentLoadResponse)
def load_demo_document(sample_id: str, language: str | None = None) -> DemoDocumentLoadResponse:
    conn = get_connection()
    try:
        document, analysis = sample_documents.load_sample(conn, sample_id, language)
    finally:
        conn.close()
    return DemoDocumentLoadResponse(document=document, analysis=analysis)
