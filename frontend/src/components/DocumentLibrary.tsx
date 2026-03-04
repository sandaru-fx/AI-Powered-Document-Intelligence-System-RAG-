"use client";

import { X, FileText, CheckCircle2, Search, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface Document {
    id: string;
    filename: string;
    size_bytes: number;
    created_at: string;
}

interface DocumentLibraryProps {
    onClose: () => void;
    onCompare: (filenames: string[]) => void;
    maxSelection?: number;
}

export function DocumentLibrary({ onClose, onCompare, maxSelection = 2 }: DocumentLibraryProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchDocs = async () => {
            try {
                setLoading(true);
                const data = await api.getDocuments();
                setDocuments(data || []);
            } catch (error) {
                console.error("Failed to fetch library", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDocs();
    }, []);

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(i => i !== id);
            }
            if (prev.length < maxSelection) {
                return [...prev, id];
            }
            return prev;
        });
    };

    const handleCompare = () => {
        const selectedFilenames = documents
            .filter(doc => selectedIds.includes(doc.id))
            .map(doc => doc.filename);
        onCompare(selectedFilenames);
    };

    const filteredDocs = documents.filter(doc =>
        doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatSize = (bytes: number) => {
        if (!bytes) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-card-bg rounded-[2rem] border border-card-border shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 mx-4">

                {/* Header */}
                <div className="p-8 border-b border-card-border flex items-center justify-between bg-card-bg/50 backdrop-blur-md">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl brand-gradient flex items-center justify-center shadow-lg">
                                <FileText className="text-white w-6 h-6" />
                            </span>
                            Document Archives
                        </h2>
                        <p className="text-muted-foreground text-sm mt-1">Select up to {maxSelection} documents for side-by-side analysis.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-8 py-4 bg-black/5 dark:bg-white/5 border-b border-card-border flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Locate specific research..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-background border border-card-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                        />
                    </div>
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-500 rounded-xl text-xs font-bold border border-indigo-500/20 animate-in slide-in-from-right-2">
                            {selectedIds.length}/{maxSelection} Selected
                        </div>
                    )}
                </div>

                {/* Document List */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
                            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm font-medium animate-pulse">Scanning archives...</p>
                        </div>
                    ) : filteredDocs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                                <Search className="w-8 h-8 text-muted-foreground/40" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">No matches found</h3>
                                <p className="text-sm text-muted-foreground mt-1 text-center">We couldn't find any documents matching your search.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredDocs.map((doc) => {
                                const isSelected = selectedIds.includes(doc.id);
                                return (
                                    <div
                                        key={doc.id}
                                        onClick={() => toggleSelection(doc.id)}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.02] active:scale-[0.98]",
                                            isSelected
                                                ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 shadow-md ring-1 ring-indigo-500/20"
                                                : "bg-card-bg border-card-border hover:border-indigo-500/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                                                isSelected ? "brand-gradient text-white" : "bg-black/5 dark:bg-white/5 text-muted-foreground group-hover:bg-indigo-500/10 group-hover:text-indigo-500"
                                            )}>
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className={cn(
                                                    "font-semibold text-sm truncate",
                                                    isSelected ? "text-indigo-700 dark:text-indigo-300" : "text-foreground"
                                                )}>{doc.filename}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{formatSize(doc.size_bytes)}</span>
                                                    <span className="w-1 h-1 rounded-full bg-muted-foreground opacity-30" />
                                                    <span className="text-[10px] font-mono text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                            isSelected
                                                ? "bg-indigo-500 border-indigo-500 text-white"
                                                : "border-card-border text-transparent"
                                        )}>
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-card-border bg-card-bg/50 backdrop-blur-md flex items-center justify-between">
                    <div className="flex items-center gap-3 text-muted-foreground text-xs font-medium">
                        <Info className="w-4 h-4 text-indigo-500" />
                        Selected documents will be compared using Gemini 1.5 Flash.
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl border border-card-border text-foreground font-semibold hover:bg-black/5 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCompare}
                            disabled={selectedIds.length < 2}
                            className="px-8 py-2.5 rounded-xl brand-gradient text-white font-bold shadow-lg shadow-indigo-500/25 disabled:grayscale disabled:opacity-50 disabled:shadow-none hover:scale-105 active:scale-95 transition-all min-w-[180px]"
                        >
                            Analyze Comparison
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

