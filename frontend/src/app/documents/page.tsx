"use client";

import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";

export default function DocumentsPage() {
    return (
        <main className="flex h-screen bg-[#0a0a0c] overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl flex items-center justify-between px-8 z-10">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-semibold text-white tracking-tight">
                            My <span className="text-indigo-500">Documents</span>
                        </h1>
                    </div>
                </header>

                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-4xl mx-auto">
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                            <h2 className="text-lg font-medium text-white mb-2">Manage your Knowledge Base</h2>
                            <p className="text-zinc-400 mb-6">View and manage all your uploaded documents here.</p>

                            {/* Placeholder for document list */}
                            <div className="grid gap-4">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                            <span className="text-indigo-400">PDF</span>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-white font-medium">Research_Paper_v1.pdf</p>
                                            <p className="text-xs text-zinc-500">Uploaded 2 days ago</p>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                                        View
                                    </button>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                            <span className="text-indigo-400">PDF</span>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-white font-medium">Q4_Financials.pdf</p>
                                            <p className="text-xs text-zinc-500">Uploaded 5 days ago</p>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                                        View
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
