"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
    { href: "/", label: "Home" },
    { href: "/tools", label: "Tools" },
    { href: "/games", label: "Games" },
    { href: "/panchang", label: "Panchang" },
    { href: "/guardian", label: "🏠 Guardian", highlight: true },
];

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

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
                </div>
            )}
        </nav>
    );
}
