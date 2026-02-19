"use client";

import { useState } from "react";
import Link from "next/link";

export default function StringEncoder() {
    const [input, setInput] = useState("Hello World!");
    const [copied, setCopied] = useState<string | null>(null);

    const encodings = [
        { name: "Base64", encode: (s: string) => btoa(unescape(encodeURIComponent(s))), decode: (s: string) => decodeURIComponent(escape(atob(s))) },
        { name: "URL Encode", encode: encodeURIComponent, decode: decodeURIComponent },
        { name: "HTML Entities", encode: (s: string) => s.replace(/[<>&"']/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c] || c)), decode: (s: string) => s.replace(/&lt;|&gt;|&amp;|&quot;|&#39;/g, e => ({ "&lt;": "<", "&gt;": ">", "&amp;": "&", "&quot;": '"', "&#39;": "'" }[e] || e)) },
        { name: "Hex", encode: (s: string) => Array.from(s).map(c => c.charCodeAt(0).toString(16).padStart(2, "0")).join(" "), decode: (s: string) => s.split(" ").map(h => String.fromCharCode(parseInt(h, 16))).join("") },
        { name: "Binary", encode: (s: string) => Array.from(s).map(c => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" "), decode: (s: string) => s.split(" ").map(b => String.fromCharCode(parseInt(b, 2))).join("") },
        { name: "ROT13", encode: (s: string) => s.replace(/[a-zA-Z]/g, c => String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26)), decode: (s: string) => s.replace(/[a-zA-Z]/g, c => String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26)) },
        { name: "Reverse", encode: (s: string) => s.split("").reverse().join(""), decode: (s: string) => s.split("").reverse().join("") },
    ];

    const copy = (text: string, name: string) => {
        navigator.clipboard.writeText(text);
        setCopied(name);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-900 via-slate-900 to-slate-900">
            <nav className="border-b border-violet-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-violet-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">🔐 String Encoder/Decoder</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-violet-800/30 mb-6">
                    <label className="block text-sm text-violet-300 mb-2">Input String</label>
                    <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={3} className="w-full px-4 py-3 bg-slate-900 border border-violet-700 rounded-lg text-white resize-none" />
                </div>
                <div className="space-y-4">
                    {encodings.map(enc => {
                        let encoded = "";
                        try { encoded = enc.encode(input); } catch { encoded = "Error"; }
                        return (
                            <div key={enc.name} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-violet-300 font-medium">{enc.name}</span>
                                    <button onClick={() => copy(encoded, enc.name)} className="text-xs text-violet-400 hover:text-white">{copied === enc.name ? "✓ Copied" : "Copy"}</button>
                                </div>
                                <pre className="p-3 bg-slate-900 rounded text-green-400 font-mono text-sm overflow-x-auto">{encoded}</pre>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
