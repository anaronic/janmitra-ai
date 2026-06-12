"""Curated knowledge base of Indian government schemes for discovery.

Static data for V1. Eligibility must always be verified through official sources.
"""
from __future__ import annotations

SCHEMES: list[dict[str, str]] = [
    {
        "name": "PM-KISAN",
        "category": "Agriculture",
        "summary": "Income support of Rs 6,000/year to eligible landholding farmer families.",
        "for_whom": "Small and marginal landholding farmers.",
        "official_url": "https://pmkisan.gov.in",
    },
    {
        "name": "Kisan Credit Card (KCC)",
        "category": "Agriculture / Credit",
        "summary": "Short-term credit for cultivation and allied activities at subsidised interest.",
        "for_whom": "Farmers, including tenant farmers and sharecroppers.",
        "official_url": "https://www.myscheme.gov.in",
    },
    {
        "name": "Ayushman Bharat (PM-JAY)",
        "category": "Health",
        "summary": "Health cover of up to Rs 5 lakh per family per year for secondary and tertiary care.",
        "for_whom": "Economically vulnerable families as per SECC criteria.",
        "official_url": "https://pmjay.gov.in",
    },
    {
        "name": "PM Fasal Bima Yojana (PMFBY)",
        "category": "Agriculture / Insurance",
        "summary": "Crop insurance against yield loss from natural calamities, pests, and disease.",
        "for_whom": "Farmers growing notified crops in notified areas.",
        "official_url": "https://pmfby.gov.in",
    },
    {
        "name": "PMEGP",
        "category": "Employment / Enterprise",
        "summary": "Credit-linked subsidy to set up micro-enterprises and generate self-employment.",
        "for_whom": "Individuals above 18 setting up new micro-enterprises.",
        "official_url": "https://www.kviconline.gov.in/pmegpeportal",
    },
    {
        "name": "Mudra Loans (PMMY)",
        "category": "Credit / Enterprise",
        "summary": "Collateral-free loans up to Rs 10 lakh for non-farm micro and small enterprises.",
        "for_whom": "Small business owners and entrepreneurs.",
        "official_url": "https://www.mudra.org.in",
    },
    {
        "name": "Atal Pension Yojana (APY)",
        "category": "Pension",
        "summary": "Guaranteed minimum pension after age 60 for contributors.",
        "for_whom": "Workers in the unorganised sector aged 18-40.",
        "official_url": "https://www.npscra.nsdl.co.in",
    },
    {
        "name": "Sukanya Samriddhi Yojana (SSY)",
        "category": "Savings",
        "summary": "Small savings scheme for a girl child with attractive interest and tax benefits.",
        "for_whom": "Parents/guardians of a girl child below 10 years.",
        "official_url": "https://www.india.gov.in",
    },
    {
        "name": "Pradhan Mantri Jan Dhan Yojana (PMJDY)",
        "category": "Financial Inclusion",
        "summary": "Zero-balance bank accounts with accident insurance and overdraft facility.",
        "for_whom": "Unbanked individuals across India.",
        "official_url": "https://pmjdy.gov.in",
    },
    {
        "name": "PM Suraksha Bima Yojana (PMSBY)",
        "category": "Insurance",
        "summary": "Accidental death and disability cover at a very low annual premium.",
        "for_whom": "Bank account holders aged 18-70.",
        "official_url": "https://www.jansuraksha.gov.in",
    },
    {
        "name": "PM Jeevan Jyoti Bima Yojana (PMJJBY)",
        "category": "Insurance",
        "summary": "Life insurance cover of Rs 2 lakh at a low annual premium.",
        "for_whom": "Bank account holders aged 18-50.",
        "official_url": "https://www.jansuraksha.gov.in",
    },
    {
        "name": "PM Awas Yojana (PMAY)",
        "category": "Housing",
        "summary": "Financial assistance and interest subsidy for building or buying a home.",
        "for_whom": "EWS, LIG, and MIG households without a pucca house.",
        "official_url": "https://pmaymis.gov.in",
    },
    {
        "name": "Stand-Up India",
        "category": "Credit / Enterprise",
        "summary": "Bank loans between Rs 10 lakh and Rs 1 crore for greenfield enterprises.",
        "for_whom": "SC/ST and women entrepreneurs.",
        "official_url": "https://www.standupmitra.in",
    },
    {
        "name": "National Pension System (NPS)",
        "category": "Pension",
        "summary": "Voluntary, long-term retirement savings with market-linked returns.",
        "for_whom": "Indian citizens aged 18-70.",
        "official_url": "https://www.npscra.nsdl.co.in",
    },
    {
        "name": "PM Vishwakarma",
        "category": "Skill / Enterprise",
        "summary": "Skill training, toolkit incentive, and collateral-free credit for traditional artisans.",
        "for_whom": "Artisans and craftspeople in 18 notified trades.",
        "official_url": "https://pmvishwakarma.gov.in",
    },
    {
        "name": "PM SVANidhi",
        "category": "Credit",
        "summary": "Working-capital micro-loans for street vendors with incentives for digital payments.",
        "for_whom": "Street vendors operating in urban areas.",
        "official_url": "https://pmsvanidhi.mohua.gov.in",
    },
    {
        "name": "Pradhan Mantri Mudra - Shishu/Kishore/Tarun",
        "category": "Credit / Enterprise",
        "summary": "Tiered Mudra loans (Shishu up to 50k, Kishore up to 5L, Tarun up to 10L).",
        "for_whom": "Micro-entrepreneurs at different growth stages.",
        "official_url": "https://www.mudra.org.in",
    },
    {
        "name": "National Scholarship Portal Schemes",
        "category": "Education",
        "summary": "Pre- and post-matric scholarships for students from eligible categories.",
        "for_whom": "Students meeting income and category criteria.",
        "official_url": "https://scholarships.gov.in",
    },
]


def scheme_catalog_text() -> str:
    """Compact text catalog passed to the model for context-based matching."""
    lines = []
    for s in SCHEMES:
        lines.append(
            f"- {s['name']} ({s['category']}): {s['summary']} For: {s['for_whom']} "
            f"Official: {s['official_url']}"
        )
    return "\n".join(lines)
