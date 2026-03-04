"use client";

import { LayoutDashboard, FileText, Settings, HelpCircle, ChevronLeft, ChevronRight, LogOut, MessageSquare, Plus, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { api } from "@/lib/api";

interface SidebarProps {
    activeSessionId?: string;
    onResetSession?: () => void;
}

interface ChatSession {
    id: string;
    title: string;
    created_at: string;
}

export function Sidebar({ activeSessionId, onResetSession }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(true);
    const { user, signOut } = useAuth();
    const pathname = usePathname();

    const fetchSessions = async () => {
        if (!user) return;
        try {
            setSessionsLoading(true);
            const data = await api.getSessions();
            setSessions(data || []);
        } catch (error) {
            console.error("Failed to fetch sessions", error);
        } finally {
            setSessionsLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, [user, activeSessionId]); // Re-fetch on active session change to get title updates

    const menuItems = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/" },
        { icon: FileText, label: "Documents", href: "/documents" },
        { icon: Settings, label: "Settings", href: "/settings" },
        { icon: HelpCircle, label: "Help", href: "/help" },
    ];

    return (
        <aside
            className={cn(
                "flex flex-col h-screen bg-sidebar-bg border-r border-card-border transition-all duration-300 z-50",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            <div className="p-6 flex items-center gap-3">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center shrink-0 transition-transform duration-300 shadow-md hover:shadow-lg hover:scale-105"
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-5 h-5 text-white" />
                    ) : (
                        <ChevronLeft className="w-5 h-5 text-white" />
                    )}
                </button>
                {!isCollapsed && (
                    <span className="font-bold text-lg tracking-tight text-foreground">AIDoc Intel</span>
                )}
            </div>

            {/* Navigation */}
            <nav className="px-4 py-4 space-y-1">
                {!isCollapsed && onResetSession && (
                    <button
                        onClick={onResetSession}
                        className="w-full mb-4 flex items-center gap-3 p-3 rounded-xl brand-gradient text-white font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                    >
                        <Plus className="w-5 h-5" />
                        New Research
                    </button>
                )}

                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group font-medium",
                                isActive
                                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-500/20"
                                    : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 shrink-0 transition-transform",
                                isActive ? "text-indigo-700 dark:text-indigo-400" : "group-hover:scale-110"
                            )} />
                            {!isCollapsed && (
                                <span className={cn(
                                    isActive ? "font-bold" : ""
                                )}>
                                    {item.label}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {!isCollapsed && (
                <div className="flex-1 px-4 py-4 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-3 px-2">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" />
                            Recent Chats
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                        {sessionsLoading && sessions.length === 0 ? (
                            <div className="p-4 text-center">
                                <span className="text-xs text-muted-foreground animate-pulse">Scanning archives...</span>
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="p-4 text-center border border-dashed border-card-border rounded-xl">
                                <p className="text-[10px] text-muted-foreground">No recent research found.</p>
                            </div>
                        ) : (
                            sessions.map((session) => (
                                <Link
                                    key={session.id}
                                    href={`/?session=${session.id}`}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-sm group",
                                        activeSessionId === session.id
                                            ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-inset ring-indigo-500/20"
                                            : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
                                    )}
                                >
                                    <MessageSquare className={cn(
                                        "w-4 h-4 shrink-0",
                                        activeSessionId === session.id ? "text-indigo-500" : "text-muted-foreground/50 group-hover:text-foreground"
                                    )} />
                                    <span className="truncate font-medium">{session.title || "Untitled Scan"}</span>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* User & Logout */}
            <div className="p-4 border-t border-card-border space-y-2">
                {!isCollapsed && user && (
                    <div className="flex items-center gap-3 p-3 bg-black/5 dark:bg-white/5 rounded-xl mb-2 text-xs">
                        <div className="w-8 h-8 rounded-full brand-gradient flex items-center justify-center text-white font-bold shadow-sm">
                            {user.email?.[0].toUpperCase()}
                        </div>
                        <div className="truncate">
                            <p className="text-foreground font-medium truncate">{user.email?.split('@')[0]}</p>
                            <p className="text-muted-foreground truncate">{user.email}</p>
                        </div>
                    </div>
                )}

                <ThemeToggle collapsed={isCollapsed} />

                <button
                    onClick={() => signOut()}
                    className={cn(
                        "w-full flex items-center gap-4 p-3 rounded-xl transition-all text-muted-foreground hover:bg-red-500/10 hover:text-red-500 group",
                        isCollapsed ? "justify-center" : ""
                    )}
                >
                    <LogOut className="w-5 h-5 shrink-0" />
                    {!isCollapsed && <span className="font-medium">Logout</span>}
                </button>
            </div>
        </aside>
    );
}
