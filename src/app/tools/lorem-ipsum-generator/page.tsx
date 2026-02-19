"use client";

import { useState } from "react";
import Link from "next/link";

const LOREM = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

export default function LoremIpsumGenerator() {
    const [type, setType] = useState<"paragraphs" | "sentences" | "words">("paragraphs");
    const [count, setCount] = useState(3);
    const [copied, setCopied] = useState(false);

    const generate = (): string => {
        const words = LOREM.split(" ");
        const sentences = LOREM.split(". ").map(s => s.endsWith(".") ? s : s + ".");

        if (type === "words") {
            const result: string[] = [];
            for (let i = 0; i < count; i++) result.push(words[i % words.length]);
            return result.join(" ");
        }
        if (type === "sentences") {
            const result: string[] = [];
            for (let i = 0; i < count; i++) result.push(sentences[i % sentences.length]);
            return result.join(" ");
        }
        const result: string[] = [];
        for (let i = 0; i < count; i++) result.push(LOREM);
        return result.join("\n\n");
    };

    const text = generate();
    const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-900 via-slate-900 to-slate-900">
            <nav className="border-b border-stone-700 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-stone-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">📝 Lorem Ipsum Generator</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-stone-700 mb-6 flex flex-wrap gap-4 items-center">
                    <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="px-4 py-2 bg-slate-900 border border-stone-600 rounded-lg text-white">
                        <option value="paragraphs">Paragraphs</option>
                        <option value="sentences">Sentences</option>
                        <option value="words">Words</option>
                    </select>
                    <input type="number" value={count} onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))} min="1" max="100" className="w-24 px-4 py-2 bg-slate-900 border border-stone-600 rounded-lg text-white" />
                    <button onClick={copy} className="px-4 py-2 bg-stone-600 text-white rounded-lg hover:bg-stone-500">{copied ? "✓ Copied!" : "Copy Text"}</button>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6 border border-stone-700">
                    <div className="text-white whitespace-pre-wrap">{text}</div>
                </div>
            </main>
        </div>
    );
}
