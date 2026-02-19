"use client";

import { useState } from "react";
import Link from "next/link";

export default function CharacterCounter() {
    const [text, setText] = useState("");

    const stats = {
        characters: text.length,
        charactersNoSpaces: text.replace(/\s/g, "").length,
        words: text.trim() ? text.trim().split(/\s+/).length : 0,
        sentences: text.split(/[.!?]+/).filter((s) => s.trim()).length,
        paragraphs: text.split(/\n\n+/).filter((p) => p.trim()).length,
        lines: text.split(/\n/).length,
        readingTime: Math.ceil((text.trim() ? text.trim().split(/\s+/).length : 0) / 200),
        speakingTime: Math.ceil((text.trim() ? text.trim().split(/\s+/).length : 0) / 150),
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-lime-900 via-slate-900 to-slate-900">
            <nav className="border-b border-lime-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-lime-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">📊 Character Counter</h1>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto p-6">
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {[
                        { label: "Characters", value: stats.characters },
                        { label: "Words", value: stats.words },
                        { label: "Sentences", value: stats.sentences },
                        { label: "Paragraphs", value: stats.paragraphs },
                    ].map((s) => (
                        <div key={s.label} className="bg-slate-800/50 rounded-xl p-4 text-center border border-lime-800/30">
                            <div className="text-3xl font-bold text-lime-400">{s.value}</div>
                            <div className="text-slate-400 text-sm">{s.label}</div>
                        </div>
                    ))}
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6 border border-lime-800/30 mb-6">
                    <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Start typing or paste your text..." rows={10} className="w-full px-4 py-3 bg-slate-900 border border-lime-700 rounded-lg text-white focus:border-lime-500 focus:outline-none resize-none" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                        <div className="text-slate-400 text-sm">No Spaces</div>
                        <div className="text-white font-bold">{stats.charactersNoSpaces}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                        <div className="text-slate-400 text-sm">Lines</div>
                        <div className="text-white font-bold">{stats.lines}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                        <div className="text-slate-400 text-sm">Reading Time</div>
                        <div className="text-white font-bold">{stats.readingTime} min</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                        <div className="text-slate-400 text-sm">Speaking Time</div>
                        <div className="text-white font-bold">{stats.speakingTime} min</div>
                    </div>
                </div>
            </main>
        </div>
    );
}
