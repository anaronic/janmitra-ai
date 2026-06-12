"""Retrieval abstraction.

For V1, retrieval returns the whole document text as context. The interface is kept
deliberately small so a chunking + embeddings + vector-search implementation can be
substituted later without changing callers.
"""
from __future__ import annotations

import sqlite3


def get_document_context(conn: sqlite3.Connection, document_id: str, query: str | None = None) -> str | None:
    """Return the text context for a document, or None if it has not been analyzed.

    The ``query`` argument is currently unused (whole-document strategy) but is part of
    the interface so a future RAG implementation can rank chunks against the query.
    """
    row = conn.execute(
        "SELECT raw_text FROM document_analysis WHERE document_id = ?",
        (document_id,),
    ).fetchone()
    if row is None or not row["raw_text"]:
        return None
    return row["raw_text"]
