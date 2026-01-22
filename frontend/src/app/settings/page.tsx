"use client";

import { Sidebar } from "@/components/Sidebar";
import { Lock, Eye, EyeOff, Shield, Palette, User, Trash2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("security");
    const [showApiKey, setShowApiKey] = useState(false);

    const tabs = [
        { id: "appearance", label: "Appearance", icon: Palette },
        { id: "security", label: "Security & API", icon: Shield },
        { id: "account", label: "Account", icon: User },
    ];

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

                <div className="flex-1 overflow-hidden flex">
                    {/* Settings Sidebar */}
                    <div className="w-64 border-r border-white/5 bg-white/[0.01] p-6 hidden md:block">
                        <nav className="space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                        activeTab === tab.id
                                            ? "bg-indigo-500/10 text-indigo-400"
                                            : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                                    )}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Settings Content */}
                    <div className="flex-1 p-8 overflow-y-auto">
                        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* Appearance Tab */}
                            {activeTab === "appearance" && (
                                <div className="space-y-6">
                                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                            <Palette className="w-5 h-5 text-indigo-400" />
                                            Theme Preferences
                                        </h3>
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
                                </div>
                            )}

                            {/* Security Tab */}
                            {activeTab === "security" && (
                                <div className="space-y-6">
                                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                        <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-indigo-400" />
                                            API Configuration
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">OpenAI API Key</label>
                                                <div className="relative group">
                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors">
                                                        <Lock className="w-4 h-4" />
                                                    </div>
                                                    <input
                                                        type={showApiKey ? "text" : "password"}
                                                        value="sk-proj-........................"
                                                        disabled
                                                        className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all cursor-not-allowed opacity-75"
                                                    />
                                                    <button
                                                        onClick={() => setShowApiKey(!showApiKey)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                                    >
                                                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                                <p className="text-xs text-zinc-600 mt-2 flex items-center gap-1.5">
                                                    <Shield className="w-3 h-3" />
                                                    Security Note: This key is managed securely via environment variables.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Account Tab */}
                            {activeTab === "account" && (
                                <div className="space-y-6">
                                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                            <User className="w-5 h-5 text-indigo-400" />
                                            Profile Settings
                                        </h3>
                                        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                                JD
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">John Doe</p>
                                                <p className="text-sm text-zinc-500">john.doe@example.com</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Danger Zone */}
                                    <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
                                        <h3 className="text-lg font-medium text-red-500 mb-2 flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5" />
                                            Danger Zone
                                        </h3>
                                        <p className="text-sm text-red-400/60 mb-6">
                                            Permanently delete your account and all associated data. This action cannot be undone.
                                        </p>
                                        <button className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 hover:text-red-300 transition-all flex items-center gap-2">
                                            <Trash2 className="w-4 h-4" />
                                            Delete Account
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
