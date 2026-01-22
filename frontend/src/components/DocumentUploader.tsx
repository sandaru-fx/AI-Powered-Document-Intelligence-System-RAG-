"use client";

import { Upload, X, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { FileUpload } from "./FileUpload";

export function DocumentUploader({ onUploadComplete }: { onUploadComplete: (filenames: string[]) => void }) {
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [isOpen, setIsOpen] = useState(false);

    const handleUpload = async (files: File[]) => {
        if (files.length === 0) return;
        setIsUploading(true);
        setStatus("idle");

        try {
            const response = await api.uploadDocs(files);
            const uploadedFilenames = response.filenames || [];
            setStatus("success");
            onUploadComplete(uploadedFilenames);
            setTimeout(() => {
                setIsOpen(false); // Close modal on success
                setStatus("idle");
            }, 1500);
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
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 dark:hover:bg-indigo-600 active:scale-95 transition-all text-sm"
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

                <FileUpload
                    onUpload={handleUpload}
                    isUploading={isUploading}
                />

                {status === "success" && (
                    <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm animate-in fade-in slide-in-from-bottom-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Knowledge base updated successfully!
                    </div>
                )}

                {status === "error" && (
                    <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm animate-in fade-in slide-in-from-bottom-2">
                        <AlertCircle className="w-5 h-5" />
                        Failed to process documents. Please check backend.
                    </div>
                )}
            </div>
        </div>
    );
}
