"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shield, Home, Menu, X, Wrench, Gamepad2, BookOpen, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

const navLinks = [
    { href: "/tools", label: "Tools", icon: Wrench },
    { href: "/games", label: "Games", icon: Gamepad2 },
    { href: "/blog", label: "Blog", icon: BookOpen },
    { href: "/panchang", label: "Panchang", icon: Sun },
];

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [user, setUser] = useState<{ email?: string; full_name?: string } | null>(null);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();

    const cycleTheme = () => {
        const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
        setTheme(next);
    };
    const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }: { data: { user: any } }) => {
            if (data.user) {
                setUser({ email: data.user.email, full_name: data.user.user_metadata?.full_name });
            }
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
            if (session?.user) {
                setUser({ email: session.user.email, full_name: session.user.user_metadata?.full_name });
            } else {
                setUser(null);
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    const userInitial = user?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U";

    return (
        <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-card/95 backdrop-blur-xl shadow-lg border-b border-border" : "bg-card/80 backdrop-blur-md border-b border-border/50"}`}>
            <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                        <Home className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col justify-center ml-1">
                        <span className="text-xl font-bold tracking-tight leading-none text-foreground">
                            Home<span className="text-primary">Guardian</span>
                        </span>
                        <span className="text-[9px] font-semibold text-muted-foreground tracking-[0.1em] uppercase mt-0.5">
                            By VedaWell
                        </span>
                    </div>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-1">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive(link.href)
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted hover:text-foreground hover:bg-primary/5"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {link.label}
                            </Link>
                        );
                    })}

                    {/* Theme Toggle */}
                    <button
                        onClick={cycleTheme}
                        className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-primary/5 transition-colors"
                        aria-label={`Theme: ${theme}. Click to change.`}
                        title={`Theme: ${theme}`}
                    >
                        <ThemeIcon className="w-4 h-4" />
                    </button>

                    {/* Separator */}
                    <div className="w-px h-6 bg-border mx-2" />

                    {/* Guardian CTA Button — the star */}
                    {user ? (
                        <Link
                            href="/guardian/dashboard"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-teal-500 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
                        >
                            <Shield className="w-4 h-4" />
                            Guardian Dashboard
                        </Link>
                    ) : (
                        <Link
                            href="/guardian"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary to-teal-500 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] transition-all animate-subtle-glow"
                        >
                            <Shield className="w-4 h-4" />
                            Get Guardian
                        </Link>
                    )}
                </div>

                {/* Mobile Hamburger */}
                <button
                    className="md:hidden p-2 rounded-lg hover:bg-primary/5 transition-colors"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                >
                    {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-border bg-card px-6 py-4 space-y-1 animate-slide-down">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-3 py-3 px-3 rounded-lg transition-colors ${isActive(link.href)
                                    ? "bg-primary/10 text-primary font-semibold"
                                    : "text-muted hover:text-foreground hover:bg-primary/5"
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {link.label}
                            </Link>
                        );
                    })}

                    {/* Mobile Theme Toggle */}
                    <button
                        onClick={cycleTheme}
                        className="flex items-center gap-3 py-3 px-3 rounded-lg text-muted hover:text-foreground hover:bg-primary/5 transition-colors w-full"
                    >
                        <ThemeIcon className="w-5 h-5" />
                        {theme === "light" ? "Light Mode" : theme === "dark" ? "Dark Mode" : "System Theme"}
                    </button>

                    <div className="pt-3 border-t border-border">
                        {user ? (
                            <Link
                                href="/guardian/dashboard"
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-gradient-to-r from-primary to-teal-500 text-white font-semibold shadow-md"
                            >
                                <Shield className="w-5 h-5" />
                                Guardian Dashboard
                            </Link>
                        ) : (
                            <Link
                                href="/guardian"
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-gradient-to-r from-primary to-teal-500 text-white font-semibold shadow-md"
                            >
                                <Shield className="w-5 h-5" />
                                Get HomeOwner Guardian
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
