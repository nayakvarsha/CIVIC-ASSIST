import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
});

// Helper: Detect identity documents BEFORE AI call
function detectIdentityDocument(text: string): boolean {
    const identityKeywords = [
        'aadhaar', 'aadhar', 'uid', 'uidai',
        'pan card', 'pan number', 'permanent account number',
        'voter id', 'epic', 'election card',
        'driving license', 'driving licence', 'dl number',
        'passport', 'passport number'
    ];
    const lowerText = text.toLowerCase();
    return identityKeywords.some(keyword => lowerText.includes(keyword));
}

// Helper: Detect scam indicators
function detectScamIndicators(text: string): boolean {
    const scamKeywords = [
        'urgent action required', 'click here immediately',
        'your account will be blocked', 'send money', 'share otp',
        'lottery winner', 'congratulations you won', 'limited time offer',
        'act now', 'verify your account', 'suspended', 'prize money'
    ];
    const lowerText = text.toLowerCase();
    const scamCount = scamKeywords.filter(keyword => lowerText.includes(keyword)).length;
    return scamCount >= 2;
}

export async function POST(request: Request) {
    try {
        const { text, userContext } = await request.json();

        // PRIORITY 1: Block identity documents IMMEDIATELY
        if (detectIdentityDocument(text)) {
            return NextResponse.json({
                type: "identity_block",
                title: "Identity Document Detected",
                summary: "This appears to be a personal identity document (Aadhaar, PAN, Voter ID, etc.)",
                targetAudience: "N/A",
                personalImpact: "For your privacy and safety, we do not process or store identity documents.",
                actionItems: [
                    "Do not upload personal identity documents",
                    "Use official government portals (UIDAI, NSDL) for ID-related queries"
                ],
                benefits: [],
                deadlines: [],
                trustNote: "🔒 System Safety Protocol - Identity Document Blocked"
            });
        }

        // PRIORITY 2: Detect scams
        if (detectScamIndicators(text)) {
            return NextResponse.json({
                type: "scam",
                title: "⚠️ Potential Scam Detected",
                summary: "This document shows characteristics of fraudulent content.",
                targetAudience: "Anyone who received this",
                personalImpact: "DO NOT share personal information or make any payments.",
                actionItems: [
                    "Do not respond to this document",
                    "Do not share personal details (Aadhaar, bank account, OTP)",
                    "Report to cybercrime.gov.in immediately"
                ],
                benefits: [],
                deadlines: [],
                trustNote: "⚠️ FRAUD WARNING: Likely scam or fraudulent content"
            });
        }

        // PRIORITY 3: Call Groq AI - EXTREMELY STRICT ANALYSIS
        const systemPrompt = `You are a document reader. Read ONLY what is written in the document text provided.

ABSOLUTE RULES - NO EXCEPTIONS:
1. DO NOT use generic examples like "PM Example Welfare Scheme" or "PM-Kisan"
2. DO NOT make up scheme names or document titles
3. ONLY extract information that is EXPLICITLY written in the document text
4. If the document text is empty or unclear, say "Unable to read document content"
5. Quote actual phrases from the document in your response
6. If no specific information is provided, use "Information not provided in the document text"

Response Format (JSON):
{
  "type": "scheme" | "notice" | "letter" | "certificate" | "non_government",
  "title": "EXACT title from document, or 'Document Type: [what you see]'",
  "summary": "What is actually written in this document",
  "targetAudience": "From document text, or 'Not specified in document'",
  "personalImpact": "Based on actual content, or 'Not specified in document'",
  "actionItems": ["From document text, or 'No actions specified in document'"],
  "benefits": ["From document text only, or []"],
  "deadlines": ["From document text only, or []"],
  "trustNote": "Analysis note about what type of document this appears to be"
}

CRITICAL: Read the actual document text carefully. Do NOT invent content.`;

        const userPrompt = `Read this EXACT document text and analyze ONLY what is written:

=== DOCUMENT TEXT START ===
${text}
=== DOCUMENT TEXT END ===

User Context:
- Language: ${userContext.language || 'en'}
- Location: ${userContext.location || 'N/A'}
- Occupation: ${userContext.occupation || 'N/A'}

INSTRUCTIONS:
1. Read the document text between the markers above
2. Extract ONLY information that is explicitly written
3. DO NOT use "PM Example Welfare Scheme" or any generic examples
4. If information is missing, say "Not specified in document"
5. Quote actual phrases from the document

Provide JSON analysis.`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1, // Very low for factual responses
            max_tokens: 2000,
            top_p: 0.9,
        });

        const responseText = completion.choices[0]?.message?.content || "{}";

        // Parse JSON (handle markdown code blocks)
        let jsonText = responseText.trim();
        if (jsonText.startsWith("```json")) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonText.startsWith("```")) {
            jsonText = jsonText.replace(/```\n?/g, '');
        }

        const analysis = JSON.parse(jsonText);

        // Additional check: If AI still uses generic examples, reject it
        if (analysis.title && (
            analysis.title.includes("PM Example") ||
            analysis.title.includes("Example Scheme") ||
            analysis.title.includes("PM-KISAN") && !text.toLowerCase().includes("kisan")
        )) {
            return NextResponse.json({
                type: "non_government",
                title: "Document Analysis",
                summary: "Unable to extract specific information from the provided document.",
                targetAudience: "Document reader",
                personalImpact: "Please ensure the document text is clear and readable.",
                actionItems: ["Verify document quality", "Try uploading a clearer version"],
                benefits: [],
                deadlines: [],
                trustNote: "Could not identify specific document details from the provided text."
            });
        }

        return NextResponse.json(analysis);

    } catch (error) {
        console.error("Groq API Error:", error);
        return NextResponse.json(
            { error: "Failed to analyze document" },
            { status: 500 }
        );
    }
}
