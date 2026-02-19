"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function TextToSpeech() {
    const [text, setText] = useState("Hello! This is a text to speech demo. Enter your text and click speak to hear it read aloud.");
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState(0);
    const [rate, setRate] = useState(1);
    const [pitch, setPitch] = useState(1);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            synthRef.current = window.speechSynthesis;
            const loadVoices = () => {
                const v = synthRef.current?.getVoices() || [];
                setVoices(v);
            };
            loadVoices();
            speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    const speak = () => {
        if (!synthRef.current || !text) return;
        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        if (voices[selectedVoice]) utterance.voice = voices[selectedVoice];
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        synthRef.current.speak(utterance);
    };

    const stop = () => {
        synthRef.current?.cancel();
        setIsSpeaking(false);
    };

    const pause = () => synthRef.current?.pause();
    const resume = () => synthRef.current?.resume();

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-900 via-slate-900 to-slate-900">
            <nav className="border-b border-violet-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-violet-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">🔊 Text to Speech</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-violet-800/30 mb-6">
                    <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder="Enter text to speak..." className="w-full px-4 py-3 bg-slate-900 border border-violet-700 rounded-lg text-white resize-none focus:outline-none" />
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6 border border-violet-800/30 mb-6 grid md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm text-violet-300 mb-2">Voice</label>
                        <select value={selectedVoice} onChange={(e) => setSelectedVoice(parseInt(e.target.value))} className="w-full px-4 py-2 bg-slate-900 border border-violet-700 rounded-lg text-white">
                            {voices.map((voice, i) => (
                                <option key={i} value={i}>{voice.name} ({voice.lang})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-violet-300 mb-2">Rate: {rate.toFixed(1)}</label>
                        <input type="range" value={rate} onChange={(e) => setRate(parseFloat(e.target.value))} min="0.5" max="2" step="0.1" className="w-full" />
                    </div>
                    <div>
                        <label className="block text-sm text-violet-300 mb-2">Pitch: {pitch.toFixed(1)}</label>
                        <input type="range" value={pitch} onChange={(e) => setPitch(parseFloat(e.target.value))} min="0.5" max="2" step="0.1" className="w-full" />
                    </div>
                </div>
                <div className="flex gap-4 justify-center">
                    <button onClick={speak} disabled={!text || isSpeaking} className="px-8 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 disabled:opacity-50">▶️ Speak</button>
                    <button onClick={pause} disabled={!isSpeaking} className="px-8 py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 disabled:opacity-50">⏸️ Pause</button>
                    <button onClick={resume} className="px-8 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700">▶️ Resume</button>
                    <button onClick={stop} className="px-8 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700">⏹️ Stop</button>
                </div>
            </main>
        </div>
    );
}
