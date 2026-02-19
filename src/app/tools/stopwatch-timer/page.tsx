"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function StopwatchTimer() {
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [laps, setLaps] = useState<number[]>([]);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setTime((t) => t + 10);
            }, 10);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning]);

    const formatTime = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const centiseconds = Math.floor((ms % 1000) / 10);
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
    };

    const start = () => setIsRunning(true);
    const stop = () => setIsRunning(false);
    const reset = () => { setIsRunning(false); setTime(0); setLaps([]); };
    const lap = () => setLaps([time, ...laps]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
            <nav className="border-b border-slate-700 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-slate-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">⏱️ Stopwatch</h1>
                </div>
            </nav>

            <main className="max-w-md mx-auto p-6 text-center">
                <div className="bg-slate-800/50 rounded-2xl p-12 border border-slate-700 mb-6">
                    <div className="text-7xl font-mono font-bold text-white mb-8">{formatTime(time)}</div>
                    <div className="flex gap-4 justify-center">
                        {!isRunning ? (
                            <button onClick={start} className="px-8 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700">Start</button>
                        ) : (
                            <button onClick={stop} className="px-8 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700">Stop</button>
                        )}
                        <button onClick={lap} disabled={!isRunning} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50">Lap</button>
                        <button onClick={reset} className="px-8 py-3 bg-slate-600 text-white rounded-xl font-medium hover:bg-slate-500">Reset</button>
                    </div>
                </div>

                {laps.length > 0 && (
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                        <h3 className="text-white font-medium mb-4">Laps</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {laps.map((lap, i) => (
                                <div key={i} className="flex justify-between p-2 bg-slate-900 rounded">
                                    <span className="text-slate-400">Lap {laps.length - i}</span>
                                    <span className="text-white font-mono">{formatTime(lap)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
