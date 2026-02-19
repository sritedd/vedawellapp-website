"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function UnixTimestampConverter() {
    const [timestamp, setTimestamp] = useState(Math.floor(Date.now() / 1000));
    const [dateStr, setDateStr] = useState("");
    const [now, setNow] = useState(Date.now());
    const [copied, setCopied] = useState<string | null>(null);

    useEffect(() => { const interval = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(interval); }, []);

    const timestampToDate = (ts: number) => new Date(ts * 1000);
    const dateToTimestamp = (d: Date) => Math.floor(d.getTime() / 1000);

    const handleDateChange = (value: string) => { setDateStr(value); const d = new Date(value); if (!isNaN(d.getTime())) setTimestamp(dateToTimestamp(d)); };
    const handleTimestampChange = (value: string) => { const ts = parseInt(value) || 0; setTimestamp(ts); setDateStr(timestampToDate(ts).toISOString().slice(0, 16)); };

    const copy = (text: string, name: string) => { navigator.clipboard.writeText(text); setCopied(name); setTimeout(() => setCopied(null), 2000); };

    const formatted = timestampToDate(timestamp);

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-900 via-slate-900 to-slate-900">
            <nav className="border-b border-orange-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-orange-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">🕐 Unix Timestamp Converter</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-orange-800/30 mb-6 text-center">
                    <div className="text-sm text-orange-300 mb-2">Current Unix Timestamp</div>
                    <div className="text-4xl font-mono font-bold text-white">{Math.floor(now / 1000)}</div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-orange-800/30">
                        <label className="block text-sm text-orange-300 mb-2">Unix Timestamp</label>
                        <input type="number" value={timestamp} onChange={(e) => handleTimestampChange(e.target.value)} className="w-full px-4 py-3 bg-slate-900 border border-orange-700 rounded-lg text-white font-mono text-lg" />
                        <button onClick={() => copy(timestamp.toString(), "ts")} className="mt-2 text-sm text-orange-400 hover:text-white">{copied === "ts" ? "✓ Copied" : "Copy"}</button>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-orange-800/30">
                        <label className="block text-sm text-orange-300 mb-2">Date & Time</label>
                        <input type="datetime-local" value={dateStr || formatted.toISOString().slice(0, 16)} onChange={(e) => handleDateChange(e.target.value)} className="w-full px-4 py-3 bg-slate-900 border border-orange-700 rounded-lg text-white" />
                    </div>
                </div>
                <div className="mt-6 bg-slate-800/50 rounded-xl p-6 border border-orange-800/30">
                    <h3 className="text-white font-medium mb-4">Formatted Output</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-slate-900 rounded"><span className="text-slate-400">UTC:</span> <span className="text-white">{formatted.toUTCString()}</span></div>
                        <div className="p-3 bg-slate-900 rounded"><span className="text-slate-400">Local:</span> <span className="text-white">{formatted.toLocaleString()}</span></div>
                        <div className="p-3 bg-slate-900 rounded"><span className="text-slate-400">ISO 8601:</span> <span className="text-white font-mono">{formatted.toISOString()}</span></div>
                        <div className="p-3 bg-slate-900 rounded"><span className="text-slate-400">Milliseconds:</span> <span className="text-white font-mono">{timestamp * 1000}</span></div>
                    </div>
                </div>
            </main>
        </div>
    );
}
