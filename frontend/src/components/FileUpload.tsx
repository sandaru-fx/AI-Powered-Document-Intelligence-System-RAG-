"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
    onUpload: (files: File[]) => void;
    isUploading: boolean;
    maxFiles?: number;
    maxSize?: number; // in bytes
}

export function FileUpload({ onUpload, isUploading, maxFiles = 5, maxSize = 10 * 1024 * 1024 }: FileUploadProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
        setError(null);

        if (rejectedFiles.length > 0) {
            const rejection = rejectedFiles[0];
            if (rejection.errors[0].code === 'file-too-large') {
                setError(`File is too large. Max size is ${maxSize / 1024 / 1024}MB.`);
            } else if (rejection.errors[0].code === 'file-invalid-type') {
                setError("Only PDF files are allowed.");
            } else {
                setError("Invalid file.");
            }
            return;
        }

        setFiles(prev => {
            const newFiles = [...prev, ...acceptedFiles];
            // Simple deduplication by name
            const uniqueFiles = newFiles.filter((file, index, self) =>
                index === self.findIndex((f) => f.name === file.name)
            );
            return uniqueFiles.slice(0, maxFiles);
        });
    }, [maxFiles, maxSize]);

    const removeFile = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf']
        },
        maxSize,
        multiple: true,
        disabled: isUploading
    });

    return (
        <div className="w-full space-y-6">
            <div
                {...getRootProps()}
                className={cn(
                    "relative group border-2 border-dashed rounded-2xl p-10 transition-all duration-300 ease-in-out cursor-pointer overflow-hidden",
                    isDragActive
                        ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 scale-[1.02] shadow-xl shadow-indigo-500/10"
                        : "border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:bg-gray-50/50 dark:hover:bg-white/5",
                    error && "border-red-500/50 bg-red-50/50 dark:bg-red-900/10"
                )}
            >
                <input {...getInputProps()} />

                <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-4">
                    <div className={cn(
                        "p-4 rounded-full bg-white dark:bg-white/5 shadow-lg shadow-black/5 ring-1 ring-black/5 transition-transform duration-300",
                        isDragActive ? "scale-110 ring-indigo-500/50" : "group-hover:scale-105"
                    )}>
                        <UploadCloud className={cn(
                            "w-8 h-8 transition-colors duration-300",
                            isDragActive ? "text-indigo-600 dark:text-indigo-400 animate-bounce" : "text-gray-400 group-hover:text-indigo-500"
                        )} />
                    </div>

                    <div className="space-y-1">
                        <p className={cn(
                            "text-lg font-semibold transition-colors duration-300",
                            isDragActive ? "text-indigo-700 dark:text-indigo-300" : "text-foreground"
                        )}>
                            {isDragActive ? "Drop files here" : "Click to browse or drag & drop"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            PDF files only (max {maxSize / 1024 / 1024}MB)
                        </p>
                    </div>
                </div>

                {/* Success Ring Animation on Drag */}
                {isDragActive && (
                    <div className="absolute inset-0 rounded-2xl ring-4 ring-indigo-500/20 animate-pulse" />
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20 rounded-lg animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-2">
                        {files.map((file, idx) => (
                            <div
                                key={`${file.name}-${idx}`}
                                className="group flex items-center justify-between p-3 bg-white dark:bg-card-bg border border-gray-100 dark:border-card-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => removeFile(e, idx)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    disabled={isUploading}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => onUpload(files)}
                        disabled={isUploading}
                        className="w-full relative overflow-hidden group brand-gradient text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:opacity-95 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        {isUploading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span className="animate-pulse">Analyzing...</span>
                            </>
                        ) : (
                            <>
                                <span className="relative z-10 flex items-center gap-2">
                                    Start Analysis <CheckCircle className="w-4 h-4" />
                                </span>
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            </>
                        )}
                    </button>

                    <p className="text-center text-xs text-muted-foreground">
                        {files.length} file{files.length !== 1 ? 's' : ''} ready to process
                    </p>
                </div>
            )}
        </div>
    );
}
