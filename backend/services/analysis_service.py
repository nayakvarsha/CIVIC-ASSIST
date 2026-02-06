from groq import Groq
import os

# Use Groq API (free tier, no credit issues)
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def detect_identity_document(text: str) -> bool:
    """Check for identity documents including Aadhar, PAN, and Voter ID"""
    keywords = [
        'aadhaar', 'aadhar', 'uidai',  # Aadhar
        'pan card', 'permanent account number',  # PAN (Removed 'income tax department' as it appears on notices)
        'voter id', 'elector photo identity card', 'epic no'  # Voter ID (Removed 'election commission' as it appears on press notes)
    ]
    return any(keyword in text.lower() for keyword in keywords)

def detect_scam(text: str) -> bool:
    """Check for scam indicators"""
    scam_keywords = ['urgent action', 'share otp', 'send money', 'lottery winner', 'click immediately']
    count = sum(1 for keyword in scam_keywords if keyword in text.lower())
    return count >= 2

async def analyze_document(text: str, user_context: dict):
    """
    Complete analysis pipeline using Groq AI
    """
    # ... (Low quality check skipped for brevity in this replace block, handled by original code)

    try:
        # Priority 1: Block identity documents (Aadhar, PAN, Voter ID)
        if detect_identity_document(text):
            return {
                "type": "identity_block",
                "title": "Private Document Detected",
                "summary": "private messages cannot be summarized",  # User requested exact message
                "targetAudience": "N/A",
                "personalImpact": "This document contains sensitive personal information.",
                "actionItems": ["We do not process Aadhar, PAN, or Voter Cards for privacy reasons."],
                "benefits": [],
                "deadlines": [],
                "trustNote": "🔒 Privacy Protection Active",
                "voice_script": "This is a private identity document. Depending on privacy rules, private messages cannot be summarized."
            }
        
        # Priority 2: Detect scams
        if detect_scam(text):
            return {
                "type": "scam",
                "title": "⚠️ Potential Scam Detected",
                "summary": "This document shows fraud characteristics.",
                "targetAudience": "Anyone who received this",
                "personalImpact": "DO NOT share personal information.",
                "actionItems": ["Do not respond", "Report to cybercrime.gov.in"],
                "benefits": [],
                "deadlines": [],
                "trustNote": "⚠️ FRAUD WARNING",
                "voice_script": "Warning. This document shows signs of being a scam or fraud. Do not share your personal information. Do not send money."
            }
        
        # Priority 3: Groq AI Analysis
        print(f"[ANALYSIS] Starting Groq AI analysis...", flush=True)
        
        system_prompt = """You are a Civic Document Analyzer.

STEP 1 — DOCUMENT READING (MANDATORY)
Extract ALL readable text from the uploaded document using OCR.
If no text is extracted, respond ONLY with: "DOCUMENT NOT READABLE"

STEP 2 — GROUNDING RULES (STRICT)
Use ONLY the extracted text
Do NOT use prior knowledge
Do NOT assume this is a government scheme
Do NOT mention PM-Kisan, Aadhaar benefits, or any scheme unless explicitly written

STEP 3 — DOCUMENT IDENTIFICATION
Identify the document type ONLY if it is clearly visible in the text
(example: Aadhaar card, notice, certificate).
If unclear, say: "Document type not clearly mentioned."

STEP 4 — INFORMATION EXTRACTION
Extract and list ONLY what is present.
If it is an ID Card:
- Name, Date of birth, Gender, Document number, Address
If it is a Scheme/Notice:
- Key Objectives/Features
- Eligibility Criteria
- Premium/Financial Details (e.g., "2%", "Subsidy")
- Risks Covered
- Important Dates
- Implementing Agencies (MUST list National, State, and District levels if available)
- Modes of Implementation (e.g., Insurance, Trust, Mixed)

If it is a Website/Portal:
- Latest Announcements/Updates
- Helpline and Contact Information
- Eligibility Exclusions/Requirements

STEP 5 — SIMPLE EXPLANATION
Explain the document in very simple words (10th-grade level).
If it covers multiple topics (e.g., two schemes), start with an overview: "The image explains two major..."
Short sentences.
No legal or bureaucratic language.

STEP 6 — IMPORTANT POINTS
Provide a structured breakdown.
If the document covers multiple schemes (e.g., HWCs and PM-JAY), create separate sections for each.
For Scheme Documents, specifically look for:
- "Health and Wellness Centres (HWCs)": Focus, Funding, Service Areas.
- "Pradhan Mantri Jan Arogya Yojana (PM-JAY)": Beneficiaries, Insurance/Trust Modes.
- "Implementing Agencies": National (NHA), State (SHA), District (DIU).

For Websites/Portals:
- "Latest Announcements": New installments, budget updates.
- "Helpline": Phone numbers, contact methods.
- "Eligibility Exclusions": Who is NOT eligible.

Map these detailed points to the "benefits" field in the JSON.

STEP 7 — LANGUAGE & VOICE
1. Translate the ENTIRE explanation (Title, Summary, Important Points, Actions) into the user's selected language ({user_context.get('language', 'en')}).
2. Generate a voice script in that language.
3. The script MUST read the Title, then the Summary, and then clearly read out each Important Point.
4. Voice Script Structure: "Title... Summary... Here are the important points: Point 1... Point 2... Point 3..."

FINAL RULE
If something is missing, unreadable, or unclear, clearly say so.
Never guess. Never auto-fill.

OUTPUT FORMAT (STRICT JSON ONLY):
You must output a single valid JSON object. Do not include any markdown formatting like ```json ... ```.
{
  "type": "scheme" | "notice" | "certificate" | "identity" | "unknown",
  "title": "Exact document title",
  "summary": "Simple explanation (Step 5)",
  "targetAudience": "Who this is for",
  "personalImpact": "What this means for the user",
  "actionItems": ["Action 1", "Action 2"],
  "benefits": ["Important Point 1", "Important Point 2", "Important Point 3"], 
  "deadlines": ["Deadline 1", "Deadline 2"],
  "trustNote": "Verification note",
  "voice_script": "The full translated script including title, summary, and important points"
}"""

        target_lang = user_context.get('language', 'en')
        print(f"[ANALYSIS] Requested Language: {target_lang}", flush=True)

        user_prompt = f"""Analyze this document text:

{text}

User Context: 
- Occupation: {user_context.get('occupation', 'N/A')}
- Location: {user_context.get('location', 'N/A')}
- Language Code: {target_lang} (Translate output to this language)

Extract ONLY actual information. Do NOT invent content. Return JSON only."""

        print(f"[ANALYSIS] Calling Groq API with model llama-3.3-70b-versatile...", flush=True)
        
        # Add timeout to prevent hanging
        import asyncio
        try:
            # Run the synchronous Groq call with a timeout
            completion = await asyncio.wait_for(
                asyncio.to_thread(
                    groq_client.chat.completions.create,
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.1,
                    max_tokens=2000
                ),
                timeout=30.0  # 30 second timeout
            )
            print(f"[ANALYSIS] Groq API call completed successfully", flush=True)
        except asyncio.TimeoutError:
            print(f"[ANALYSIS] ERROR: Groq API call timed out after 30 seconds", flush=True)
            raise Exception("AI analysis timed out. Please try again.")
        except Exception as api_error:
            print(f"[ANALYSIS] ERROR: Groq API call failed: {str(api_error)}", flush=True)
            raise

        response_text = completion.choices[0].message.content
        print(f"[ANALYSIS] Received response from Groq API (length: {len(response_text)})", flush=True)
        
        # Parse JSON
        import json
        json_text = response_text.strip()
        if json_text.startswith("```json"):
            json_text = json_text.replace("```json", "").replace("```", "").strip()
        elif json_text.startswith("```"):
             json_text = json_text.replace("```", "").strip()
        
        result = json.loads(json_text)
        return result

    except Exception as e:
        return {
            "type": "error",
            "title": "Analysis Error",
            "summary": f"Failed to analyze: {str(e)}",
            "targetAudience": "N/A",
            "personalImpact": "Please try again",
            "actionItems": ["Check document quality"],
            "benefits": [],
            "deadlines": [],
            "trustNote": "Error occurred during analysis"
        }
