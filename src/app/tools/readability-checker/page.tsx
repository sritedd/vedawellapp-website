"use client";

import { useState } from "react";
import Link from "next/link";

export default function ReadabilityChecker() {
    const [text, setText] = useState("");

    const analyze = () => {
        if (!text.trim()) return null;

        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        const words = text.match(/\b\w+\b/g) || [];
        const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

        const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
        const avgSyllablesPerWord = words.length > 0 ? syllables / words.length : 0;

        // Flesch Reading Ease
        const fleschEase = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

        // Flesch-Kincaid Grade Level
        const fleschKincaid = (0.39 * avgWordsPerSentence) + (11.8 * avgSyllablesPerWord) - 15.59;

        // Gunning Fog Index
        const complexWords = words.filter(w => countSyllables(w) >= 3).length;
        const fog = 0.4 * (avgWordsPerSentence + (100 * complexWords / words.length));

        return { sentences: sentences.length, words: words.length, syllables, fleschEase, fleschKincaid, fog, avgWordsPerSentence };
    };

    const countSyllables = (word: string): number => {
        word = word.toLowerCase();
        if (word.length <= 3) return 1;
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
        word = word.replace(/^y/, "");
        const match = word.match(/[aeiouy]{1,2}/g);
        return match ? match.length : 1;
    };

    const getGrade = (score: number): string => {
        if (score >= 90) return "5th grade - Very Easy";
        if (score >= 80) return "6th grade - Easy";
        if (score >= 70) return "7th grade - Fairly Easy";
        if (score >= 60) return "8th-9th grade - Standard";
        if (score >= 50) return "10th-12th grade - Fairly Difficult";
        if (score >= 30) return "College - Difficult";
        return "College Graduate - Very Difficult";
    };

    const result = analyze();

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900">
            <nav className="border-b border-indigo-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-indigo-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">📖 Readability Checker</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-indigo-800/30">
                        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={15} placeholder="Paste your text here to analyze readability..." className="w-full px-4 py-3 bg-slate-900 border border-indigo-700 rounded-lg text-white resize-none" />
                    </div>
                    <div className="space-y-4">
                        {result ? (
                            <>
                                <div className="bg-slate-800/50 rounded-xl p-6 border border-indigo-800/30 text-center">
                                    <div className="text-sm text-slate-400 mb-1">Flesch Reading Ease</div>
                                    <div className="text-5xl font-bold text-indigo-400">{Math.round(result.fleschEase)}</div>
                                    <div className="text-sm text-slate-300 mt-2">{getGrade(result.fleschEase)}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
                                        <div className="text-xs text-slate-400">Grade Level</div>
                                        <div className="text-2xl font-bold text-white">{result.fleschKincaid.toFixed(1)}</div>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
                                        <div className="text-xs text-slate-400">Fog Index</div>
                                        <div className="text-2xl font-bold text-white">{result.fog.toFixed(1)}</div>
                                    </div>
                                </div>
                                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div><div className="text-2xl font-bold text-white">{result.words}</div><div className="text-xs text-slate-400">Words</div></div>
                                        <div><div className="text-2xl font-bold text-white">{result.sentences}</div><div className="text-xs text-slate-400">Sentences</div></div>
                                        <div><div className="text-2xl font-bold text-white">{result.avgWordsPerSentence.toFixed(1)}</div><div className="text-xs text-slate-400">Words/Sentence</div></div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="bg-slate-800/50 rounded-xl p-12 border border-slate-700 text-center text-slate-500">Enter text to analyze</div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
