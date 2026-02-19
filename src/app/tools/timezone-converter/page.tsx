"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const TIMEZONES = [
    { id: "Pacific/Auckland", name: "Auckland", offset: 13 },
    { id: "Australia/Sydney", name: "Sydney", offset: 11 },
    { id: "Asia/Tokyo", name: "Tokyo", offset: 9 },
    { id: "Asia/Singapore", name: "Singapore", offset: 8 },
    { id: "Asia/Kolkata", name: "Mumbai", offset: 5.5 },
    { id: "Europe/London", name: "London", offset: 0 },
    { id: "Europe/Paris", name: "Paris", offset: 1 },
    { id: "America/New_York", name: "New York", offset: -5 },
    { id: "America/Chicago", name: "Chicago", offset: -6 },
    { id: "America/Denver", name: "Denver", offset: -7 },
    { id: "America/Los_Angeles", name: "Los Angeles", offset: -8 },
];

export default function TimezoneConverter() {
    const [sourceZone, setSourceZone] = useState("Australia/Sydney");
    const [sourceTime, setSourceTime] = useState("");
    const [now, setNow] = useState(new Date());

    useEffect(() => { const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i); }, []);

    const getTimeInZone = (date: Date, timezone: string) => {
        return new Intl.DateTimeFormat("en-AU", { timeZone: timezone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).format(date);
    };

    const getDateInZone = (date: Date, timezone: string) => {
        return new Intl.DateTimeFormat("en-AU", { timeZone: timezone, weekday: "short", month: "short", day: "numeric" }).format(date);
    };

    const convertedTimes = TIMEZONES.map(tz => ({
        ...tz,
        time: getTimeInZone(now, tz.id),
        date: getDateInZone(now, tz.id),
    }));

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-slate-900">
            <nav className="border-b border-purple-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-purple-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">🌍 Time Zone Converter</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-800/30 mb-6 text-center">
                    <div className="text-sm text-purple-300 mb-2">Your Local Time</div>
                    <div className="text-5xl font-mono font-bold text-white">{now.toLocaleTimeString()}</div>
                    <div className="text-slate-400">{now.toLocaleDateString("en-AU", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {convertedTimes.map(tz => (
                        <div key={tz.id} className="bg-slate-800/50 rounded-xl p-4 border border-purple-800/30">
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-white font-medium">{tz.name}</div>
                                <div className="text-xs text-purple-400">UTC{tz.offset >= 0 ? "+" : ""}{tz.offset}</div>
                            </div>
                            <div className="text-2xl font-mono text-purple-300">{tz.time}</div>
                            <div className="text-sm text-slate-400">{tz.date}</div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
