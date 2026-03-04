"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const navLinks = [
    { href: "/", label: "Home" },
    { href: "/tools", label: "Tools" },
    { href: "/games", label: "Games" },
    { href: "/panchang", label: "Panchang" },
    { href: "/guardian", label: "🏠 Guardian", highlight: true },
];

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [user, setUser] = useState<{ email?: string; full_name?: string } | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        const supabase = createClient();
        // Check initial auth state
        supabase.auth.getUser().then(({ data }: { data: { user: any } }) => {
            if (data.user) {
                setUser({ email: data.user.email, full_name: data.user.user_metadata?.full_name });
            }
        });
        // Listen for auth changes (login/logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
            if (session?.user) {
                setUser({ email: session.user.email, full_name: session.user.user_metadata?.full_name });
            } else {
                setUser(null);
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    const userInitial = user?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U";

    return (
        <nav className="navbar-root">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-2 text-xl font-bold">
                    <span>🛠️</span>
                    <span>VedaWell Tools</span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-6">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`transition-colors ${isActive(link.href)
                                ? "font-semibold text-primary"
                                : link.highlight
                                    ? "font-semibold text-primary hover:text-primary-light"
                                    : "text-muted hover:text-foreground"
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                    {/* Auth indicator */}
                    {user && (
                        <Link
                            href="/guardian/dashboard"
                            className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold hover:bg-primary/30 transition-colors"
                            title={user.full_name || user.email || "My Account"}
                        >
                            {userInitial}
                        </Link>
                    )}
                </div>

                {/* Mobile Hamburger */}
                <button
                    className="md:hidden flex flex-col gap-1.5 p-2"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                >
                    <span
                        className={`block w-6 h-0.5 bg-foreground transition-transform ${mobileOpen ? "rotate-45 translate-y-2" : ""
                            }`}
                    />
                    <span
                        className={`block w-6 h-0.5 bg-foreground transition-opacity ${mobileOpen ? "opacity-0" : ""
                            }`}
                    />
                    <span
                        className={`block w-6 h-0.5 bg-foreground transition-transform ${mobileOpen ? "-rotate-45 -translate-y-2" : ""
                            }`}
                    />
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-border bg-card px-6 py-4 space-y-3">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className={`block py-2 transition-colors ${isActive(link.href)
                                ? "font-semibold text-primary"
                                : "text-muted hover:text-foreground"
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                    {/* Mobile auth indicator */}
                    {user && (
                        <Link
                            href="/guardian/dashboard"
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-2 py-2 text-primary font-medium"
                        >
                            <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                                {userInitial}
                            </span>
                            <span>My Dashboard</span>
                        </Link>
                    )}
                </div>
            )}
        </nav>
    );
}

