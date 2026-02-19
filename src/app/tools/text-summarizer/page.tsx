"use client";

import { useState } from "react";
import Link from "next/link";

export default function TextSummarizer() {
    const [text, setText] = useState("");
    const [sentences, setSentences] = useState(3);
    const [summary, setSummary] = useState("");
    const [copied, setCopied] = useState(false);

    const summarize = () => {
        if (!text.trim()) return;

        // Extractive summarization algorithm
        const allSentences = text.match(/[^.!?]+[.!?]+/g) || [];
        if (allSentences.length <= sentences) {
            setSummary(text);
            return;
        }

        // Calculate word frequencies
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        const stopWords = new Set(["the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "must", "shall", "can", "need", "dare", "ought", "used", "to", "of", "in", "for", "on", "with", "at", "by", "from", "as", "into", "through", "during", "before", "after", "above", "below", "between", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "just", "and", "but", "if", "or", "because", "until", "while", "although", "this", "that", "these", "those", "i", "me", "my", "myself", "we", "our", "you", "your", "he", "him", "his", "she", "her", "it", "its", "they", "them", "their", "what", "which", "who", "whom"]);

        const wordFreq: Record<string, number> = {};
        words.forEach(word => {
            if (!stopWords.has(word) && word.length > 2) {
                wordFreq[word] = (wordFreq[word] || 0) + 1;
            }
        });

        // Score sentences
        const scored = allSentences.map((sentence, index) => {
            const sentenceWords = sentence.toLowerCase().match(/\b\w+\b/g) || [];
            const score = sentenceWords.reduce((sum, word) => sum + (wordFreq[word] || 0), 0) / Math.max(sentenceWords.length, 1);
            return { sentence: sentence.trim(), score, index };
        });

        // Get top sentences and sort by original order
        const topSentences = scored
            .sort((a, b) => b.score - a.score)
            .slice(0, sentences)
            .sort((a, b) => a.index - b.index)
            .map(s => s.sentence);

        setSummary(topSentences.join(" "));
    };

    const copy = () => { navigator.clipboard.writeText(summary); setCopied(true); setTimeout(() => setCopied(false), 2000); };

    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const summaryWordCount = summary.trim() ? summary.trim().split(/\s+/).length : 0;
    const reduction = wordCount > 0 ? Math.round((1 - summaryWordCount / wordCount) * 100) : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-900 via-slate-900 to-slate-900">
            <nav className="border-b border-violet-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-violet-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">📝 Text Summarizer</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-violet-800/30 mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm text-violet-300">Paste your text ({wordCount} words)</label>
                    </div>
                    <textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} placeholder="Paste a long article, essay, or document here..." className="w-full px-4 py-3 bg-slate-900 border border-violet-700 rounded-lg text-white resize-none focus:outline-none" />
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6 border border-violet-800/30 mb-6 flex items-center gap-4 flex-wrap">
                    <div className="flex-1">
                        <label className="block text-sm text-violet-300 mb-2">Number of sentences in summary</label>
                        <input type="range" value={sentences} onChange={(e) => setSentences(parseInt(e.target.value))} min="1" max="10" className="w-full" />
                    </div>
                    <span className="text-white font-bold text-2xl w-8">{sentences}</span>
                    <button onClick={summarize} disabled={!text.trim()} className="px-8 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 disabled:opacity-50">Summarize</button>
                </div>
                {summary && (
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-violet-800/30">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <span className="text-violet-300 text-sm">Summary</span>
                                <span className="text-slate-400 text-sm ml-2">({summaryWordCount} words, {reduction}% shorter)</span>
                            </div>
                            <button onClick={copy} className="text-sm text-violet-400 hover:text-white">{copied ? "✓ Copied" : "Copy"}</button>
                        </div>
                        <p className="text-white leading-relaxed">{summary}</p>
                    </div>
                )}
            </main>
        </div>
    );
}
