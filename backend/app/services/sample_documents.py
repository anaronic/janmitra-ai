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


def sample_id_from_document_id(document_id: str) -> str | None:
    for sample in SAMPLES:
        if document_id.startswith(f"demo-{sample.id}-") or document_id == f"demo-{sample.id}":
            return sample.id
    return None


def _hi(language: str | None) -> bool:
    return (language or "").lower() in {"hi", "hindi", "हिन्दी", "हिंदी"}


def analysis_for(sample: SampleDocument, document_id: str, language: str | None = None) -> DocumentAnalysis:
    if _hi(language):
        if sample.id == "farmer-kcc-notice":
            return DocumentAnalysis(
                document_id=document_id,
                document_type="किसान क्रेडिट कार्ड नोटिस",
                raw_text=sample.raw_text,
                entities=["सीता देवी", "ग्रामीण प्रगति बैंक", "प्रधानमंत्री फसल बीमा योजना"],
                dates=["15 जून 2026 तक बकाया", "30 जून 2026 से पहले शाखा जाएँ"],
                amounts=["KCC सीमा: Rs 1,20,000", "बकाया राशि: Rs 48,500"],
                clauses=[
                    "नवीनीकरण के लिए Aadhaar, खेती का प्रमाण, फोटो और फसल विवरण जमा करने हैं।",
                    "देरी से नवीनीकरण पर सब्सिडी वाले ब्याज लाभ में देरी हो सकती है।",
                    "PMFBY पात्रता अधिसूचित फसल और क्षेत्र के अनुसार जाँचनी होगी।",
                    "फोन पर OTP या PIN साझा नहीं करना चाहिए।",
                ],
                signatories=["उधारकर्ता", "शाखा प्रबंधक"],
            )
        if sample.id == "tenant-rent-agreement":
            return DocumentAnalysis(
                document_id=document_id,
                document_type="किराया समझौता",
                raw_text=sample.raw_text,
                entities=["राजेश कुमार", "अमीना खान", "ग्रीन होम्स"],
                dates=["समझौता अवधि: 1 जुलाई 2026 से 30 जून 2027", "किराया हर महीने की 5 तारीख तक देय"],
                amounts=["मासिक किराया: Rs 12,000", "सुरक्षा जमा: Rs 36,000"],
                clauses=[
                    "समझौता समाप्त करने से पहले दोनों पक्षों को 30 दिन का लिखित नोटिस देना होगा।",
                    "मालिक को किराया रसीद देनी और दस्तावेज़ी कटौती के बाद जमा लौटानी होगी।",
                    "किरायेदार को उपयोगिता बिल समय पर भरने और रसीदें रखने की जिम्मेदारी है।",
                    "बड़ी संरचनात्मक मरम्मत मालिक की और छोटी दैनिक मरम्मत किरायेदार की जिम्मेदारी है।",
                ],
                signatories=["मालिक", "किरायेदार"],
            )
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


def risk_for(sample_id: str, language: str | None = None) -> dict:
    hi = _hi(language)
    if sample_id == "farmer-kcc-notice":
        return {
            "overall_risk": "Medium",
            "items": [
                {
                    "category": "नवीनीकरण समयसीमा" if hi else "Renewal Deadline",
                    "level": "Medium",
                    "explanation": "30 जून 2026 से पहले KCC नवीनीकरण न करने पर सब्सिडी वाले ब्याज लाभ में देरी हो सकती है।"
                    if hi
                    else "Missing renewal before 30 June 2026 may delay subsidised interest benefits.",
                    "source": "Renewal notice",
                    "evidence": "Please visit the branch before 30 June 2026 to renew the KCC limit.",
                },
                {
                    "category": "धोखाधड़ी सावधानी" if hi else "Fraud Safety",
                    "level": "Medium",
                    "explanation": "नोटिस कहता है कि खाते के नवीनीकरण के नाम पर OTP या PIN साझा न करें।"
                    if hi
                    else "The notice warns not to share OTP or PIN with anyone claiming to renew the account.",
                    "source": "Safety instruction",
                    "evidence": "Do not share OTP or PIN with anyone claiming to renew the account by phone.",
                },
            ],
        }
    return {
        "overall_risk": "Low",
        "items": [
            {
                "category": "सुरक्षा जमा" if hi else "Security Deposit",
                "level": "Low",
                "explanation": "Rs 36,000 सुरक्षा जमा है; मालिक केवल दस्तावेज़ी नुकसान या बकाया काटकर जमा लौटाएगा।"
                if hi
                else "The Rs 36,000 deposit may be deducted only for documented damage or unpaid dues.",
                "source": "Deposit clause",
                "evidence": "return the security deposit after deducting only documented damage or unpaid dues",
            }
        ],
    }


