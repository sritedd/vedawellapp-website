"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import AdBanner from "@/components/AdBanner";

const PATTERNS = [
    { name: "4-7-8 Relaxing", inhale: 4, hold: 7, exhale: 8 },
    { name: "Box Breathing", inhale: 4, hold: 4, exhale: 4, holdAfter: 4 },
    { name: "Energizing", inhale: 4, hold: 0, exhale: 4 },
];

export default function BreathingExercise() {
    const [pattern, setPattern] = useState(PATTERNS[0]);
    const [phase, setPhase] = useState<"inhale" | "hold" | "exhale" | "holdAfter">("inhale");
    const [timeLeft, setTimeLeft] = useState(pattern.inhale);
    const [isRunning, setIsRunning] = useState(false);
    const [cycles, setCycles] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const nextPhase = useCallback(() => {
        if (phase === "inhale") { setPhase(pattern.hold > 0 ? "hold" : "exhale"); setTimeLeft(pattern.hold > 0 ? pattern.hold : pattern.exhale); }
        else if (phase === "hold") { setPhase("exhale"); setTimeLeft(pattern.exhale); }
        else if (phase === "exhale") {
            if ((pattern as { holdAfter?: number }).holdAfter) { setPhase("holdAfter"); setTimeLeft((pattern as { holdAfter: number }).holdAfter); }
            else { setPhase("inhale"); setTimeLeft(pattern.inhale); setCycles(c => c + 1); }
        }
        else { setPhase("inhale"); setTimeLeft(pattern.inhale); setCycles(c => c + 1); }
    }, [phase, pattern]);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(t => { if (t <= 1) { nextPhase(); return 0; } return t - 1; });
            }, 1000);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isRunning, nextPhase]);

    const reset = () => { setIsRunning(false); setPhase("inhale"); setTimeLeft(pattern.inhale); setCycles(0); };

    const phaseColors = { inhale: "from-blue-500 to-cyan-500", hold: "from-purple-500 to-pink-500", exhale: "from-green-500 to-teal-500", holdAfter: "from-amber-500 to-orange-500" };
    const phaseLabels = { inhale: "Inhale", hold: "Hold", exhale: "Exhale", holdAfter: "Hold" };

    const circleSize = phase === "inhale" ? 300 : phase === "exhale" ? 150 : 225;

    return (
        <div className={`min-h-screen bg-gradient-to-br ${phaseColors[phase]} transition-all duration-1000`}>
            <nav className="border-b border-white/20 bg-black/20 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-white/70 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">🧘 Breathing Exercise</h1>
                </div>
            </nav>
            <main className="max-w-md mx-auto p-6 text-center">
                <div className="mb-6 flex gap-2 justify-center">
                    {PATTERNS.map(p => (
                        <button key={p.name} onClick={() => { setPattern(p); reset(); }} className={`px-4 py-2 rounded-lg text-sm ${pattern.name === p.name ? "bg-white text-slate-900" : "bg-white/20 text-white"}`}>{p.name}</button>
                    ))}
                </div>
                <div className="flex items-center justify-center mb-8">
                    <div className="relative flex items-center justify-center" style={{ width: 300, height: 300 }}>
                        <div className={`rounded-full bg-white/30 transition-all duration-1000 flex items-center justify-center`} style={{ width: circleSize, height: circleSize }}>
                            <div className="text-center text-white">
                                <div className="text-5xl font-bold">{timeLeft}</div>
                                <div className="text-xl">{phaseLabels[phase]}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4 justify-center mb-6">
                    <button onClick={() => setIsRunning(!isRunning)} className="px-8 py-3 bg-white text-slate-900 rounded-xl font-medium">{isRunning ? "Pause" : "Start"}</button>
                    <button onClick={reset} className="px-8 py-3 bg-white/20 text-white rounded-xl font-medium">Reset</button>
                </div>
                <div className="text-white/70">Cycles completed: <span className="text-white font-bold">{cycles}</span></div>

                <div className="mt-12 bg-black/10 rounded-xl backdrop-blur-sm p-2 w-full max-w-lg mx-auto overflow-hidden">
                    <AdBanner slot="1696472735" format="horizontal" />
                </div>
            </main>
        </div>
    );
}
