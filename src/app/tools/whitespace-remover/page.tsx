"use client";

import { useState } from "react";
import Link from "next/link";

export default function WhitespaceRemover() {
    const [text, setText] = useState("");
    const [options, setOptions] = useState({
        leadingTrailing: true,
        multipleSpaces: true,
        multipleNewlines: true,
        allNewlines: false,
        tabs: true,
    });
    const [copied, setCopied] = useState(false);

    const clean = () => {
        let result = text;
        if (options.leadingTrailing) result = result.trim();
        if (options.tabs) result = result.replace(/\t/g, " ");
        if (options.multipleSpaces) result = result.replace(/  +/g, " ");
        if (options.allNewlines) result = result.replace(/\n+/g, " ");
        else if (options.multipleNewlines) result = result.replace(/\n\n\n+/g, "\n\n");
        return result;
    };

    const result = clean();
    const copy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); };

    const stats = {
        original: text.length,
        cleaned: result.length,
        saved: text.length - result.length,
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-900">
            <nav className="border-b border-slate-700 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/tools" className="text-slate-400 hover:text-white">← Back</Link>
                        <h1 className="text-xl font-bold text-white">🧹 Whitespace Remover</h1>
                    </div>
                    <button onClick={copy} className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm">{copied ? "✓ Copied" : "Copy Result"}</button>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 mb-6 flex flex-wrap gap-4">
                    {Object.entries(options).map(([key, value]) => (
                        <label key={key} className="flex items-center gap-2 text-sm text-slate-300">
                            <input type="checkbox" checked={value} onChange={(e) => setOptions({ ...options, [key]: e.target.checked })} />
                            {key === "leadingTrailing" && "Trim edges"}
                            {key === "multipleSpaces" && "Remove extra spaces"}
                            {key === "multipleNewlines" && "Remove extra newlines"}
                            {key === "allNewlines" && "Remove all newlines"}
                            {key === "tabs" && "Convert tabs"}
                        </label>
                    ))}
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                        <label className="block text-sm text-slate-400 mb-2">Input ({stats.original} chars)</label>
                        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={15} placeholder="Paste text with extra whitespace..." className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white resize-none font-mono" />
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                        <div className="flex justify-between mb-2">
                            <span className="text-sm text-slate-400">Result ({stats.cleaned} chars)</span>
                            {stats.saved > 0 && <span className="text-sm text-green-400">-{stats.saved} chars</span>}
                        </div>
                        <pre className="p-4 bg-slate-900 rounded-lg text-white font-mono text-sm h-[350px] overflow-auto whitespace-pre-wrap">{result || "Cleaned text will appear here"}</pre>
                    </div>
                </div>
            </main>
        </div>
    );
}
