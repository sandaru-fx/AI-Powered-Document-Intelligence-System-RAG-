"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Bot, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push("/");
        }
    };

    const handleSignUp = async () => {
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            setError(error.message);
        } else {
            setError("Please check your email for the confirmation link.");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <div className="w-full max-w-md space-y-8 glass-morphism p-8 rounded-3xl border border-white/10 relative overflow-hidden group">
                {/* Glow Effect */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl group-hover:bg-brand-500/30 transition-all duration-500" />

                <div className="relative space-y-4 text-center">
                    <div className="w-16 h-16 rounded-2xl brand-gradient flex items-center justify-center mx-auto shadow-lg shadow-brand-500/20">
                        <Bot className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gradient">Welcome Researcher</h1>
                    <p className="text-zinc-500 text-sm">Securely access your document intelligence laboratory.</p>
                </div>

                <form onSubmit={handleLogin} className="relative space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-white focus:outline-none focus:border-brand-500/50 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-white focus:outline-none focus:border-brand-500/50 transition-all"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full brand-gradient text-white py-4 rounded-2xl font-bold shadow-lg shadow-brand-500/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Connect Laboratory
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={handleSignUp}
                            disabled={loading}
                            className="w-full bg-white/5 text-zinc-300 py-4 rounded-2xl font-medium border border-white/10 hover:bg-white/10 transition-all"
                        >
                            Initialize New Account
                        </button>
                    </div>
                </form>

                <p className="text-[10px] text-zinc-600 text-center relative">
                    By initializing, you agree to our Research Protocol & Data Privacy Standards.
                </p>
            </div>
        </div>
    );
}
