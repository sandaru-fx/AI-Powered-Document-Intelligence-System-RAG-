"use client";

import { Sidebar } from "@/components/Sidebar";

export default function HelpPage() {
    return (
        <main className="flex h-screen bg-[#0a0a0c] overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl flex items-center justify-between px-8 z-10">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-semibold text-white tracking-tight">
                            Help & <span className="text-indigo-500">Support</span>
                        </h1>
                    </div>
                </header>

                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-3xl mx-auto grid gap-6">

                        <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                            <h2 className="text-xl font-semibold text-white mb-2">Getting Started</h2>
                            <p className="text-indigo-200/80 mb-4">Learn how to use the AI Document Intelligence system effectively.</p>
                            <button className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors">
                                View Documentation
                            </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                                <h3 className="text-lg font-medium text-white mb-2">Upload & Analyze</h3>
                                <p className="text-sm text-zinc-400">
                                    Upload PDF documents and ask questions to get instant, citation-backed answers.
                                </p>
                            </div>
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                                <h3 className="text-lg font-medium text-white mb-2">Smart Comparison</h3>
                                <p className="text-sm text-zinc-400">
                                    Select multiple documents to compare conflicting info or aggregate data across sources.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h3 className="text-lg font-medium text-white mb-4">Frequently Asked Questions</h3>
                            <div className="space-y-4">
                                <details className="group">
                                    <summary className="flex items-center justify-between w-full cursor-pointer text-left font-medium text-zinc-300 hover:text-white">
                                        <span>What file formats are supported?</span>
                                        <span className="transition-transform group-open:rotate-180">▼</span>
                                    </summary>
                                    <p className="mt-2 text-sm text-zinc-400">Currently, we support PDF files. We are working on adding support for DOCX and TXT files soon.</p>
                                </details>
                                <div className="h-[1px] bg-white/5" />
                                <details className="group">
                                    <summary className="flex items-center justify-between w-full cursor-pointer text-left font-medium text-zinc-300 hover:text-white">
                                        <span>How secure is my data?</span>
                                        <span className="transition-transform group-open:rotate-180">▼</span>
                                    </summary>
                                    <p className="mt-2 text-sm text-zinc-400">Your documents are processed securely and stored efficiently. We prioritize data privacy and do not share your data.</p>
                                </details>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </main>
    );
}
