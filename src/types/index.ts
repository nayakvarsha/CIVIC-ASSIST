export type DocumentType =
    | 'identity'
    | 'scheme'
    | 'notice'
    | 'advisory'
    | 'low_quality'
    | 'unknown';

export interface UserContext {
    age?: string;
    location?: string;
    occupation?: string;
    language: 'en' | 'hi' | 'ta' | 'or' | 'mr' | 'gu';
}

export interface AnalysisResult {
    title: string;
    summary: string; // 1. What is this document about?
    targetAudience: string; // 2. Who should pay attention to this?
    personalImpact: string; // 3. What does this mean for you?
    actionItems: string[]; // 4. What action should you take?
    benefits: string[]; // 5. Benefits or consequences
    deadlines: string[]; // 6. Important dates
    trustNote: string; // 7. Source & trust note
    documentType: DocumentType;
    voice_script?: string; // 8. Generated voice script
}

export type AnalysisStatus = 'idle' | 'scanning' | 'classifying' | 'simplifying' | 'translating' | 'complete' | 'error';
