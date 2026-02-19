"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

const SAMPLE = `Speed reading is a collection of reading techniques that attempt to increase reading speed without greatly reducing comprehension. Methods include chunking and minimizing subvocalization. The many available speed reading training programs include books, videos, software, and seminars.

The average reading speed is about 200 to 250 words per minute. Speed readers claim to reach speeds of 1000 words per minute or more while maintaining good comprehension. However, research has shown that reading faster than 500 words per minute significantly reduces comprehension.

The most effective speed reading technique is to reduce the time spent on each fixation. Our eyes don't move smoothly across text; they make quick jumps called saccades. Between saccades, our eyes pause briefly to take in information - these pauses are fixations.`;

export default function SpeedReader() {
    const [text, setText] = useState(SAMPLE);
    const [wpm, setWpm] = useState(300);
    const [currentWord, setCurrentWord] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [mode, setMode] = useState<"word" | "chunk">("word");
    const [chunkSize, setChunkSize] = useState(3);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const words = text.trim().split(/\s+/);

    const play = useCallback(() => {
        if (currentWord >= words.length) setCurrentWord(0);
        const delay = 60000 / wpm;
        intervalRef.current = setInterval(() => {
            setCurrentWord(w => { if (w >= words.length - 1) { setIsPlaying(false); return w; } return w + (mode === "chunk" ? chunkSize : 1); });
        }, delay * (mode === "chunk" ? chunkSize : 1));
    }, [wpm, words.length, currentWord, mode, chunkSize]);

    useEffect(() => {
        if (isPlaying) play();
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isPlaying, play]);

    const getCurrentDisplay = () => {
        if (mode === "word") return words[currentWord] || "";
        return words.slice(currentWord, currentWord + chunkSize).join(" ");
    };

    const progress = (currentWord / words.length) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
            <nav className="border-b border-slate-700 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-slate-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">👁️ Speed Reader</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 mb-6 text-center">
                    <div className="h-24 flex items-center justify-center">
                        <span className="text-4xl font-bold text-white">{getCurrentDisplay()}</span>
                    </div>
                    <div className="h-1 bg-slate-700 rounded-full mt-4"><div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
                    <div className="text-slate-400 text-sm mt-2">{currentWord + 1} / {words.length} words</div>
                </div>
                <div className="flex justify-center gap-4 mb-6">
                    <button onClick={() => { setIsPlaying(!isPlaying); if (intervalRef.current) clearInterval(intervalRef.current); }} className={`px-6 py-3 rounded-xl font-medium ${isPlaying ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}>{isPlaying ? "Pause" : "Play"}</button>
                    <button onClick={() => { setCurrentWord(0); setIsPlaying(false); if (intervalRef.current) clearInterval(intervalRef.current); }} className="px-6 py-3 bg-slate-700 text-white rounded-xl">Reset</button>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 mb-6">
                    <div className="grid md:grid-cols-3 gap-4">
                        <div><label className="block text-sm text-slate-400 mb-2">Speed: {wpm} WPM</label><input type="range" value={wpm} onChange={(e) => setWpm(parseInt(e.target.value))} min="100" max="1000" step="50" className="w-full" /></div>
                        <div><label className="block text-sm text-slate-400 mb-2">Mode</label><select value={mode} onChange={(e) => setMode(e.target.value as "word" | "chunk")} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white"><option value="word">Single Word</option><option value="chunk">Chunk</option></select></div>
                        {mode === "chunk" && <div><label className="block text-sm text-slate-400 mb-2">Chunk Size</label><input type="number" value={chunkSize} onChange={(e) => setChunkSize(Math.max(2, parseInt(e.target.value) || 2))} min="2" max="10" className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white" /></div>}
                    </div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                    <label className="block text-sm text-slate-400 mb-2">Text to Read</label>
                    <textarea value={text} onChange={(e) => { setText(e.target.value); setCurrentWord(0); }} rows={6} className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white resize-none" />
                </div>
            </main>
        </div>
    );
}
