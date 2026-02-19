"use client";

import { useState } from "react";
import Link from "next/link";

export default function CSVToJSON() {
    const [csv, setCSV] = useState("");
    const [json, setJSON] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const convert = () => {
        try {
            const lines = csv.trim().split("\n");
            if (lines.length < 2) { setError("Need at least header + 1 row"); return; }
            const headers = lines[0].split(",").map(h => h.trim());
            const result = lines.slice(1).map(line => {
                const values = line.split(",");
                const obj: Record<string, string> = {};
                headers.forEach((h, i) => obj[h] = values[i]?.trim() || "");
                return obj;
            });
            setJSON(JSON.stringify(result, null, 2));
            setError(null);
        } catch (e) { setError("Failed to parse CSV"); }
    };

    const copy = () => { navigator.clipboard.writeText(json); setCopied(true); setTimeout(() => setCopied(false), 2000); };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-900">
            <nav className="border-b border-emerald-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-emerald-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">📊 CSV to JSON</h1>
                </div>
            </nav>
            <main className="max-w-6xl mx-auto p-6 grid md:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-emerald-800/30">
                    <label className="block text-sm text-emerald-300 mb-2">CSV Input</label>
                    <textarea value={csv} onChange={(e) => setCSV(e.target.value)} rows={15} placeholder="name,age,city&#10;John,30,Sydney&#10;Jane,25,Melbourne" className="w-full px-4 py-3 bg-slate-900 border border-emerald-700 rounded-lg text-white font-mono text-sm focus:outline-none resize-none" />
                    <button onClick={convert} className="w-full mt-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">Convert to JSON</button>
                    {error && <div className="mt-2 text-red-400 text-sm">{error}</div>}
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6 border border-emerald-800/30">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm text-emerald-300">JSON Output</label>
                        <button onClick={copy} disabled={!json} className="text-xs text-emerald-400 hover:text-white disabled:opacity-50">{copied ? "✓ Copied" : "Copy"}</button>
                    </div>
                    <pre className="p-4 bg-slate-900 rounded-lg text-green-400 font-mono text-sm overflow-auto h-[400px]">{json || "JSON will appear here"}</pre>
                </div>
            </main>
        </div>
    );
}
