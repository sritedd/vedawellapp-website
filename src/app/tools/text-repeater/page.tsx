"use client";

import { useState } from "react";
import Link from "next/link";

export default function TextRepeater() {
    const [text, setText] = useState("Hello World");
    const [count, setCount] = useState(5);
    const [separator, setSeparator] = useState("newline");
    const [copied, setCopied] = useState(false);

    const separators: Record<string, string> = {
        newline: "\n",
        space: " ",
        comma: ", ",
        none: "",
    };

    const result = Array(count).fill(text).join(separators[separator]);
    const copy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-900 via-slate-900 to-slate-900">
            <nav className="border-b border-teal-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/tools" className="text-teal-400 hover:text-white">← Back</Link>
                        <h1 className="text-xl font-bold text-white">🔁 Text Repeater</h1>
                    </div>
                    <button onClick={copy} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm">{copied ? "✓ Copied" : "Copy"}</button>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-teal-800/30 mb-6 space-y-4">
                    <div>
                        <label className="block text-sm text-teal-300 mb-2">Text to repeat</label>
                        <input type="text" value={text} onChange={(e) => setText(e.target.value)} className="w-full px-4 py-2 bg-slate-900 border border-teal-700 rounded-lg text-white" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-teal-300 mb-2">Repeat count: {count}</label>
                            <input type="range" value={count} onChange={(e) => setCount(parseInt(e.target.value))} min="1" max="100" className="w-full" />
                        </div>
                        <div>
                            <label className="block text-sm text-teal-300 mb-2">Separator</label>
                            <select value={separator} onChange={(e) => setSeparator(e.target.value)} className="w-full px-4 py-2 bg-slate-900 border border-teal-700 rounded-lg text-white">
                                <option value="newline">New Line</option>
                                <option value="space">Space</option>
                                <option value="comma">Comma</option>
                                <option value="none">None</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6 border border-teal-800/30">
                    <div className="text-sm text-teal-300 mb-2">Result ({count} repetitions)</div>
                    <pre className="p-4 bg-slate-900 rounded-lg text-white font-mono text-sm overflow-auto max-h-[400px] whitespace-pre-wrap">{result}</pre>
                </div>
            </main>
        </div>
    );
}
