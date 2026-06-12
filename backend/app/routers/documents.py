"""Document upload and retrieval endpoints."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.database import get_connection
from app.models import DocumentList, DocumentSummary
from app.services import storage

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
