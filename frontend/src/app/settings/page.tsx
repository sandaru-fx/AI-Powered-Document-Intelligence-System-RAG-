"use client";

import { Sidebar } from "@/components/Sidebar";

export default function SettingsPage() {
    return (
        <main className="flex h-screen bg-[#0a0a0c] overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl flex items-center justify-between px-8 z-10">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-semibold text-white tracking-tight">
                            System <span className="text-indigo-500">Settings</span>
                        </h1>
                    </div>
                </header>

                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-2xl mx-auto space-y-6">

                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h3 className="text-lg font-medium text-white mb-4">Appearance</h3>
                            <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                                <div>
                                    <p className="text-sm font-medium text-white">Dark Mode</p>
                                    <p className="text-xs text-zinc-500">Use dark theme across the application</p>
                                </div>
                                <div className="w-10 h-6 bg-indigo-500 rounded-full relative cursor-pointer">
                                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h3 className="text-lg font-medium text-white mb-4">API Configuration</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">OpenAI API Key</label>
                                    <input
                                        type="password"
                                        value="sk-........................"
                                        disabled
                                        className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-4 py-2 text-sm text-zinc-500 focus:outline-none focus:border-indigo-500/50"
                                    />
                                    <p className="text-xs text-zinc-600 mt-1">Managed via environment variables</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h3 className="text-lg font-medium text-white mb-4">Account</h3>
                            <button className="text-sm text-red-400 hover:text-red-300 transition-colors">
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
