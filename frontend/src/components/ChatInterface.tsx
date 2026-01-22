"use client";

import { Send, Bot, User, Loader2, FileText, ArrowRightLeft, AlertTriangle, BarChart3, History } from "lucide-react";
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Source {
    content: string;
    metadata: {
        source: string;
        page?: number;
        [key: string]: any;
    };
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    sources?: Source[];
}

export interface ChatInterfaceHandle {
    addMessage: (message: Message) => void;
    setLoading: (loading: boolean) => void;
}

interface ChatInterfaceProps {
    onSendMessage: (message: string) => void;
    onSourceClick?: (source: string, page?: number) => void;
    activeDocument?: string;
}

export const ChatInterface = forwardRef<ChatInterfaceHandle, ChatInterfaceProps>(
    ({ onSendMessage, onSourceClick, activeDocument }, ref) => {
        const [messages, setMessages] = useState<Message[]>([]);
        const [input, setInput] = useState("");
        const [isPending, setIsPending] = useState(false); // Internal state for pending status
        const [thinkingStep, setThinkingStep] = useState(0);
        const scrollRef = useRef<HTMLDivElement>(null);

        const thinkingSteps = [
            "Reading document...",
            "Extracting key insights...",
            "Formulating answer..."
        ];

        useEffect(() => {
            let interval: NodeJS.Timeout;
            if (isPending) {
                setThinkingStep(0);
                interval = setInterval(() => {
                    setThinkingStep(prev => (prev + 1) % thinkingSteps.length);
                }, 1500);
            }
            return () => clearInterval(interval);
        }, [isPending]);

        useEffect(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }, [messages, isPending, thinkingStep]);

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (!input.trim() || isPending) return;

            const userMsg: Message = { role: "user", content: input };
            setMessages(prev => [...prev, userMsg]);
            onSendMessage(input);
            setInput("");
        };

        useImperativeHandle(ref, () => ({
            addMessage: (message: Message) => {
                setMessages((prev) => [...prev, message]);
            },
            setLoading: (loading: boolean) => {
                setIsPending(loading);
            },
        }));

        return (
            <div className="flex flex-col h-full glass-morphism rounded-3xl overflow-hidden relative border border-gray-800">
                {/* Header */}
                <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full brand-gradient flex items-center justify-center">
                            <Bot className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Project Researcher</h3>
                            <span className="text-xs text-brand-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                                Gemini 1.5 Flash Active
                            </span>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth custom-scrollbar"
                >
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center p-8 overflow-y-auto">

                            {/* Hero Section */}
                            <div className="text-center space-y-4 mb-10">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto ring-1 ring-white/10">
                                    <Bot className="w-8 h-8 text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
                                        Research Assistant
                                    </h2>
                                    <p className="text-zinc-400 max-w-md mx-auto text-sm">
                                        I can help you analyze documents, compare contracts, and extract key insights instantly.
                                    </p>
                                </div>
                            </div>

                            <div className="w-full max-w-2xl space-y-8">

                                {/* Suggested Prompts */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        { label: "Summarize this document", icon: FileText, desc: "Get a quick executive summary" },
                                        { label: "Compare with previous version", icon: ArrowRightLeft, desc: "Highlight changes & conflicts" },
                                        { label: "Find key risk factors", icon: AlertTriangle, desc: "Identify potential legal risks" },
                                        { label: "Extract financial data", icon: BarChart3, desc: "Pull tables and figures" }
                                    ].map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                onSendMessage(item.label);
                                            }}
                                            className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-gray-800 hover:bg-white/10 hover:border-indigo-500/30 transition-all text-left group"
                                        >
                                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="block text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                                                    {item.label}
                                                </span>
                                                <span className="block text-xs text-zinc-500 mt-0.5">
                                                    {item.desc}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Recent Activity */}
                                <div className="pt-8 border-t border-gray-800">
                                    <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                                        <History className="w-4 h-4" />
                                        Recently Processed
                                    </h3>
                                    <div className="space-y-2">
                                        {[
                                            { name: "Q3_Financial_Report.pdf", time: "2 hours ago" },
                                            { name: "Employment_Contract_v2.pdf", time: "5 hours ago" },
                                            { name: "Project_Proposal_Draft.pdf", time: "1 day ago" }
                                        ].map((doc, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                                                    <span className="text-sm text-zinc-400 group-hover:text-zinc-200">{doc.name}</span>
                                                </div>
                                                <span className="text-xs text-zinc-600 font-mono">{doc.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}
                    <AnimatePresence initial={false}>
                        {messages.map((msg, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "flex gap-4 max-w-[85%]",
                                    msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                    msg.role === "user" ? "bg-zinc-800" : "brand-gradient"
                                )}>
                                    {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                </div>

                                <div className="space-y-2">
                                    <div className={cn(
                                        "p-4 rounded-2xl text-sm leading-relaxed",
                                        msg.role === "user"
                                            ? "bg-brand-600 text-white rounded-tr-none"
                                            : "bg-white/5 text-zinc-200 border border-gray-800 rounded-tl-none"
                                    )}>
                                        {msg.content}
                                    </div>

                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {msg.sources.map((source, sIdx) => (
                                                <button
                                                    key={sIdx}
                                                    onClick={() => onSourceClick?.(source.metadata.source, source.metadata.page)}
                                                    className="text-[10px] px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 transition-colors flex items-center gap-1 group"
                                                >
                                                    <span className="w-1 h-1 rounded-full bg-indigo-500 group-hover:animate-ping" />
                                                    {source.metadata.source} {source.metadata.page ? `(p. ${source.metadata.page})` : ''}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isPending && (
                        <div className="flex gap-4 items-center animate-pulse">
                            <div className="w-8 h-8 rounded-full brand-gradient flex items-center justify-center">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                                <span className="text-sm text-zinc-500">
                                    {thinkingSteps[thinkingStep]}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="p-6 bg-white/[0.01] border-t border-gray-800">
                    <form onSubmit={handleSubmit} className="flex gap-4 relative">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={activeDocument ? `Ask about '${activeDocument}'...` : "Type your question here..."}
                            className="flex-1 bg-white/5 border border-gray-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all pr-16"
                        />
                        <button
                            type="submit"
                            disabled={isPending}
                            className="absolute right-2 top-2 bottom-2 aspect-square brand-gradient rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-50"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                    <p className="text-[10px] text-zinc-600 text-center mt-3">
                        Powered by Gemini 1.5 Flash & Hybrid Search Ensemble
                    </p>
                </div>
            </div>
        );
    });
