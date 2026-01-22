"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle({ collapsed }: { collapsed?: boolean }) {
    const { theme, setTheme } = useTheme();

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(
                "w-full flex items-center gap-4 p-3 rounded-xl transition-all text-zinc-500 hover:bg-white/5 hover:text-indigo-400 group",
                collapsed ? "justify-center" : ""
            )}
            title="Toggle Theme"
        >
            <div className="relative w-5 h-5 shrink-0">
                <Sun className="absolute w-5 h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute w-5 h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </div>
            {!collapsed && <span className="font-medium">Toggle Theme</span>}
        </button>
    );
}
