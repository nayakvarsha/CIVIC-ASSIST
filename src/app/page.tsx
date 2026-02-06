"use client";

import { useState } from "react";
import { Header } from "@/components/core/Header";
import { InputSection } from "@/components/core/InputSection";
import { UserContextForm } from "@/components/core/UserContextForm";
import { AnalysisProgress } from "@/components/core/AnalysisProgress";
import { ExplanationView } from "@/components/core/ExplanationView";
import { useCivicAnalysis } from "@/hooks/use-civic-analysis";
import { UserContext } from "@/types";
import { ShieldAlert } from "lucide-react";

export default function Home() {
  const [userContext, setUserContext] = useState<UserContext>({
    language: 'en'
  });

  const { status, result, progress, analyzeDocument, reset } = useCivicAnalysis();

  const handleAnalyze = (input: string | File, type: 'text' | 'file' | 'url') => {
    analyzeDocument(input, userContext);
  };

  const handleReset = () => {
    reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      <main className="container mx-auto px-4 py-12">
        {/* Input Section - Always visible */}
        {status === 'idle' && (
          <>
            <InputSection
              onAnalyze={handleAnalyze}
              isAnalyzing={status !== 'idle' && status !== 'complete' && status !== 'error'}
            />

            <UserContextForm
              context={userContext}
              onChange={setUserContext}
            />
          </>
        )}

        {/* Progress Indicator */}
        <AnalysisProgress status={status} progress={progress} />

        {/* Results */}
        {result && status === 'complete' && (
          <>
            <ExplanationView result={result} userLanguage={userContext.language} />

            <div className="max-w-4xl mx-auto mt-8 text-center">
              <button
                onClick={handleReset}
                className="text-primary hover:underline font-medium"
              >
                ← Analyze Another Document
              </button>
            </div>
          </>
        )}

        {/* Error State */}
        {result && status === 'error' && (
          <>
            <ExplanationView result={result} userLanguage={userContext.language} />

            <div className="max-w-4xl mx-auto mt-8 text-center">
              <button
                onClick={handleReset}
                className="text-primary hover:underline font-medium"
              >
                ← Try Another Document
              </button>
            </div>
          </>
        )}

        {/* Footer Disclaimer */}
        <div className="max-w-4xl mx-auto mt-16 mb-8">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900 space-y-2">
                <p className="font-semibold">Important Disclaimer</p>
                <p>
                  This is an AI-powered assistant designed to help you understand government documents.
                  It is <strong>not a substitute for official legal advice</strong>. Always verify information
                  with official government sources or consult a qualified professional for legal matters.
                </p>
                <p className="text-xs text-amber-700">
                  We do not store your documents or personal information. All processing happens in your browser.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-slate-50 py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Built to reduce information inequality and empower citizens.</p>
          <p className="mt-2 text-xs">Not affiliated with any government entity.</p>
        </div>
      </footer>
    </div>
  );
}
