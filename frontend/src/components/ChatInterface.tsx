"use client";

import { Send, Bot, User, Loader2, FileText } from "lucide-react";
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
    role: "user" | "assistant";
    content: string;
    sources?: any[];
}

export interface ChatInterfaceHandle {
    addResponse: (content: string, sources: any[]) => void;
}

interface ChatInterfaceProps {
    onSendMessage: (q: string) => void;
    isPending: boolean;
}

export const ChatInterface = forwardRef<ChatInterfaceHandle, ChatInterfaceProps>(
    ({ onSendMessage, isPending }, ref) => {
        const [messages, setMessages] = useState<Message[]>([]);
        const [input, setInput] = useState("");
        const scrollRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }, [messages, isPending]);

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (!input.trim() || isPending) return;

            const userMsg: Message = { role: "user", content: input };
            setMessages(prev => [...prev, userMsg]);
            onSendMessage(input);
            setInput("");
        };

        useImperativeHandle(ref, () => ({
            addResponse(content: string, sources?: any[]) {
                setMessages(prev => [...prev, { role: "assistant", content, sources }]);
            }
        }));

        return (
            <div className="flex flex-col h-full glass-morphism rounded-3xl overflow-hidden relative border border-white/10">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
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
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                                <FileText className="w-10 h-10 text-zinc-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-zinc-300">Intelligent Document Analysis</h2>
                            <p className="text-zinc-500 max-w-sm">
                                Upload your technical documents and ask complex questions. I'll search and summarize across your library.
                            </p>
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
                                            : "bg-white/5 text-zinc-200 border border-white/5 rounded-tl-none"
                                    )}>
                                        {msg.content}
                                    </div>

                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {msg.sources.slice(0, 3).map((src: any, idx: number) => (
                                                <span key={idx} className="text-[10px] px-2 py-1 rounded bg-white/5 text-zinc-400 border border-white/10 flex items-center gap-1">
                                                    <FileText className="w-3 h-3" />
                                                    {src.metadata.source} (p. {src.metadata.page || 1})
                                                </span>
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
                                <span className="text-sm text-zinc-500">Thinking...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="p-6 bg-white/[0.01] border-t border-white/10">
                    <form onSubmit={handleSubmit} className="flex gap-4 relative">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your question here..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-brand-500/50 transition-all pr-16"
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
