"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdBanner from "@/components/AdBanner";

type TimerMode = "focus" | "shortBreak" | "longBreak";

const MODES = {
    focus: { label: "Focus", duration: 25 * 60, color: "from-red-500 to-rose-600" },
    shortBreak: { label: "Short Break", duration: 5 * 60, color: "from-green-500 to-emerald-600" },
    longBreak: { label: "Long Break", duration: 15 * 60, color: "from-blue-500 to-indigo-600" },
};

export default function FocusTimer() {
    const [mode, setMode] = useState<TimerMode>("focus");
    const [timeLeft, setTimeLeft] = useState(MODES.focus.duration);
    const [isRunning, setIsRunning] = useState(false);
    const [sessions, setSessions] = useState(0);
    const [currentTask, setCurrentTask] = useState("");

    // Timer logic
    useEffect(() => {
        if (!isRunning) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setIsRunning(false);
                    // Play notification sound
                    if (typeof window !== "undefined") {
                        try {
                            const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleC8FCllwtIfBskUpDylzn8rLqDcWGlh3sNbGiyYZC1mLz9eqTx0NNXGu1dGFHxcaPXak0tqcJxATQXao1c+PFxYlUYu31c1YGQs3hbTV07INBzN8rNXWlSAMKVeE0datQg0UTpjG1bFODQo/ir7OsVAMDkOQv9KxTA0SQY690bNJDBZEkr7Ps0wNFUSRvM+zTQwXQ4+7zrNNDRdDj7vOs00NF0OPu86zTQ0XQ4+7zrNNDRdDj7vOs00NF0OPu86zTQ0XQ4+7zrNNDRdDj7vOs00NF0OPu86zTQ0A");
                            audio.play().catch(() => { });
                        } catch { }
                    }
                    // Handle session completion
                    if (mode === "focus") {
                        setSessions((s) => s + 1);
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning, mode]);

    const switchMode = useCallback((newMode: TimerMode) => {
        setMode(newMode);
        setTimeLeft(MODES[newMode].duration);
        setIsRunning(false);
    }, []);

    const toggleTimer = () => {
        if (timeLeft === 0) {
            setTimeLeft(MODES[mode].duration);
        }
        setIsRunning(!isRunning);
    };

    const resetTimer = () => {
        setTimeLeft(MODES[mode].duration);
        setIsRunning(false);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const progress = ((MODES[mode].duration - timeLeft) / MODES[mode].duration) * 100;

    return (
        <div className={`min-h-screen bg-gradient-to-br ${MODES[mode].color} transition-all duration-500`}>
            {/* Header */}
            <nav className="bg-black/10 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
                        <span>🛠️</span>
                        <span>VedaWell Tools</span>
                    </Link>
                    <Link href="/tools" className="text-white/80 hover:text-white">
                        ← All Tools
                    </Link>
                </div>
            </nav>

            <main className="py-12 px-6">
                <div className="max-w-md mx-auto">
                    {/* Mode Selector */}
                    <div className="flex justify-center gap-2 mb-8">
                        {(Object.keys(MODES) as TimerMode[]).map((m) => (
                            <button
                                key={m}
                                onClick={() => switchMode(m)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === m
                                    ? "bg-white text-gray-900"
                                    : "bg-white/20 text-white hover:bg-white/30"
                                    }`}
                            >
                                {MODES[m].label}
                            </button>
                        ))}
                    </div>

                    {/* Timer Display */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center">
                        {/* Progress Ring */}
                        <div className="relative w-64 h-64 mx-auto mb-8">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="128"
                                    cy="128"
                                    r="120"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.2)"
                                    strokeWidth="8"
                                />
                                <circle
                                    cx="128"
                                    cy="128"
                                    r="120"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={2 * Math.PI * 120}
                                    strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                                    className="transition-all duration-1000"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-6xl font-bold text-white">
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                        </div>

                        {/* Task Input */}
                        <input
                            type="text"
                            value={currentTask}
                            onChange={(e) => setCurrentTask(e.target.value)}
                            placeholder="What are you working on?"
                            className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/60 border border-white/20 focus:border-white/50 outline-none mb-6 text-center"
                        />

                        {/* Controls */}
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={toggleTimer}
                                className="px-8 py-4 bg-white text-gray-900 rounded-xl font-bold text-lg hover:bg-white/90 transition-colors"
                            >
                                {isRunning ? "Pause" : timeLeft === 0 ? "Restart" : "Start"}
                            </button>
                            <button
                                onClick={resetTimer}
                                className="px-6 py-4 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30 transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Sessions Counter */}
                    <div className="mt-8 text-center">
                        <p className="text-white/80 text-lg">
                            🍅 Sessions completed: <span className="font-bold text-white">{sessions}</span>
                        </p>
                    </div>

                    {/* Tips */}
                    <div className="mt-8 p-6 bg-white/10 backdrop-blur rounded-2xl text-white/80 text-sm">
                        <h3 className="font-bold text-white mb-2">⚡ Pomodoro Technique</h3>
                        <ul className="space-y-1">
                            <li>• Work for 25 minutes, then take a 5-minute break</li>
                            <li>• After 4 sessions, take a longer 15-30 minute break</li>
                            <li>• Stay focused during work sessions - no distractions!</li>
                            <li>• Use breaks to stretch, hydrate, or rest your eyes</li>
                        </ul>
                    </div>

                    <div className="mt-12 bg-black/10 rounded-xl backdrop-blur-sm p-2 w-full max-w-lg mx-auto overflow-hidden">
                        <AdBanner slot="1696472735" format="horizontal" />
                    </div>
                </div>
            </main>
        </div>
    );
}
