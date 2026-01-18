'use client';

import React from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { X } from 'lucide-react';

interface PDFViewerProps {
    url: string;
    onClose: () => void;
    initialPage?: number;
}

export default function PDFViewer({ url, onClose, initialPage }: PDFViewerProps) {
    const defaultLayoutPluginInstance = defaultLayoutPlugin();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-4xl h-full bg-slate-900 shadow-2xl border-l border-white/10 flex flex-col animate-in slide-in-from-right duration-500">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
                    <h3 className="text-white font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        Document Inspector
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Viewer Area */}
                <div className="flex-1 overflow-hidden">
                    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                        <Viewer
                            fileUrl={url}
                            plugins={[defaultLayoutPluginInstance]}
                            initialPage={initialPage ? initialPage - 1 : 0}
                        />
                    </Worker>
                </div>
            </div>
        </div>
    );
}
