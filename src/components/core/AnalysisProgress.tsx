"use client";

import { motion } from "framer-motion";
import { Loader2, CheckCircle2, FileSearch, Shield, Languages, Lightbulb } from "lucide-react";
import { AnalysisStatus } from "@/types";

interface AnalysisProgressProps {
    status: AnalysisStatus;
    progress: number;
}

const statusConfig = {
    scanning: { icon: FileSearch, label: "Scanning Document with AI", color: "text-blue-600" },
    classifying: { icon: Shield, label: "Analyzing Document Structure", color: "text-purple-600" },
    simplifying: { icon: Lightbulb, label: "Simplifying Complex Terms", color: "text-amber-600" },
    translating: { icon: Languages, label: "Generating Final Explanation", color: "text-green-600" },
    complete: { icon: CheckCircle2, label: "Analysis Ready", color: "text-green-600" },
};

export function AnalysisProgress({ status, progress }: AnalysisProgressProps) {
    if (status === 'idle' || status === 'error') return null;

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scanning;
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto mt-12 mb-8"
        >
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-100">
                <div className="flex items-center gap-4 mb-6">
                    <div className={`p-3 rounded-full bg-slate-50 ${config.color}`}>
                        {status === 'complete' ? (
                            <Icon className="w-6 h-6" />
                        ) : (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg">{config.label}</h3>
                        <p className="text-sm text-muted-foreground">Please wait while we analyze your document...</p>
                    </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-blue-600 to-amber-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>
        </motion.div>
    );
}
