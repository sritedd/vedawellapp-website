"use client";

import { useState } from "react";
import Link from "next/link";

export default function PlainTextPaster() {
    const [text, setText] = useState("");
    const [copied, setCopied] = useState(false);

    const paste = async () => {
        try {
            const clipboardText = await navigator.clipboard.readText();
            setText(clipboardText);
        } catch {
            // Fallback for older browsers
            const textArea = document.createElement("textarea");
            document.body.appendChild(textArea);
            textArea.focus();
            document.execCommand("paste");
            setText(textArea.value);
            document.body.removeChild(textArea);
        }
    };

    const copy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const clean = () => {
        let cleaned = text;
        // Remove multiple spaces
        cleaned = cleaned.replace(/  +/g, " ");
        // Remove multiple newlines
        cleaned = cleaned.replace(/\n\n\n+/g, "\n\n");
        // Trim whitespace
        cleaned = cleaned.trim();
        setText(cleaned);
    };

    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const charCount = text.length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <nav className="border-b border-slate-700 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-slate-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">📋 Plain Text Paster</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-sm text-slate-400">{wordCount} words, {charCount} characters</div>
                        <div className="flex gap-2">
                            <button onClick={paste} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">📋 Paste</button>
                            <button onClick={clean} className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm">🧹 Clean</button>
                            <button onClick={copy} disabled={!text} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50">{copied ? "✓ Copied" : "Copy"}</button>
                            <button onClick={() => setText("")} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Clear</button>
                        </div>
                    </div>
                    <textarea value={text} onChange={(e) => setText(e.target.value)} rows={20} placeholder="Paste formatted text here to convert to plain text. All formatting, styles, and special characters will be stripped." className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white font-mono resize-none focus:outline-none" />
                </div>
                <div className="mt-4 text-center text-sm text-slate-500">
                    💡 Paste rich text from Word, Google Docs, or websites to strip all formatting
                </div>
            </main>
        </div>
    );
}
