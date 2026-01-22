"use client";

import { Upload, FileText, X, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export function DocumentUploader({ onUploadComplete }: { onUploadComplete: (filenames: string[]) => void }) {
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

    const [isOpen, setIsOpen] = useState(false);

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
            setTimeout(() => {
                setIsOpen(false); // Close modal on success
                setStatus("idle");
            }, 1000);
        } catch (err) {
            console.error(err);
            setStatus("error");
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all"
            >
                <Upload className="w-4 h-4" />
                Upload PDF
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card-bg rounded-3xl p-8 border border-card-border shadow-2xl space-y-6 w-full max-w-lg relative animate-in zoom-in-95 duration-200 mx-4">

                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center">
                    <h3 className="text-xl font-bold text-foreground mb-2">Knowledge Library</h3>
                    <p className="text-muted-foreground text-sm">Upload technical PDFs to expand the AI's intelligence.</p>
                </div>

                <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDrop}
                    className={cn(
                        "border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer",
                        files.length > 0
                            ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10"
                            : "border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5"
                    )}
                >
                    <div className="w-16 h-16 rounded-full brand-gradient flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                        <Upload className="text-white w-8 h-8" />
                    </div>
                    <p className="text-foreground font-medium">Drag & Drop Documents</p>
                    <p className="text-muted-foreground text-xs mt-1">Only high-quality PDFs supported</p>
                </div>

                {files.length > 0 && (
                    <div className="space-y-3">
                        {files.map((file, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-indigo-500" />
                                    <span className="text-sm text-foreground truncate max-w-[180px]">{file.name}</span>
                                </div>
                                <button
                                    onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                                    className="text-muted-foreground hover:text-red-500 transition-colors"
                                    disabled={isUploading}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                        <button
                            onClick={handleUpload}
                            disabled={isUploading}
                            className="w-full brand-gradient text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
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
                    <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm">
                        <CheckCircle2 className="w-5 h-5" />
                        Knowledge base updated successfully!
                    </div>
                )}

                {status === "error" && (
                    <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                        <AlertCircle className="w-5 h-5" />
                        Failed to process documents. Please check backend.
                    </div>
                )}
            </div>
        </div>
    );
}
