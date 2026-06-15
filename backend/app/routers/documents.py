"""Document upload and retrieval endpoints."""
from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.database import get_connection
from app.models import DocumentAnalysis, DocumentList, DocumentSummary
from app.services import gemini, sample_documents, storage

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("", response_model=DocumentSummary, status_code=201)
async def upload_document(file: UploadFile = File(...)) -> DocumentSummary:
    if not storage.is_allowed(file.content_type):
        raise HTTPException(
            status_code=415,
            detail=(
                "Unsupported file type. Allowed: PDF, PNG, JPEG, WebP, TIFF."
            ),
        )

    contents = await file.read()
    if len(contents) > storage.MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 20 MB limit.")
    await file.seek(0)

    document_id = uuid.uuid4().hex
    stored_path = storage.save_upload(document_id, file)

    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO documents (id, filename, content_type, stored_path, status) "
            "VALUES (?, ?, ?, ?, ?)",
            (document_id, file.filename, file.content_type, str(stored_path), "uploaded"),
        )
        conn.commit()
        row = conn.execute(
            "SELECT id, filename, content_type, status, created_at FROM documents WHERE id = ?",
            (document_id,),
        ).fetchone()
    finally:
        conn.close()

    return DocumentSummary(**dict(row))


@router.get("", response_model=DocumentList)
def list_documents() -> DocumentList:
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT id, filename, content_type, status, created_at "
            "FROM documents ORDER BY created_at DESC"
        ).fetchall()
    finally:
        conn.close()
    return DocumentList(documents=[DocumentSummary(**dict(r)) for r in rows])


@router.get("/{document_id}", response_model=DocumentSummary)
def get_document(document_id: str) -> DocumentSummary:
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT id, filename, content_type, status, created_at FROM documents WHERE id = ?",
            (document_id,),
        ).fetchone()
    finally:
        conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Document not found.")
    return DocumentSummary(**dict(row))


def _build_analysis(document_id: str, extraction: dict) -> DocumentAnalysis:
    return DocumentAnalysis(
        document_id=document_id,
        document_type=extraction.get("document_type", "") or "",
        raw_text=extraction.get("raw_text", "") or "",
        entities=extraction.get("entities", []) or [],
        dates=extraction.get("dates", []) or [],
        amounts=extraction.get("amounts", []) or [],
        clauses=extraction.get("clauses", []) or [],
        signatories=extraction.get("signatories", []) or [],
    )


@router.post("/{document_id}/analyze", response_model=DocumentAnalysis)
def analyze_document(document_id: str, language: str | None = None) -> DocumentAnalysis:
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT id, content_type, stored_path FROM documents WHERE id = ?",
            (document_id,),
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Document not found.")

        sample_id = sample_documents.sample_id_from_document_id(document_id)
        if sample_id:
            analysis = sample_documents.analysis_for(
                sample_documents.get_sample(sample_id), document_id, language
            )
        else:
            file_bytes = Path(row["stored_path"]).read_bytes()
            extraction = gemini.analyze_document(file_bytes, row["content_type"] or "application/pdf", language)
            analysis = _build_analysis(document_id, extraction)

        conn.execute(
            "INSERT INTO document_analysis (document_id, raw_text, extraction_json) "
            "VALUES (?, ?, ?) "
            "ON CONFLICT(document_id) DO UPDATE SET raw_text=excluded.raw_text, "
            "extraction_json=excluded.extraction_json, created_at=datetime('now')",
            (document_id, analysis.raw_text, analysis.model_dump_json()),
        )
        conn.execute(
            "UPDATE documents SET status = 'analyzed' WHERE id = ?", (document_id,)
        )
        conn.commit()
    finally:
        conn.close()
    return analysis


@router.get("/{document_id}/analysis", response_model=DocumentAnalysis)
def get_analysis(document_id: str) -> DocumentAnalysis:
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT extraction_json FROM document_analysis WHERE document_id = ?",
            (document_id,),
        ).fetchone()
    finally:
        conn.close()
    if row is None:
        raise HTTPException(
            status_code=404, detail="No analysis found. Run analyze first."
        )
    return DocumentAnalysis.model_validate_json(row["extraction_json"])
