"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

export default function CountdownTimer() {
    const [targetDate, setTargetDate] = useState("");
    const [targetTime, setTargetTime] = useState("00:00");
    const [eventName, setEventName] = useState("My Event");
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isActive, setIsActive] = useState(false);
    const [isPast, setIsPast] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const calculateTimeLeft = useCallback(() => {
        if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        const target = new Date(`${targetDate}T${targetTime}`);
        const now = new Date();
        const diff = target.getTime() - now.getTime();

        if (diff <= 0) {
            setIsPast(true);
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        setIsPast(false);
        return {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / 1000 / 60) % 60),
            seconds: Math.floor((diff / 1000) % 60),
        };
    }, [targetDate, targetTime]);

    useEffect(() => {
        if (targetDate) {
            setIsActive(true);
            setTimeLeft(calculateTimeLeft());
            intervalRef.current = setInterval(() => {
                setTimeLeft(calculateTimeLeft());
            }, 1000);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [targetDate, targetTime, calculateTimeLeft]);

    const setQuickDate = (days: number) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        setTargetDate(date.toISOString().split("T")[0]);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-900 via-slate-900 to-slate-900">
            <nav className="border-b border-rose-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-rose-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">⏱️ Countdown Timer</h1>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto p-6">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-rose-800/30 mb-6">
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Event Name" className="px-4 py-2 bg-slate-900 border border-rose-700 rounded-lg text-white" />
                        <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="px-4 py-2 bg-slate-900 border border-rose-700 rounded-lg text-white" />
                        <input type="time" value={targetTime} onChange={(e) => setTargetTime(e.target.value)} className="px-4 py-2 bg-slate-900 border border-rose-700 rounded-lg text-white" />
                    </div>
                    <div className="flex gap-2">
                        {[1, 7, 30, 90, 365].map((d) => (
                            <button key={d} onClick={() => setQuickDate(d)} className="px-3 py-1 bg-slate-700 text-white rounded text-sm hover:bg-slate-600">
                                +{d}d
                            </button>
                        ))}
                    </div>
                </div>

                {isActive && (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-8">{eventName}</h2>
                        {isPast ? (
                            <div className="text-4xl font-bold text-rose-400">🎉 Event has passed!</div>
                        ) : (
                            <div className="grid grid-cols-4 gap-4">
                                {[
                                    { label: "Days", value: timeLeft.days },
                                    { label: "Hours", value: timeLeft.hours },
                                    { label: "Minutes", value: timeLeft.minutes },
                                    { label: "Seconds", value: timeLeft.seconds },
                                ].map((item) => (
                                    <div key={item.label} className="bg-slate-800/50 rounded-xl p-6 border border-rose-800/30">
                                        <div className="text-5xl font-bold text-rose-400">{String(item.value).padStart(2, "0")}</div>
                                        <div className="text-slate-400 text-sm mt-2">{item.label}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