def rights_for(sample_id: str, language: str | None = None) -> dict:
    hi = _hi(language)
    if sample_id == "farmer-kcc-notice":
        return {
            "you_must_do": [
                "30 जून 2026 से पहले शाखा जाकर KCC सीमा नवीनीकृत कराएँ।",
                "Aadhaar प्रति, खेती का प्रमाण, दो फोटो और नवीनतम फसल विवरण जमा करें।",
                "फोन पर OTP या PIN साझा न करें।",
            ]
            if hi
            else [
                "Visit the branch before 30 June 2026 to renew the KCC limit.",
                "Submit Aadhaar copy, cultivation proof, two photos, and latest crop details.",
                "Do not share OTP or PIN by phone.",
            ],
            "other_party_must_do": ["बैंक को नवीनीकरण प्रक्रिया और आवश्यक दस्तावेज़ स्पष्ट करने चाहिए।"]
            if hi
            else ["The bank should explain the renewal process and required documents."],
            "important_deadlines": ["30 जून 2026 से पहले शाखा जाएँ।"] if hi else ["Visit the branch before 30 June 2026."],
            "if_you_fail_to_comply": ["देरी से नवीनीकरण पर सब्सिडी वाले ब्याज लाभ में देरी हो सकती है।"]
            if hi
            else ["Late renewal may delay subsidised interest benefits."],
        }
    return {
        "you_must_do": ["हर महीने की 5 तारीख तक Rs 12,000 किराया दें।", "30 दिन का लिखित नोटिस दें।"]
        if hi
        else ["Pay monthly rent of Rs 12,000 by the 5th day.", "Give 30 days written notice."],
        "other_party_must_do": ["मालिक को किराया रसीद देनी और जमा लौटानी होगी।"]
        if hi
        else ["The owner must provide receipts and return the deposit after documented deductions."],
        "important_deadlines": ["किराया हर महीने की 5 तारीख तक देय है।"] if hi else ["Rent is due by the 5th day of each month."],
        "if_you_fail_to_comply": ["अवैतनिक बिल या नुकसान सुरक्षा जमा से काटे जा सकते हैं।"]
        if hi
        else ["Unpaid dues or documented damage may be deducted from the security deposit."],
    }


def action_plan_for(sample_id: str, language: str | None = None) -> dict:
    hi = _hi(language)
    if sample_id == "farmer-kcc-notice":
        return {
            "immediate_actions": [
                "30 जून 2026 से पहले ग्रामीण प्रगति बैंक, रामपुर शाखा जाएँ।",
                "KCC नवीनीकरण के लिए जरूरी दस्तावेज़ तैयार रखें।",
                "खाते के नवीनीकरण के नाम पर OTP या PIN साझा न करें।",
            ]
            if hi
            else [
                "Visit Gramin Pragati Bank, Rampur Branch before 30 June 2026.",
                "Prepare the documents needed for KCC renewal.",
                "Do not share OTP or PIN with anyone claiming to renew the account.",
            ],
            "documents_to_collect": ["Aadhaar प्रति", "भूमि रिकॉर्ड या खेती प्रमाणपत्र", "दो पासपोर्ट फोटो", "नवीनतम फसल विवरण"]
            if hi
            else ["Aadhaar copy", "Land record or cultivation certificate", "Two passport photos", "Latest crop details"],
            "deadlines": ["30 जून 2026 से पहले KCC नवीनीकरण के लिए शाखा जाएँ।"]
            if hi
            else ["Visit the branch before 30 June 2026 to renew the KCC limit."],
            "questions_to_ask": ["क्या मेरी फसल और क्षेत्र PMFBY के लिए अधिसूचित हैं?", "सब्सिडी वाले ब्याज लाभ की अंतिम तारीख क्या है?"]
            if hi
            else ["Are my crop and area notified for PMFBY?", "What is the final date for subsidised interest benefits?"],
            "verification_steps": ["शाखा या आधिकारिक पोर्टल से PMFBY पात्रता सत्यापित करें।", "जमा किए गए हर दस्तावेज़ की रसीद रखें।"]
            if hi
            else ["Verify PMFBY eligibility with the branch or official portal.", "Keep receipts for every submitted document."],
            "disclaimer": "यह केवल शैक्षिक मार्गदर्शन है। आधिकारिक स्रोत से विवरण सत्यापित करें।"
            if hi
            else "This is educational guidance only. Verify details with official sources.",
        }
    return {
        "immediate_actions": ["किराया, जमा और नोटिस अवधि की प्रति सुरक्षित रखें।"] if hi else ["Keep a copy of rent, deposit, and notice-period terms."],
        "documents_to_collect": ["किराया रसीदें", "बिजली/पानी बिल रसीदें", "हस्ताक्षरित समझौता"] if hi else ["Rent receipts", "Utility bill receipts", "Signed agreement"],
        "deadlines": ["किराया हर महीने की 5 तारीख तक देय है।"] if hi else ["Rent is due by the 5th day of each month."],
        "questions_to_ask": ["सुरक्षा जमा से कौन सी कटौतियाँ हो सकती हैं?"] if hi else ["What deductions can be made from the security deposit?"],
        "verification_steps": ["सभी भुगतान की लिखित रसीद लें।"] if hi else ["Collect written receipts for every payment."],
        "disclaimer": "यह केवल शैक्षिक मार्गदर्शन है।" if hi else "This is educational guidance only.",
    }


