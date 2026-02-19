"use client";

import { useState } from "react";
import Link from "next/link";

export default function URLEncoder() {
    const [input, setInput] = useState("");
    const [mode, setMode] = useState<"encode" | "decode">("encode");
    const [copied, setCopied] = useState(false);

    const result = mode === "encode" ? encodeURIComponent(input) : (() => { try { return decodeURIComponent(input); } catch { return "Invalid encoded string"; } })();

    const copy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); };

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-900 via-slate-900 to-slate-900">
            <nav className="border-b border-violet-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-violet-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">🔗 URL Encoder/Decoder</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <div className="flex gap-2 mb-6">
                    <button onClick={() => setMode("encode")} className={`px-4 py-2 rounded-lg ${mode === "encode" ? "bg-violet-600 text-white" : "bg-slate-700 text-slate-300"}`}>Encode</button>
                    <button onClick={() => setMode("decode")} className={`px-4 py-2 rounded-lg ${mode === "decode" ? "bg-violet-600 text-white" : "bg-slate-700 text-slate-300"}`}>Decode</button>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6 border border-violet-800/30 mb-6">
                    <label className="block text-sm text-violet-300 mb-2">Input</label>
                    <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={4} placeholder={mode === "encode" ? "Enter text to encode..." : "Enter URL encoded text..."} className="w-full px-4 py-3 bg-slate-900 border border-violet-700 rounded-lg text-white focus:outline-none resize-none" />
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6 border border-violet-800/30">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm text-violet-300">Result</label>
                        <button onClick={copy} className="text-xs text-violet-400 hover:text-white">{copied ? "✓ Copied" : "Copy"}</button>
                    </div>
                    <div className="p-4 bg-slate-900 rounded-lg font-mono text-green-400 break-all min-h-[100px]">{result}</div>
                </div>
            </main>
        </div>
    );
}
