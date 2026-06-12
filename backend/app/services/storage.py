"""File storage helpers for uploaded documents."""
from __future__ import annotations

import shutil
from pathlib import Path

from fastapi import UploadFile

from app.config import get_settings

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/tiff",
}

MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB


def get_upload_dir() -> Path:
    settings = get_settings()
    path = Path(settings.upload_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


def is_allowed(content_type: str | None) -> bool:
    return content_type in ALLOWED_CONTENT_TYPES


def save_upload(document_id: str, upload: UploadFile) -> Path:
    """Persist an uploaded file to disk under a document-id-prefixed name."""
    upload_dir = get_upload_dir()
    suffix = Path(upload.filename or "").suffix
    target = upload_dir / f"{document_id}{suffix}"
    with target.open("wb") as buffer:
        shutil.copyfileobj(upload.file, buffer)
    return target
