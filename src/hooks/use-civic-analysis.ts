"use client";

import { useState } from 'react';
import { AnalysisResult, AnalysisStatus, UserContext, DocumentType } from '@/types';

// Fallback responses for errors
const MOCK_IDENTITY_ERROR: AnalysisResult = {
    title: "Identity Document Detected",
    summary: "This appears to be a personal identity document (like Aadhaar, PAN, or Voter ID).",
    targetAudience: "N/A",
    personalImpact: "For your privacy and safety, we do not process or store identity documents.",
    actionItems: ["Please do not upload personal IDs.", "Use official government portals (UIDAI, NSDL) for ID-related queries."],
    benefits: [],
    deadlines: [],
    trustNote: "🔒 System Safety Protocol Triggered - Identity Document Blocked.",
    documentType: 'identity'
};

const MOCK_SCAM_WARNING: AnalysisResult = {
    title: "⚠️ Potential Scam Detected",
    summary: "This document shows characteristics of fraudulent content.",
    targetAudience: "Anyone who received this document",
    personalImpact: "DO NOT share personal information or make any payments.",
    actionItems: [
        "Do not respond to this document",
        "Do not share personal details",
        "Report to cybercrime.gov.in",
        "Verify with official government websites"
    ],
    benefits: [],
    deadlines: [],
    trustNote: "⚠️ FRAUD WARNING: This document failed authenticity checks.",
    documentType: 'unknown'
};

export function useCivicAnalysis() {
    const [status, setStatus] = useState<AnalysisStatus>('idle');
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [progress, setProgress] = useState(0);

    const analyzeDocument = async (input: string | File, userContext: UserContext) => {
        // Reset everything immediately for a "smooth" transition
        setStatus('scanning');
        setProgress(5);
        setResult(null);

        console.log("Starting analysis for:", typeof input === 'string' ? "Text input" : input.name);

        try {
            const formData = new FormData();

            if (typeof input === 'string') {
                // For text input, we'll create a virtual text file
                const blob = new Blob([input], { type: 'text/plain' });
                formData.append('file', blob, 'input.txt');
            } else {
                formData.append('file', input);
            }

            formData.append('user_context', JSON.stringify(userContext));

            // Step 1: Scanning (UI Progress)
            await new Promise(r => setTimeout(r, 800));
            setProgress(30);

            // Step 2: Classification / Processing (Calling Python Backend)
            setStatus('classifying');

            console.log('[FRONTEND] Starting fetch to /api/process-document');

            // Add timeout to prevent infinite hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.error('[FRONTEND] Request timeout after 60 seconds');
                controller.abort();
            }, 60000); // 60 second timeout

            let response;
            try {
                response = await fetch('/api/process-document', {
                    method: 'POST',
                    body: formData,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                console.log(`[FRONTEND] Response received: ${response.status} ${response.statusText}`);

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('[FRONTEND] Error response:', errorData);
                    throw new Error(errorData.details || 'Backend processing failed');
                }
            } catch (fetchError: any) {
                clearTimeout(timeoutId);
                if (fetchError.name === 'AbortError') {
                    console.error('[FRONTEND] Request was aborted due to timeout');
                    throw new Error('Request timed out after 60 seconds. The server might be overloaded.');
                }
                console.error('[FRONTEND] Fetch error:', fetchError);
                throw fetchError;
            }

            const apiResult = await response.json();

            setProgress(70);
            setStatus('simplifying');
            await new Promise(r => setTimeout(r, 500));

            setProgress(90);
            setStatus('translating');
            await new Promise(r => setTimeout(r, 500));

            // Handle different response types from Python backend
            if (apiResult.type === 'identity_block') {
                setStatus('error');
                setResult(MOCK_IDENTITY_ERROR);
                return;
            }

            if (apiResult.type === 'scam') {
                setStatus('error');
                setResult({
                    ...MOCK_SCAM_WARNING,
                    title: apiResult.title || MOCK_SCAM_WARNING.title,
                    summary: apiResult.summary || MOCK_SCAM_WARNING.summary,
                    personalImpact: apiResult.personalImpact || MOCK_SCAM_WARNING.personalImpact,
                    actionItems: apiResult.actionItems || MOCK_SCAM_WARNING.actionItems,
                    trustNote: apiResult.trustNote || MOCK_SCAM_WARNING.trustNote,
                });
                return;
            }

            // Success - format the result
            const formattedResult: AnalysisResult = {
                title: apiResult.title || "Document Analysis",
                summary: apiResult.summary || "Analysis completed",
                targetAudience: apiResult.targetAudience || "Not specified",
                personalImpact: apiResult.personalImpact || "Please review the document details",
                actionItems: Array.isArray(apiResult.actionItems) ? apiResult.actionItems : ["No actions specified"],
                benefits: Array.isArray(apiResult.benefits) ? apiResult.benefits : [],
                deadlines: Array.isArray(apiResult.deadlines) ? apiResult.deadlines : [],
                trustNote: apiResult.trustNote || `OCR Confidence: ${apiResult.ocr_confidence}%`,
                documentType: apiResult.type || 'scheme'
            };

            setResult(formattedResult);
            setProgress(100);
            setStatus('complete');

        } catch (error: any) {
            console.error('Analysis error:', error);
            setStatus('error');
            setResult({
                title: "Analysis Error",
                summary: error.message || "Unable to analyze the document. Please ensure the backend is running.",
                targetAudience: "N/A",
                personalImpact: "The analysis pipeline encountered an issue.",
                actionItems: ["Make sure the Python backend (port 8000) is running", "Check your internet connection (needed for Groq API)"],
                benefits: [],
                deadlines: [],
                trustNote: "Technical Error in Pipeline",
                documentType: 'unknown'
            });
        }
    };

    const reset = () => {
        setStatus('idle');
        setResult(null);
        setProgress(0);
    };

    return {
        status,
        result,
        progress,
        analyzeDocument,
        reset
    };
}
