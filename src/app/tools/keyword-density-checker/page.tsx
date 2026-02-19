"use client";

import { useState } from "react";
import Link from "next/link";

export default function KeywordDensityChecker() {
    const [text, setText] = useState("");
    const [minLength, setMinLength] = useState(3);
    const [topN, setTopN] = useState(20);

    const analyze = () => {
        if (!text.trim()) return [];
        const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
        const stopWords = new Set(["the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "must", "shall", "can", "to", "of", "in", "for", "on", "with", "at", "by", "from", "as", "into", "through", "during", "before", "after", "above", "below", "between", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "just", "and", "but", "if", "or", "because", "until", "while", "this", "that", "these", "those", "i", "me", "my", "we", "our", "you", "your", "he", "him", "his", "she", "her", "it", "its", "they", "them", "their", "what", "which", "who"]);

        const freq: Record<string, number> = {};
        words.forEach(word => {
            if (word.length >= minLength && !stopWords.has(word)) {
                freq[word] = (freq[word] || 0) + 1;
            }
        });

        const total = words.length;
        return Object.entries(freq)
            .map(([word, count]) => ({ word, count, density: (count / total) * 100 }))
            .sort((a, b) => b.count - a.count)
            .slice(0, topN);
    };

    const keywords = analyze();
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-900 via-slate-900 to-slate-900">
            <nav className="border-b border-green-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-green-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">🔑 Keyword Density Checker</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-green-800/30">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm text-green-300">Text Content</label>
                                <span className="text-slate-400 text-sm">{wordCount} words</span>
                            </div>
                            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={15} placeholder="Paste your content here to analyze keyword density..." className="w-full px-4 py-3 bg-slate-900 border border-green-700 rounded-lg text-white resize-none" />
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-green-800/30 flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs text-green-300 mb-1">Min Word Length</label>
                                <input type="number" value={minLength} onChange={(e) => setMinLength(parseInt(e.target.value) || 3)} min="2" max="10" className="w-full px-3 py-2 bg-slate-900 border border-green-700 rounded text-white" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs text-green-300 mb-1">Top Keywords</label>
                                <input type="number" value={topN} onChange={(e) => setTopN(parseInt(e.target.value) || 10)} min="5" max="50" className="w-full px-3 py-2 bg-slate-900 border border-green-700 rounded text-white" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-green-800/30">
                        <h3 className="text-white font-medium mb-4">Keyword Analysis</h3>
                        {keywords.length > 0 ? (
                            <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                {keywords.map((kw, i) => (
                                    <div key={kw.word} className="flex items-center gap-2">
                                        <span className="text-slate-500 w-6 text-right text-sm">{i + 1}.</span>
                                        <span className="text-white flex-1">{kw.word}</span>
                                        <span className="text-slate-400 text-sm w-12 text-right">{kw.count}×</span>
                                        <div className="w-24 bg-slate-700 rounded-full h-2">
                                            <div className="bg-green-500 h-full rounded-full" style={{ width: `${Math.min(kw.density * 10, 100)}%` }} />
                                        </div>
                                        <span className={`text-sm w-16 text-right ${kw.density > 3 ? "text-amber-400" : "text-green-400"}`}>{kw.density.toFixed(2)}%</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-slate-500 text-center py-12">Enter text to analyze</div>
                        )}
                        <div className="mt-4 p-3 bg-slate-900 rounded-lg text-sm">
                            <div className="text-slate-400">💡 Ideal keyword density: 1-3%</div>
                            <div className="text-slate-400">⚠️ Over 3% may be considered keyword stuffing</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
