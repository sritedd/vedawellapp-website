"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ToolFAQ from "@/components/tools/ToolFAQ";
import { trackToolUse } from "@/lib/analytics";

export default function WordCounter() {
    const [text, setText] = useState("");
    const hasTracked = useRef(false);
    const [stats, setStats] = useState({
        characters: 0,
        charactersNoSpaces: 0,
        words: 0,
        sentences: 0,
        paragraphs: 0,
        readingTime: 0,
        speakingTime: 0,
    });

    useEffect(() => {
        const characters = text.length;
        const charactersNoSpaces = text.replace(/\s/g, "").length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const sentences = text.split(/[.!?]+/).filter((s) => s.trim()).length;
        const paragraphs = text.split(/\n\n+/).filter((p) => p.trim()).length;
        const readingTime = Math.ceil(words / 200); // 200 WPM average reading
        const speakingTime = Math.ceil(words / 150); // 150 WPM average speaking

        setStats({
            characters,
            charactersNoSpaces,
            words,
            sentences,
            paragraphs,
            readingTime,
            speakingTime,
        });
        if (!hasTracked.current && words >= 5) {
            hasTracked.current = true;
            trackToolUse("word-counter");
        }
    }, [text]);

    const getKeywordDensity = () => {
        if (stats.words < 3) return [];

        const words = text.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/);
        const counts: Record<string, number> = {};
        const stopWords = new Set(["the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "must", "can", "to", "of", "in", "for", "on", "with", "at", "by", "from", "as", "or", "and", "but", "if", "it", "its", "this", "that", "these", "those", "i", "you", "he", "she", "we", "they"]);

        words.forEach((word) => {
            if (word.length > 2 && !stopWords.has(word)) {
                counts[word] = (counts[word] || 0) + 1;
            }
        });

        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    };

    const keywords = getKeywordDensity();

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100">
            {/* Header */}
            <nav className="border-b border-border bg-white/80 backdrop-blur">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold">
                        <span>🛠️</span>
                        <span>VedaWell Tools</span>
                    </Link>
                    <Link href="/tools" className="text-gray-600 hover:text-gray-900">
                        ← All Tools
                    </Link>
                </div>
            </nav>

            <main className="py-12 px-6">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-2 text-center">📝 Word Counter</h1>
                    <p className="text-gray-500 text-center mb-8">
                        Count words, characters, sentences, and more
                    </p>

                    {/* Stats Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                            <div className="text-3xl font-bold text-teal-600">{stats.words}</div>
                            <div className="text-sm text-gray-500">Words</div>
                        </div>
                        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                            <div className="text-3xl font-bold text-cyan-600">{stats.characters}</div>
                            <div className="text-sm text-gray-500">Characters</div>
                        </div>
                        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                            <div className="text-3xl font-bold text-blue-600">{stats.sentences}</div>
                            <div className="text-sm text-gray-500">Sentences</div>
                        </div>
                        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                            <div className="text-3xl font-bold text-indigo-600">{stats.paragraphs}</div>
                            <div className="text-sm text-gray-500">Paragraphs</div>
                        </div>
                    </div>

                    {/* Text Input */}
                    <div className="bg-white rounded-2xl shadow-xl p-6">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Start typing or paste your text here..."
                            className="w-full h-64 px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none resize-none text-lg"
                        />

                        {/* Additional Stats */}
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-500">No Spaces</span>
                                <span className="font-medium">{stats.charactersNoSpaces}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-500">Reading Time</span>
                                <span className="font-medium">{stats.readingTime} min</span>
                            </div>
                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-500">Speaking Time</span>
                                <span className="font-medium">{stats.speakingTime} min</span>
                            </div>
                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-500">Avg Word Length</span>
                                <span className="font-medium">
                                    {stats.words ? (stats.charactersNoSpaces / stats.words).toFixed(1) : "0"}
                                </span>
                            </div>
                        </div>

                        {/* Keywords */}
                        {keywords.length > 0 && (
                            <div className="mt-4 p-4 bg-teal-50 rounded-xl">
                                <h3 className="text-sm font-medium text-teal-800 mb-2">Top Keywords</h3>
                                <div className="flex flex-wrap gap-2">
                                    {keywords.map(([word, count]) => (
                                        <span
                                            key={word}
                                            className="px-3 py-1 bg-white rounded-full text-sm text-teal-700"
                                        >
                                            {word} <span className="text-teal-500">({count})</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="mt-4 flex gap-4">
                            <button
                                onClick={() => setText("")}
                                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => navigator.clipboard.writeText(text)}
                                className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-400 transition-colors"
                            >
                                Copy Text
                            </button>
                        </div>
                    </div>
                </div>

                <ToolFAQ faqs={[
                    { question: "How are words counted in this tool?", answer: "Words are counted by splitting text on whitespace boundaries (spaces, tabs, newlines). Hyphenated words like 'well-known' count as one word. Numbers and abbreviations are each counted as separate words, following standard word counting conventions used by Microsoft Word and Google Docs." },
                    { question: "What is the ideal word count for a blog post?", answer: "For SEO, blog posts should be at least 1,000-1,500 words for competitive topics. Long-form content (2,000-3,000+ words) tends to rank higher on Google. For social media: Twitter is 280 characters, Instagram captions work best at 125-150 words, and LinkedIn posts perform well at 1,300-2,000 characters." },
                    { question: "How long does it take to read a certain word count?", answer: "The average adult reads at about 200-250 words per minute. So: 500 words takes about 2 minutes, 1,000 words takes 4-5 minutes, and 2,000 words takes 8-10 minutes. Speaking speed is slower at about 130-150 words per minute." },
                    { question: "Does this tool count characters with or without spaces?", answer: "This tool shows both. 'Characters' includes spaces and punctuation, while 'Characters (no spaces)' excludes them. The no-spaces count is useful for SMS messages and social media platforms that count characters differently." },
                ]} />
            </main>
        </div>
    );
}
