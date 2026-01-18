"use client";

import { Upload, FileText, X, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export function DocumentUploader({ onUploadComplete }: { onUploadComplete: (filenames: string[]) => void }) {
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === "application/pdf");
        setFiles(prev => [...prev, ...droppedFiles]);
        setStatus("idle");
    }, []);

    const handleUpload = async () => {
        if (files.length === 0) return;
        setIsUploading(true);
        setStatus("idle");

        try {
            const response = await api.uploadDocs(files);
            const uploadedFilenames = response.filenames || [];
            setStatus("success");
            setFiles([]);
            onUploadComplete(uploadedFilenames);
        } catch (err) {
            console.error(err);
            setStatus("error");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="glass-morphism rounded-3xl p-8 border border-white/10 space-y-6">
            <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Knowledge Library</h3>
                <p className="text-zinc-500 text-sm">Upload technical PDFs to expand the AI's intelligence.</p>
            </div>

            <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className={cn(
                    "border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer",
                    files.length > 0 ? "border-brand-500/50 bg-brand-500/5" : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
                )}
            >
                <div className="w-16 h-16 rounded-full brand-gradient flex items-center justify-center mb-4 shadow-lg shadow-brand-500/20">
                    <Upload className="text-white w-8 h-8" />
                </div>
                <p className="text-zinc-300 font-medium">Drag & Drop Documents</p>
                <p className="text-zinc-500 text-xs mt-1">Only high-quality PDFs supported</p>
            </div>

            {files.length > 0 && (
                <div className="space-y-3">
                    {files.map((file, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-brand-400" />
                                <span className="text-sm text-zinc-300 truncate max-w-[180px]">{file.name}</span>
                            </div>
                            <button
                                onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                                className="text-zinc-500 hover:text-white transition-colors"
                                disabled={isUploading}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="w-full brand-gradient text-white py-3 rounded-xl font-bold shadow-lg shadow-brand-500/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {isUploading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing Knowledge...
                            </>
                        ) : "Analyze Documents"}
                    </button>
                </div>
            )}

            {status === "success" && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    Knowledge base updated successfully!
                </div>
            )}

            {status === "error" && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="w-5 h-5" />
                    Failed to process documents. Please check backend.
                </div>
            )}
        </div>
    );
}
