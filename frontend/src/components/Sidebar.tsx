"use client";

import { Home, History, Upload, Settings, LogOut, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const menuItems = [
    { icon: Home, label: "Researcher", active: true },
    { icon: History, label: "History" },
    { icon: Upload, label: "Documents" },
    { icon: Settings, label: "Settings" },
];

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <aside
            className={cn(
                "flex flex-col h-screen glass-morphism border-r border-white/10 transition-all duration-300 z-50",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center shrink-0">
                    <ChevronRight className="w-5 h-5 text-white" />
                </div>
                {!isCollapsed && (
                    <span className="font-bold text-lg tracking-tight text-gradient">AIDoc Intel</span>
                )}
            </div>

            <nav className="flex-1 px-4 py-8 space-y-2">
                {menuItems.map((item) => (
                    <button
                        key={item.label}
                        className={cn(
                            "flex items-center gap-4 w-full p-3 rounded-xl transition-all group duration-200",
                            item.active
                                ? "bg-brand-600/20 text-brand-400 border border-brand-500/20"
                                : "text-zinc-500 hover:bg-white/5 hover:text-white"
                        )}
                    >
                        <item.icon className={cn("w-5 h-5 shrink-0", !item.active && "group-hover:scale-110 transition-transform")} />
                        {!isCollapsed && <span className="font-medium">{item.label}</span>}
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-white/10">
                <button className="flex items-center gap-4 w-full p-3 rounded-xl text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-all">
                    <LogOut className="w-5 h-5 shrink-0" />
                    {!isCollapsed && <span className="font-medium">Logout</span>}
                </button>
            </div>
        </aside>
    );
}
