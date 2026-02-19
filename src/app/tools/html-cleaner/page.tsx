"use client";

import { useState } from "react";
import Link from "next/link";

export default function HTMLCleaner() {
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [options, setOptions] = useState({
        removeStyles: true,
        removeClasses: true,
        removeIds: false,
        removeEmptyTags: true,
        removeComments: true,
        minify: false,
    });
    const [copied, setCopied] = useState(false);

    const clean = () => {
        let html = input;
        if (options.removeComments) html = html.replace(/<!--[\s\S]*?-->/g, "");
        if (options.removeStyles) html = html.replace(/\s*style="[^"]*"/gi, "");
        if (options.removeClasses) html = html.replace(/\s*class="[^"]*"/gi, "");
        if (options.removeIds) html = html.replace(/\s*id="[^"]*"/gi, "");
        if (options.removeEmptyTags) html = html.replace(/<(\w+)[^>]*>\s*<\/\1>/g, "");
        if (options.minify) html = html.replace(/\s+/g, " ").replace(/>\s+</g, "><").trim();
        else html = html.replace(/^\s+/gm, "").trim();
        setOutput(html);
    };

    const copy = () => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-900 via-slate-900 to-slate-900">
            <nav className="border-b border-orange-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-orange-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">🧹 HTML Cleaner</h1>
                </div>
            </nav>
            <main className="max-w-6xl mx-auto p-6">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-orange-800/30 mb-6 flex flex-wrap gap-4">
                    {Object.entries(options).map(([key, value]) => (
                        <label key={key} className="flex items-center gap-2 text-sm text-slate-300">
                            <input type="checkbox" checked={value} onChange={(e) => setOptions({ ...options, [key]: e.target.checked })} />
                            {key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}
                        </label>
                    ))}
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-orange-800/30">
                        <label className="block text-sm text-orange-300 mb-2">Input HTML</label>
                        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={15} placeholder="Paste your HTML here..." className="w-full px-4 py-3 bg-slate-900 border border-orange-700 rounded-lg text-white font-mono text-sm resize-none" />
                        <button onClick={clean} className="w-full mt-4 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700">Clean HTML</button>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-orange-800/30">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm text-orange-300">Cleaned HTML</label>
                            <button onClick={copy} disabled={!output} className="text-xs text-orange-400 hover:text-white disabled:opacity-50">{copied ? "✓ Copied" : "Copy"}</button>
                        </div>
                        <pre className="p-4 bg-slate-900 rounded-lg text-green-400 font-mono text-sm overflow-auto h-[400px] whitespace-pre-wrap">{output || "Cleaned HTML will appear here"}</pre>
                    </div>
                </div>
            </main>
        </div>
    );
}
