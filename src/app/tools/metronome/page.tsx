"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

export default function Metronome() {
    const [bpm, setBpm] = useState(120);
    const [isPlaying, setIsPlaying] = useState(false);
    const [beat, setBeat] = useState(0);
    const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
    const audioContextRef = useRef<AudioContext | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const playClick = useCallback((isAccent: boolean) => {
        if (!audioContextRef.current) audioContextRef.current = new AudioContext();
        const ctx = audioContextRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = isAccent ? 1000 : 800;
        gain.gain.value = 0.3;
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
    }, []);

    useEffect(() => {
        if (isPlaying) {
            const interval = 60000 / bpm;
            intervalRef.current = setInterval(() => {
                setBeat(b => { const next = (b + 1) % beatsPerMeasure; playClick(next === 0); return next; });
            }, interval);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isPlaying, bpm, beatsPerMeasure, playClick]);

    const tempoNames: Record<string, [number, number]> = { Grave: [20, 40], Largo: [40, 60], Adagio: [60, 80], Andante: [80, 100], Moderato: [100, 120], Allegro: [120, 160], Vivace: [160, 180], Presto: [180, 220] };
    const getTempoName = () => Object.entries(tempoNames).find(([, [min, max]]) => bpm >= min && bpm < max)?.[0] || "Prestissimo";

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
            <nav className="border-b border-slate-700 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-slate-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">🎵 Metronome</h1>
                </div>
            </nav>
            <main className="max-w-md mx-auto p-6 text-center">
                <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 mb-6">
                    <div className="text-slate-400 text-sm mb-2">{getTempoName()}</div>
                    <div className="text-7xl font-bold text-white mb-2">{bpm}</div>
                    <div className="text-slate-400 mb-6">BPM</div>
                    <input type="range" value={bpm} onChange={(e) => setBpm(parseInt(e.target.value))} min="20" max="240" className="w-full mb-6" />
                    <div className="flex justify-center gap-2 mb-6">
                        {Array.from({ length: beatsPerMeasure }).map((_, i) => (
                            <div key={i} className={`w-6 h-6 rounded-full transition-all ${beat === i ? "bg-amber-400 scale-125" : "bg-slate-600"}`} />
                        ))}
                    </div>
                    <div className="flex gap-4 justify-center mb-6">
                        <button onClick={() => setIsPlaying(!isPlaying)} className={`px-8 py-3 rounded-xl font-medium ${isPlaying ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}>{isPlaying ? "Stop" : "Start"}</button>
                    </div>
                    <div className="flex gap-2 justify-center">
                        {[3, 4, 6].map(b => (
                            <button key={b} onClick={() => setBeatsPerMeasure(b)} className={`px-4 py-2 rounded-lg text-sm ${beatsPerMeasure === b ? "bg-amber-600 text-white" : "bg-slate-700 text-white"}`}>{b}/4</button>
                        ))}
                    </div>
                </div>
                <div className="flex justify-center gap-2 flex-wrap">
                    {[60, 80, 100, 120, 140, 160].map(t => (
                        <button key={t} onClick={() => setBpm(t)} className="px-3 py-1 bg-slate-700 text-white rounded text-sm hover:bg-slate-600">{t}</button>
                    ))}
                </div>
            </main>
        </div>
    );
}
