"use client";

import { LayoutDashboard, FileText, Settings, HelpCircle, ChevronLeft, ChevronRight, LogOut, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { user, signOut } = useAuth();
    const pathname = usePathname();

    const menuItems = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/" },
        { icon: FileText, label: "Documents", href: "/documents" },
        { icon: Settings, label: "Settings", href: "/settings" },
        { icon: HelpCircle, label: "Help", href: "/help" },
    ];

    return (
        <aside
            className={cn(
                "flex flex-col h-screen glass-morphism border-r border-white/10 transition-all duration-300 z-50",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            <div className="p-6 flex items-center gap-3">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center shrink-0 transition-transform duration-300"
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-5 h-5 text-white" />
                    ) : (
                        <ChevronLeft className="w-5 h-5 text-white" />
                    )}
                </button>
                {!isCollapsed && (
                    <span className="font-bold text-lg tracking-tight text-gradient">AIDoc Intel</span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-8 space-y-2">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                    : "text-zinc-500 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 shrink-0 transition-transform", isActive ? "text-indigo-400" : "group-hover:scale-110")} />
                            {!isCollapsed && <span className="font-medium">{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* User & Logout */}
            <div className="p-4 border-t border-white/10 space-y-2">
                {!isCollapsed && user && (
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl mb-2 text-xs">
                        <div className="w-8 h-8 rounded-full brand-gradient flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="truncate">
                            <p className="text-white font-medium truncate">{user.email?.split('@')[0]}</p>
                            <p className="text-zinc-500 truncate">{user.email}</p>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => signOut()}
                    className={cn(
                        "w-full flex items-center gap-4 p-3 rounded-xl transition-all text-zinc-500 hover:bg-red-500/10 hover:text-red-400 group",
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
