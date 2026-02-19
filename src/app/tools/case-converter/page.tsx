"use client";

import { useState } from "react";
import Link from "next/link";

export default function CaseConverter() {
    const [input, setInput] = useState("");
    const [copied, setCopied] = useState<string | null>(null);

    const conversions = [
        { name: "UPPERCASE", fn: (s: string) => s.toUpperCase() },
        { name: "lowercase", fn: (s: string) => s.toLowerCase() },
        { name: "Title Case", fn: (s: string) => s.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.substr(1).toLowerCase()) },
        { name: "Sentence case", fn: (s: string) => s.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase()) },
        { name: "camelCase", fn: (s: string) => s.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()) },
        { name: "PascalCase", fn: (s: string) => s.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (m, i) => i === 0 ? m.toUpperCase() : m.toUpperCase()).replace(/\s+/g, "") },
        { name: "snake_case", fn: (s: string) => s.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") },
        { name: "kebab-case", fn: (s: string) => s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") },
        { name: "CONSTANT_CASE", fn: (s: string) => s.toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "") },
        { name: "aLtErNaTiNg", fn: (s: string) => s.split("").map((c, i) => i % 2 ? c.toUpperCase() : c.toLowerCase()).join("") },
        { name: "Reverse", fn: (s: string) => s.split("").reverse().join("") },
    ];

    const copy = (text: string, name: string) => {
        navigator.clipboard.writeText(text);
        setCopied(name);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-900 via-slate-900 to-slate-900">
            <nav className="border-b border-sky-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-sky-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">🔤 Case Converter</h1>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto p-6">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-sky-800/30 mb-6">
                    <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type or paste your text here..." rows={4} className="w-full px-4 py-3 bg-slate-900 border border-sky-700 rounded-lg text-white focus:border-sky-500 focus:outline-none resize-none" />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    {conversions.map((c) => (
                        <div key={c.name} className="bg-slate-800/50 rounded-xl p-4 border border-sky-800/30">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sky-300 text-sm font-medium">{c.name}</span>
                                <button onClick={() => copy(c.fn(input), c.name)} className="text-xs text-slate-400 hover:text-white">
                                    {copied === c.name ? "✓" : "Copy"}
                                </button>
                            </div>
                            <div className="font-mono text-white text-sm bg-slate-900 p-3 rounded break-all min-h-[60px]">{c.fn(input) || "-"}</div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
