"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function MeetingCostCalculator() {
    const [attendees, setAttendees] = useState(5);
    const [hourlyRate, setHourlyRate] = useState(50);
    const [duration, setDuration] = useState(60);
    const [elapsed, setElapsed] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning) interval = setInterval(() => setElapsed(e => e + 1), 1000);
        return () => clearInterval(interval);
    }, [isRunning]);

    const costPerSecond = (attendees * hourlyRate) / 3600;
    const totalCost = costPerSecond * elapsed;
    const projectedCost = (attendees * hourlyRate * duration) / 60;

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-slate-900 to-slate-900">
            <nav className="border-b border-red-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-red-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">💸 Meeting Cost Calculator</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <div className="bg-slate-800/50 rounded-2xl p-8 border border-red-800/30 mb-6 text-center">
                    <div className="text-6xl font-mono font-bold text-red-400 mb-2">${totalCost.toFixed(2)}</div>
                    <div className="text-slate-400">Time: {formatTime(elapsed)}</div>
                    <div className="flex justify-center gap-4 mt-6">
                        <button onClick={() => setIsRunning(!isRunning)} className={`px-8 py-3 rounded-xl font-medium ${isRunning ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}>{isRunning ? "Stop" : "Start"}</button>
                        <button onClick={() => { setIsRunning(false); setElapsed(0); }} className="px-8 py-3 bg-slate-700 text-white rounded-xl font-medium">Reset</button>
                    </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-red-800/30">
                        <label className="block text-sm text-red-300 mb-2">Attendees</label>
                        <input type="number" value={attendees} onChange={(e) => setAttendees(parseInt(e.target.value) || 1)} min="1" className="w-full px-4 py-2 bg-slate-900 border border-red-700 rounded-lg text-white text-2xl text-center" />
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-red-800/30">
                        <label className="block text-sm text-red-300 mb-2">Avg Hourly Rate ($)</label>
                        <input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(parseInt(e.target.value) || 0)} min="0" className="w-full px-4 py-2 bg-slate-900 border border-red-700 rounded-lg text-white text-2xl text-center" />
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-red-800/30">
                        <label className="block text-sm text-red-300 mb-2">Duration (min)</label>
                        <input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 0)} min="0" className="w-full px-4 py-2 bg-slate-900 border border-red-700 rounded-lg text-white text-2xl text-center" />
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-amber-800/30 text-center">
                        <div className="text-sm text-amber-300 mb-2">Projected Total Cost</div>
                        <div className="text-3xl font-bold text-amber-400">${projectedCost.toFixed(2)}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-800/30 text-center">
                        <div className="text-sm text-blue-300 mb-2">Cost Per Minute</div>
                        <div className="text-3xl font-bold text-blue-400">${(costPerSecond * 60).toFixed(2)}</div>
                    </div>
                </div>
            </main>
        </div>
    );
}
