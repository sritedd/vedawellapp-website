"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

export default function PomodoroTimer() {
    const [workTime, setWorkTime] = useState(25);
    const [breakTime, setBreakTime] = useState(5);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [isBreak, setIsBreak] = useState(false);
    const [sessions, setSessions] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const reset = useCallback((isBreakTime: boolean) => {
        setTimeLeft((isBreakTime ? breakTime : workTime) * 60);
        setIsBreak(isBreakTime);
    }, [workTime, breakTime]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft === 0) {
            audioRef.current?.play();
            if (!isBreak) setSessions(s => s + 1);
            reset(!isBreak);
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft, isBreak, reset]);

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
    const progress = isBreak ? (breakTime * 60 - timeLeft) / (breakTime * 60) * 100 : (workTime * 60 - timeLeft) / (workTime * 60) * 100;

    return (
        <div className={`min-h-screen ${isBreak ? "bg-green-900" : "bg-red-900"} transition-colors`}>
            <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ" />
            <nav className="border-b border-white/20 bg-black/20 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-white/70 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">🍅 Pomodoro Timer</h1>
                </div>
            </nav>
            <main className="max-w-md mx-auto p-6 text-center">
                <div className="bg-white/10 rounded-2xl p-8 backdrop-blur mb-6">
                    <div className="text-white/70 mb-2">{isBreak ? "Break Time" : "Focus Time"}</div>
                    <div className="text-8xl font-mono font-bold text-white mb-6">{formatTime(timeLeft)}</div>
                    <div className="h-2 bg-white/20 rounded-full mb-6"><div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
                    <div className="flex gap-4 justify-center">
                        <button onClick={() => setIsRunning(!isRunning)} className="px-8 py-3 bg-white text-slate-900 rounded-xl font-medium">{isRunning ? "Pause" : "Start"}</button>
                        <button onClick={() => { setIsRunning(false); reset(false); }} className="px-8 py-3 bg-white/20 text-white rounded-xl font-medium">Reset</button>
                    </div>
                </div>
                <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div><label className="block text-sm text-white/70 mb-1">Work (min)</label><input type="number" value={workTime} onChange={(e) => { setWorkTime(parseInt(e.target.value) || 25); if (!isBreak && !isRunning) setTimeLeft((parseInt(e.target.value) || 25) * 60); }} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-center" /></div>
                        <div><label className="block text-sm text-white/70 mb-1">Break (min)</label><input type="number" value={breakTime} onChange={(e) => { setBreakTime(parseInt(e.target.value) || 5); if (isBreak && !isRunning) setTimeLeft((parseInt(e.target.value) || 5) * 60); }} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-center" /></div>
                    </div>
                    <div className="text-white/70">Sessions completed: <span className="text-white font-bold">{sessions}</span></div>
                </div>
            </main>
        </div>
    );
}
