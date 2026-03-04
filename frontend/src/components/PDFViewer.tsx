'use client';

import React, { useEffect, useRef } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { X } from 'lucide-react';

interface PDFViewerProps {
    url: string;
    onClose: () => void;
    initialPage?: number;
    isInline?: boolean;
}

export default function PDFViewer({ url, onClose, initialPage, isInline = false }: PDFViewerProps) {
    const defaultLayoutPluginInstance = defaultLayoutPlugin();
    const pageNavigationPluginInstance = pageNavigationPlugin();
    const { jumpToPage } = pageNavigationPluginInstance;

    // Track whether it's the initial render so we don't double-jump on mount
    const isFirstRender = useRef(true);

    // Imperatively jump to the target page whenever `initialPage` changes
    useEffect(() => {
        if (isFirstRender.current) {
            // On the first render the Viewer handles initialPage itself
            isFirstRender.current = false;
            return;
        }
        if (initialPage && initialPage > 0) {
            // Viewer uses 0-indexed pages internally; our prop is 1-indexed
            jumpToPage(initialPage - 1);
        }
    }, [initialPage]);

    const containerClasses = isInline
        ? "w-full h-full bg-background border-l border-card-border flex flex-col"
        : "fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-300";

    const innerClasses = isInline
        ? "w-full h-full flex flex-col"
        : "w-full max-w-4xl h-full bg-background shadow-2xl border-l border-card-border flex flex-col animate-in slide-in-from-right duration-500";

    return (
        <div className={containerClasses}>
            <div className={innerClasses}>
                {/* Header */}
                <div className="p-4 border-b border-card-border flex items-center justify-between bg-background">
                    <h3 className="text-foreground font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        Document Inspector
                        {initialPage && (
                            <span className="ml-2 text-xs font-normal text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                                Page {initialPage}
                            </span>
                        )}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                        title={isInline ? "Close Panel" : "Close Mode"}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Viewer Area */}
                <div className="flex-1 overflow-hidden relative">
                    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                        <Viewer
                            fileUrl={url}
                            plugins={[defaultLayoutPluginInstance, pageNavigationPluginInstance]}
                            initialPage={initialPage ? initialPage - 1 : 0}
                        />
                    </Worker>
                </div>
            </div>
        </div>
    );
}
