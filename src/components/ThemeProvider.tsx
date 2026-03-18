"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const ThemeContext = createContext<{
    theme: Theme;
    resolved: "light" | "dark";
    setTheme: (t: Theme) => void;
}>({ theme: "system", resolved: "light", setTheme: () => { } });

export function useTheme() {
    return useContext(ThemeContext);
}

function getSystemTheme(): "light" | "dark" {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("system");
    const [resolved, setResolved] = useState<"light" | "dark">("light");

    // Initialize from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem("vedawell-theme") as Theme | null;
        const t = stored && ["light", "dark", "system"].includes(stored) ? stored : "system";
        setThemeState(t);
        applyTheme(t);
    }, []);

    // Listen for system preference changes
    useEffect(() => {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = () => {
            if (theme === "system") applyTheme("system");
        };
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, [theme]);

    function applyTheme(t: Theme) {
        const r = t === "system" ? getSystemTheme() : t;
        setResolved(r);
        document.documentElement.classList.toggle("dark", r === "dark");
    }

    function setTheme(t: Theme) {
        setThemeState(t);
        localStorage.setItem("vedawell-theme", t);
        applyTheme(t);
    }

    return (
        <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