def questions_for(sample_id: str, language: str | None = None) -> dict:
    hi = _hi(language)
    if sample_id == "farmer-kcc-notice":
        questions = [
            "मुझे KCC नवीनीकरण के लिए कौन से दस्तावेज़ चाहिए?",
            "मुझे शाखा कब तक जाना है?",
            "क्या PMFBY मेरे लिए लागू हो सकती है?",
        ] if hi else [
            "What documents do I need for KCC renewal?",
            "By when should I visit the branch?",
            "Could PMFBY apply to me?",
        ]
    else:
        questions = ["किराया कब देना है?", "सुरक्षा जमा कब लौटेगी?"] if hi else ["When is rent due?", "When should the security deposit be returned?"]
    return {"questions": questions}


def schemes_for(sample_id: str, language: str | None = None) -> dict:
    hi = _hi(language)
    if sample_id == "farmer-kcc-notice":
        return {
            "suggestions": [
                {
                    "name": "Kisan Credit Card (KCC)",
                    "reason": "दस्तावेज़ KCC सीमा नवीनीकरण और खेती गतिविधियों से जुड़ा है।"
                    if hi
                    else "The document is about KCC limit renewal and cultivation activities.",
                    "official_url": "https://www.myscheme.gov.in",
                    "confidence": 0.92,
                    "eligibility_notes": "पात्रता बैंक और खेती संबंधी दस्तावेज़ों से सत्यापित करें।"
                    if hi
                    else "Verify eligibility with the bank and cultivation documents.",
                    "required_documents": ["Aadhaar", "भूमि/खेती प्रमाण" if hi else "Land/cultivation proof", "फसल विवरण" if hi else "Crop details"],
                },
                {
                    "name": "PM Fasal Bima Yojana (PMFBY)",
                    "reason": "नोटिस में फसल बीमा और अधिसूचित फसल/क्षेत्र पात्रता का उल्लेख है।"
                    if hi
                    else "The notice mentions crop insurance and notified crop/area eligibility.",
                    "official_url": "https://pmfby.gov.in",
                    "confidence": 0.78,
                    "eligibility_notes": "फसल और क्षेत्र अधिसूचित हैं या नहीं, आधिकारिक पोर्टल पर जाँचें।"
                    if hi
                    else "Check whether the crop and area are notified on the official portal.",
                    "required_documents": ["फसल विवरण" if hi else "Crop details", "बैंक खाता विवरण" if hi else "Bank account details"],
                },
            ],
            "disclaimer": "पात्रता आधिकारिक स्रोतों से सत्यापित करें।" if hi else "Eligibility must be verified through official sources.",
        }
    return {"suggestions": [], "disclaimer": "पात्रता आधिकारिक स्रोतों से सत्यापित करें।" if hi else "Eligibility must be verified through official sources."}


def load_sample(
    conn: sqlite3.Connection, sample_id: str, language: str | None = None
) -> tuple[DocumentSummary, DocumentAnalysis]:
    sample = get_sample(sample_id)
    document_id = f"demo-{sample.id}-{uuid.uuid4().hex}"
    sample_dir = storage.get_upload_dir() / "samples"
    sample_dir.mkdir(parents=True, exist_ok=True)
    stored_path = sample_dir / f"{document_id}-{sample.filename}"
    stored_path.write_text(sample.raw_text, encoding="utf-8")

    analysis = analysis_for(sample, document_id, language)
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
