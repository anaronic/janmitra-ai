"""Demo document catalog and loader for judge-friendly sample flows."""
from __future__ import annotations

import json
import sqlite3
import uuid
from dataclasses import dataclass

from fastapi import HTTPException

from app.models import DocumentAnalysis, DocumentSummary
from app.services import storage


@dataclass(frozen=True)
class SampleDocument:
    id: str
    title: str
    description: str
    document_type: str
    language: str
    filename: str
    raw_text: str
    entities: list[str]
    dates: list[str]
    amounts: list[str]
    clauses: list[str]
    signatories: list[str]


SAMPLES: tuple[SampleDocument, ...] = (
    SampleDocument(
        id="farmer-kcc-notice",
        title="Kisan Credit Card renewal notice",
        description="Sample bank notice with renewal date, repayment reminder, and crop insurance references.",
        document_type="Kisan Credit Card Notice",
        language="English",
        filename="demo-farmer-kcc-notice.txt",
        raw_text=(
            "Kisan Credit Card Renewal Notice\n"
            "Borrower: Sita Devi, Village Rampur, District Nashik, Maharashtra.\n"
            "Bank: Gramin Pragati Bank, Rampur Branch.\n"
            "KCC account limit: Rs 1,20,000 for crop cultivation and allied activities.\n"
            "Outstanding amount as on 15 June 2026: Rs 48,500.\n"
            "Renewal documents requested: Aadhaar copy, land record or cultivation certificate, "
            "two passport photos, and latest crop details.\n"
            "Please visit the branch before 30 June 2026 to renew the KCC limit. Late renewal may "
            "delay subsidised interest benefits. Crop insurance under PM Fasal Bima Yojana may be "
            "available for notified crops and areas; eligibility must be checked on the official portal.\n"
            "Do not share OTP or PIN with anyone claiming to renew the account by phone."
        ),
        entities=["Sita Devi", "Gramin Pragati Bank", "PM Fasal Bima Yojana"],
        dates=["Outstanding as on 15 June 2026", "Renewal visit before 30 June 2026"],
        amounts=["KCC account limit: Rs 1,20,000", "Outstanding amount: Rs 48,500"],
        clauses=[
            "Borrower must submit Aadhaar, cultivation proof, photos, and crop details for renewal.",
            "Late renewal may delay subsidised interest benefits.",
            "PMFBY eligibility must be checked for notified crops and areas.",
            "Borrower should not share OTP or PIN over phone.",
        ],
        signatories=["Borrower", "Branch Manager"],
    ),
    SampleDocument(
        id="tenant-rent-agreement",
        title="Simple rental agreement",
        description="Sample rental terms covering rent, deposit, notice period, and maintenance responsibilities.",
        document_type="Rental Agreement",
        language="English",
        filename="demo-rental-agreement.txt",
        raw_text=(
            "Residential Rental Agreement\n"
            "Owner: Rajesh Kumar. Tenant: Amina Khan. Property: Flat 204, Green Homes, Bengaluru, Karnataka.\n"
            "Monthly rent is Rs 12,000, payable by the 5th day of each month. Security deposit is Rs 36,000.\n"
            "Agreement period: 1 July 2026 to 30 June 2027. Either party must give 30 days written notice "
            "before ending the agreement. The owner must provide receipts for rent payments and return the "
            "security deposit after deducting only documented damage or unpaid dues. The tenant must pay "
            "electricity and water bills on time and keep payment receipts. Major structural repairs are the "
            "owner's responsibility; minor daily-use maintenance is the tenant's responsibility."
        ),
        entities=["Rajesh Kumar", "Amina Khan", "Green Homes"],
        dates=["Agreement period: 1 July 2026 to 30 June 2027", "Rent due by the 5th day of each month"],
        amounts=["Monthly rent: Rs 12,000", "Security deposit: Rs 36,000"],
        clauses=[
            "Either party must give 30 days written notice before ending the agreement.",
            "Owner must provide rent receipts and return deposit after documented deductions.",
            "Tenant must pay utility bills and keep receipts.",
            "Owner handles major structural repairs; tenant handles minor daily-use maintenance.",
        ],
        signatories=["Owner", "Tenant"],
    ),
)


def list_samples() -> list[dict[str, str]]:
    return [
        {
            "id": sample.id,
            "title": sample.title,
            "description": sample.description,
            "document_type": sample.document_type,
            "language": sample.language,
        }
        for sample in SAMPLES
    ]


def get_sample(sample_id: str) -> SampleDocument:
    for sample in SAMPLES:
        if sample.id == sample_id:
            return sample
    raise HTTPException(status_code=404, detail="Demo document not found.")


def analysis_for(sample: SampleDocument, document_id: str) -> DocumentAnalysis:
    return DocumentAnalysis(
        document_id=document_id,
        document_type=sample.document_type,
        raw_text=sample.raw_text,
        entities=sample.entities,
        dates=sample.dates,
        amounts=sample.amounts,
        clauses=sample.clauses,
        signatories=sample.signatories,
    )


def load_sample(conn: sqlite3.Connection, sample_id: str) -> tuple[DocumentSummary, DocumentAnalysis]:
    sample = get_sample(sample_id)
    document_id = f"demo-{sample.id}-{uuid.uuid4().hex}"
    sample_dir = storage.get_upload_dir() / "samples"
    sample_dir.mkdir(parents=True, exist_ok=True)
    stored_path = sample_dir / f"{document_id}-{sample.filename}"
    stored_path.write_text(sample.raw_text, encoding="utf-8")

    analysis = analysis_for(sample, document_id)
    conn.execute(
        "INSERT INTO documents (id, filename, content_type, stored_path, status) "
        "VALUES (?, ?, ?, ?, 'analyzed') "
        "ON CONFLICT(id) DO UPDATE SET filename=excluded.filename, content_type=excluded.content_type, "
        "stored_path=excluded.stored_path, status='analyzed'",
        (document_id, sample.filename, "text/plain", str(stored_path)),
    )
    conn.execute(
        "INSERT INTO document_analysis (document_id, raw_text, extraction_json) "
        "VALUES (?, ?, ?) "
        "ON CONFLICT(document_id) DO UPDATE SET raw_text=excluded.raw_text, "
        "extraction_json=excluded.extraction_json, created_at=datetime('now')",
        (document_id, analysis.raw_text, analysis.model_dump_json()),
    )
    conn.commit()
    row = conn.execute(
        "SELECT id, filename, content_type, status, created_at FROM documents WHERE id = ?",
        (document_id,),
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=500, detail="Failed to load demo document.")
    return DocumentSummary(**dict(row)), DocumentAnalysis.model_validate_json(
        json.dumps(analysis.model_dump())
    )
