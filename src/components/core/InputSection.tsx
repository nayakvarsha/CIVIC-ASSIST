"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Link as LinkIcon, Type, FileText, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface InputSectionProps {
    onAnalyze: (input: string | File, type: 'text' | 'file' | 'url') => void;
    isAnalyzing: boolean;
}

export function InputSection({ onAnalyze, isAnalyzing }: InputSectionProps) {
    const [activeTab, setActiveTab] = useState("upload");
    const [textInput, setTextInput] = useState("");
    const [urlInput, setUrlInput] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/*': ['.png', '.jpg', '.jpeg']
        },
        maxFiles: 1,
        multiple: false
    });

    const handleAnalyze = () => {
        if (activeTab === 'upload' && file) {
            onAnalyze(file, 'file');
        } else if (activeTab === 'text' && textInput) {
            onAnalyze(textInput, 'text');
        } else if (activeTab === 'url' && urlInput) {
            onAnalyze(urlInput, 'url');
        }
    };

    const hasContent = (activeTab === 'upload' && file) ||
        (activeTab === 'text' && textInput.length > 10) ||
        (activeTab === 'url' && urlInput.length > 5);

    return (
        <div className="w-full max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
                    Understand Any Government Document
                </h2>
                <p className="text-lg text-muted-foreground text-balance">
                    Upload a photo, paste text, or share a link. We&apos;ll explain what it means needed for <b>you</b>.
                </p>
            </div>

            <div className="bg-white rounded-2xl p-1 shadow-xl paper-shadow border border-slate-100">
                <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-50/50 p-1 h-14 rounded-xl">
                        <TabsTrigger value="upload" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-medium text-base">
                            <UploadCloud className="w-4 h-4 mr-2" /> Upload
                        </TabsTrigger>
                        <TabsTrigger value="text" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-medium text-base">
                            <Type className="w-4 h-4 mr-2" /> Paste Text
                        </TabsTrigger>
                        <TabsTrigger value="url" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-medium text-base">
                            <LinkIcon className="w-4 h-4 mr-2" /> Website
                        </TabsTrigger>
                    </TabsList>

                    <div className="px-6 pb-6 min-h-[300px] flex flex-col justify-between">
                        <AnimatePresence mode="wait">

                            <TabsContent key="upload" value="upload" className="mt-0 focus-visible:ring-0">
                                <motion.div
                                    key="upload-tab"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-4"
                                >
                                    <div
                                        {...getRootProps()}
                                        className={cn(
                                            "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors h-[250px]",
                                            isDragActive ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                                            file ? "bg-green-50 border-green-200" : ""
                                        )}
                                    >
                                        <input {...getInputProps()} />
                                        {file ? (
                                            <div className="space-y-2">
                                                <div className="bg-green-100 p-4 rounded-full mx-auto w-fit">
                                                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                                                </div>
                                                <p className="font-medium text-lg text-green-900">{file.name}</p>
                                                <p className="text-sm text-green-700">Ready to analyze</p>
                                                <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-xs hover:underline text-destructive mt-2">
                                                    Remove & Upload New
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="bg-slate-100 p-4 rounded-full mb-4">
                                                    <UploadCloud className="w-8 h-8 text-slate-400" />
                                                </div>
                                                <p className="font-semibold text-lg text-slate-900">
                                                    Click to upload or drag & drop
                                                </p>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    Supports PDF, JPG, PNG (Max 10MB)
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            </TabsContent>

                            <TabsContent key="text" value="text" className="mt-0 focus-visible:ring-0">
                                <motion.div
                                    key="text-tab"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <Textarea
                                        placeholder="Paste the government notice or scheme details here..."
                                        className="min-h-[250px] text-base resize-none focus-visible:ring-blue-600/20"
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                    />
                                </motion.div>
                            </TabsContent>

                            <TabsContent key="url" value="url" className="mt-0 focus-visible:ring-0">
                                <motion.div
                                    key="url-tab"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-4 py-10"
                                >
                                    <div className="text-center mb-6">
                                        <p className="text-muted-foreground">Paste a link to a government website or news article</p>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <LinkIcon className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <Input
                                            type="url"
                                            placeholder="https://example.gov.in/scheme-details"
                                            className="pl-10 h-14 text-lg"
                                            value={urlInput}
                                            onChange={(e) => setUrlInput(e.target.value)}
                                        />
                                    </div>
                                </motion.div>
                            </TabsContent>

                        </AnimatePresence>

                        <div className="mt-6">
                            <button
                                onClick={handleAnalyze}
                                disabled={!hasContent || isAnalyzing}
                                className={cn(
                                    "w-full py-4 rounded-xl text-lg font-bold text-white transition-all transform shadow-lg",
                                    hasContent && !isAnalyzing
                                        ? "bg-blue-600 hover:bg-blue-700 hover:scale-[1.01] hover:shadow-blue-600/25"
                                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                )}
                            >
                                {isAnalyzing ? "Analyzing Document..." : "Explain This Document"}
                            </button>
                        </div>
                    </div>
                </Tabs>
            </div>

        </div>
    );
}
