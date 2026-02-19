"use client";

import { useState } from "react";
import Link from "next/link";

export default function PercentageCalculator() {
    const [calc1, setCalc1] = useState({ value: "", percent: "", result: "" });
    const [calc2, setCalc2] = useState({ part: "", whole: "", result: "" });
    const [calc3, setCalc3] = useState({ from: "", to: "", result: "" });

    const calc1Result = () => { const v = parseFloat(calc1.value) || 0; const p = parseFloat(calc1.percent) || 0; return (v * p / 100).toFixed(2); };
    const calc2Result = () => { const p = parseFloat(calc2.part) || 0; const w = parseFloat(calc2.whole) || 0; return w ? ((p / w) * 100).toFixed(2) + "%" : ""; };
    const calc3Result = () => { const f = parseFloat(calc3.from) || 0; const t = parseFloat(calc3.to) || 0; return f ? (((t - f) / f) * 100).toFixed(2) + "%" : ""; };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-900 via-slate-900 to-slate-900">
            <nav className="border-b border-green-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-green-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">📊 Percentage Calculator</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6 space-y-6">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-green-800/30">
                    <h3 className="text-white font-medium mb-4">What is X% of Y?</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-slate-400">What is</span>
                        <input type="number" value={calc1.percent} onChange={(e) => setCalc1({ ...calc1, percent: e.target.value })} className="w-20 px-3 py-2 bg-slate-900 border border-green-700 rounded text-white" />
                        <span className="text-slate-400">% of</span>
                        <input type="number" value={calc1.value} onChange={(e) => setCalc1({ ...calc1, value: e.target.value })} className="w-28 px-3 py-2 bg-slate-900 border border-green-700 rounded text-white" />
                        <span className="text-slate-400">=</span>
                        <span className="text-2xl font-bold text-green-400">{calc1Result()}</span>
                    </div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6 border border-green-800/30">
                    <h3 className="text-white font-medium mb-4">X is what % of Y?</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                        <input type="number" value={calc2.part} onChange={(e) => setCalc2({ ...calc2, part: e.target.value })} className="w-28 px-3 py-2 bg-slate-900 border border-green-700 rounded text-white" />
                        <span className="text-slate-400">is what % of</span>
                        <input type="number" value={calc2.whole} onChange={(e) => setCalc2({ ...calc2, whole: e.target.value })} className="w-28 px-3 py-2 bg-slate-900 border border-green-700 rounded text-white" />
                        <span className="text-slate-400">=</span>
                        <span className="text-2xl font-bold text-green-400">{calc2Result()}</span>
                    </div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6 border border-green-800/30">
                    <h3 className="text-white font-medium mb-4">Percentage Change</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-slate-400">From</span>
                        <input type="number" value={calc3.from} onChange={(e) => setCalc3({ ...calc3, from: e.target.value })} className="w-28 px-3 py-2 bg-slate-900 border border-green-700 rounded text-white" />
                        <span className="text-slate-400">to</span>
                        <input type="number" value={calc3.to} onChange={(e) => setCalc3({ ...calc3, to: e.target.value })} className="w-28 px-3 py-2 bg-slate-900 border border-green-700 rounded text-white" />
                        <span className="text-slate-400">=</span>
                        <span className="text-2xl font-bold text-green-400">{calc3Result()}</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
