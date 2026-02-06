"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    FileText,
    Users,
    Target,
    CheckSquare,
    Gift,
    Calendar,
    ShieldCheck,
    Volume2,
    VolumeX,
    AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnalysisResult } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ExplanationViewProps {
    result: AnalysisResult;
    userLanguage?: string; // Language code from user context
}

export function ExplanationView({ result, userLanguage = 'en' }: ExplanationViewProps) {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);

    // Map language codes to speech synthesis language codes
    const getVoiceLanguage = (lang: string): string => {
        const langMap: Record<string, string> = {
            'en': 'en-US',
            'hi': 'hi-IN',
            'ta': 'ta-IN',
            'or': 'or-IN', // Odia
            'mr': 'mr-IN', // Marathi
            'gu': 'gu-IN'  // Gujarati
        };
        return langMap[lang] || 'en-US';
    };

    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            const loadVoices = () => {
                const availableVoices = window.speechSynthesis.getVoices();
                if (availableVoices.length > 0) {
                    setVoices(availableVoices);
                    console.log("Loaded voices:", availableVoices.length);
                }
            };

            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    const playBrowserTTS = (text: string) => {
        if (!('speechSynthesis' in window)) return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const targetLangCode = userLanguage;

        // Find best voice with robust matching
        const specificVoice = voices.find(v =>
            v.lang === getVoiceLanguage(targetLangCode) ||
            v.lang.startsWith(targetLangCode) ||
            v.name.toLowerCase().includes(targetLangCode === 'hi' ? 'hindi' :
                targetLangCode === 'ta' ? 'tamil' :
                    targetLangCode === 'gu' ? 'gujarati' :
                        targetLangCode === 'mr' ? 'marathi' : targetLangCode)
        );

        if (specificVoice) {
            utterance.voice = specificVoice;
            utterance.lang = specificVoice.lang;
        } else {
            utterance.lang = getVoiceLanguage(targetLangCode);
        }

        utterance.rate = 0.9;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    const handleSpeak = async () => {
        if (isSpeaking) {
            // Stop everything
            if (audioPlayer) {
                audioPlayer.pause();
                setAudioPlayer(null);
            }
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        setIsSpeaking(true);
        let text = result.voice_script;
        if (!text) text = `${result.title}. ${result.summary}.`;

        try {
            console.log("Attempting Murf AI generation...");
            const response = await fetch('/api/speak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, language: userLanguage })
            });

            if (!response.ok) throw new Error("Murf API failed");

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            audio.onended = () => {
                setIsSpeaking(false);
                setAudioPlayer(null);
            };
            audio.onerror = () => {
                console.error("Audio playback failed, falling back.");
                playBrowserTTS(text);
            };

            setAudioPlayer(audio);
            audio.play();
            console.log("Playing Murf AI audio");

        } catch (e) {
            console.warn("Murf AI unavailable (likely no key), falling back to browser TTS.");
            playBrowserTTS(text);
        }
    };

    const isIdentityDoc = result.documentType === 'identity';
    const isError = result.documentType === 'unknown' || result.documentType === 'low_quality' || result.title.includes('⚠️');
    const isScam = result.title.includes('⚠️') && !result.title.includes('Error');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto mt-12 space-y-6"
        >
            {/* Identity Document Warning */}
            {isIdentityDoc && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 flex items-start gap-4">
                    <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="font-bold text-red-900 text-lg mb-2">🔒 Privacy Protection Activated</h3>
                        <p className="text-red-800">{result.summary}</p>
                        <p className="text-red-700 mt-2 text-sm">{result.personalImpact}</p>
                    </div>
                </div>
            )}

            {/* Error or Scam Warning */}
            {(isError && !isIdentityDoc) && (
                <div className={cn(
                    "rounded-xl p-6 flex items-start gap-4 border-2",
                    isScam ? "bg-orange-50 border-orange-300" : "bg-red-50 border-red-200"
                )}>
                    <AlertTriangle className={cn(
                        "w-10 h-10 flex-shrink-0 mt-1",
                        isScam ? "text-orange-600 animate-pulse" : "text-red-600"
                    )} />
                    <div>
                        <h3 className={cn(
                            "font-bold text-xl mb-2",
                            isScam ? "text-orange-900" : "text-red-900"
                        )}>{result.title}</h3>
                        <p className={cn(
                            "font-medium",
                            isScam ? "text-orange-800" : "text-red-800"
                        )}>{result.summary}</p>
                        <p className={cn(
                            "mt-2",
                            isScam ? "text-orange-700" : "text-red-700"
                        )}>{result.personalImpact}</p>
                        <div className="mt-4 space-y-2">
                            {result.actionItems.map((item, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                    <span className={cn("font-bold mt-0.5", isScam ? "text-orange-600" : "text-red-600")}>
                                        {isScam ? "⚠️" : "•"}
                                    </span>
                                    <span className="text-sm font-medium">{item}</span>
                                </div>
                            ))}
                        </div>
                        <p className={cn(
                            "text-xs mt-4 font-bold",
                            isScam ? "text-orange-600" : "text-red-600"
                        )}>{result.trustNote}</p>
                    </div>
                </div>
            )}

            {!isIdentityDoc && !isError && (
                <>
                    {/* Header with Title and Voice */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-8 shadow-xl">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <h2 className="text-3xl font-bold mb-3">{result.title}</h2>
                                <p className="text-lg text-white/90">{result.summary}</p>
                            </div>
                            <Button
                                onClick={handleSpeak}
                                variant="secondary"
                                size="lg"
                                className="flex-shrink-0"
                            >
                                {isSpeaking ? (
                                    <>
                                        <VolumeX className="w-5 h-5 mr-2" />
                                        Stop
                                    </>
                                ) : (
                                    <>
                                        <Volume2 className="w-5 h-5 mr-2" />
                                        Listen
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* 7-Point Structured Output */}
                    <div className="grid gap-4">
                        {/* 2. Who should pay attention */}
                        <Card className="border-l-4 border-l-blue-500">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Users className="w-5 h-5 text-blue-600" />
                                    Who Should Pay Attention?
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-base">{result.targetAudience}</p>
                            </CardContent>
                        </Card>

                        {/* 3. What does this mean for you */}
                        <Card className="border-l-4 border-l-purple-500 bg-purple-50/30">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Target className="w-5 h-5 text-purple-600" />
                                    What Does This Mean For You?
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-base font-medium">{result.personalImpact}</p>
                            </CardContent>
                        </Card>

                        {/* 4. Action Items */}
                        <Card className="border-l-4 border-l-amber-500">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <CheckSquare className="w-5 h-5 text-amber-600" />
                                    What Action Should You Take?
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {result.actionItems.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <span className="text-amber-600 font-bold mt-0.5">•</span>
                                            <span className="text-base">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* 5. Benefits */}
                        {result.benefits.length > 0 && (
                            <Card className="border-l-4 border-l-green-500">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Gift className="w-5 h-5 text-green-600" />
                                        Benefits or Consequences
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {result.benefits.map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-green-600 font-bold mt-0.5">✓</span>
                                                <span className="text-base">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        {/* 6. Deadlines */}
                        {result.deadlines.length > 0 && (
                            <Card className="border-l-4 border-l-red-500 bg-red-50/30">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Calendar className="w-5 h-5 text-red-600" />
                                        Important Dates & Deadlines
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {result.deadlines.map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-red-600 font-bold mt-0.5">⏰</span>
                                                <span className="text-base font-medium">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        {/* 7. Trust Note */}
                        <Card className="border-2 border-slate-200 bg-slate-50">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <ShieldCheck className="w-5 h-5 text-slate-600" />
                                    Source & Trust Note
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-700">{result.trustNote}</p>
                                <p className="text-xs text-slate-500 mt-3 italic">
                                    This explanation is based solely on the document you provided. For official guidance, please contact the relevant government office.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </motion.div>
    );
}
