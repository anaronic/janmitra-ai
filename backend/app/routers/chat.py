"""Chat endpoints: question answering over a document with citations."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.database import get_connection
from app.models import ChatHistory, ChatMessage, ChatRequest, ChatResponse, Citation
from app.services import gemini, retrieval

router = APIRouter(prefix="/api/documents/{document_id}/chat", tags=["chat"])


def _load_history(conn, document_id: str) -> list[dict[str, str]]:
    rows = conn.execute(
        "SELECT role, content FROM chat_messages WHERE document_id = ? ORDER BY id",
        (document_id,),
    ).fetchall()
    return [{"role": r["role"], "content": r["content"]} for r in rows]


@router.post("", response_model=ChatResponse)
def chat(document_id: str, payload: ChatRequest) -> ChatResponse:
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    conn = get_connection()
    try:
        context = retrieval.get_document_context(conn, document_id)
        if context is None:
            raise HTTPException(
                status_code=404,
                detail="Document not analyzed yet. Run analyze before chatting.",
            )

        history = _load_history(conn, document_id)
        result = gemini.chat_about_document(
            raw_text=context,
            message=payload.message,
            education_level=payload.education_level,
            history=history,
        )

        reply = result.get("reply", "") or ""
        language = result.get("language", "") or payload.language or "English"
        citations = [Citation(**c) for c in result.get("citations", []) if isinstance(c, dict)]

        conn.execute(
            "INSERT INTO chat_messages (document_id, role, content, language) VALUES (?, ?, ?, ?)",
            (document_id, "user", payload.message, payload.language),
        )
        conn.execute(
            "INSERT INTO chat_messages (document_id, role, content, citations_json, language) "
            "VALUES (?, ?, ?, ?, ?)",
            (
                document_id,
                "assistant",
                reply,
                _dump_citations(citations),
                language,
            ),
        )
        conn.commit()
    finally:
        conn.close()

    return ChatResponse(reply=reply, citations=citations, language=language)


@router.get("", response_model=ChatHistory)
def get_history(document_id: str) -> ChatHistory:
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT role, content, citations_json, language, created_at "
            "FROM chat_messages WHERE document_id = ? ORDER BY id",
            (document_id,),
        ).fetchall()
    finally:
        conn.close()

    messages = [
        ChatMessage(
            role=r["role"],
            content=r["content"],
            citations=_load_citations(r["citations_json"]),
            language=r["language"],
            created_at=r["created_at"],
        )
        for r in rows
    ]
    return ChatHistory(messages=messages)


def _dump_citations(citations: list[Citation]) -> str:
    import json

    return json.dumps([c.model_dump() for c in citations])


def _load_citations(raw: str | None) -> list[Citation]:
    import json

    if not raw:
        return []
    try:
        return [Citation(**c) for c in json.loads(raw)]
    except (ValueError, TypeError):
        return []
