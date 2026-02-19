"use client";

import { useState } from "react";
import Link from "next/link";

export default function DiceRoller() {
    const [diceCount, setDiceCount] = useState(2);
    const [sides, setSides] = useState(6);
    const [results, setResults] = useState<number[]>([]);
    const [isRolling, setIsRolling] = useState(false);
    const [history, setHistory] = useState<{ results: number[]; total: number }[]>([]);

    const roll = () => {
        setIsRolling(true);
        let count = 0;
        const interval = setInterval(() => {
            setResults(Array.from({ length: diceCount }, () => Math.floor(Math.random() * sides) + 1));
            count++;
            if (count > 10) {
                clearInterval(interval);
                const finalResults = Array.from({ length: diceCount }, () => Math.floor(Math.random() * sides) + 1);
                setResults(finalResults);
                setHistory(prev => [{ results: finalResults, total: finalResults.reduce((a, b) => a + b, 0) }, ...prev].slice(0, 10));
                setIsRolling(false);
            }
        }, 80);
    };

    const total = results.reduce((a, b) => a + b, 0);
    const diceFaces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-slate-900 to-slate-900">
            <nav className="border-b border-red-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-md mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-red-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">🎲 Dice Roller</h1>
                </div>
            </nav>
            <main className="max-w-md mx-auto p-6 text-center">
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-red-800/30 mb-6">
                    <div className="flex justify-center gap-2 mb-4 flex-wrap">
                        {results.length > 0 ? results.map((r, i) => (
                            <div key={i} className={`w-16 h-16 bg-white text-slate-900 rounded-lg flex items-center justify-center text-3xl font-bold ${isRolling ? "animate-bounce" : ""}`}>
                                {sides === 6 ? diceFaces[r - 1] : r}
                            </div>
                        )) : (
                            <div className="text-slate-400 py-4">Click Roll to start</div>
                        )}
                    </div>
                    {results.length > 0 && <div className="text-3xl font-bold text-white mb-4">Total: {total}</div>}
                    <button onClick={roll} disabled={isRolling} className="w-full py-4 bg-red-600 text-white rounded-xl text-xl font-medium hover:bg-red-700 disabled:opacity-50">
                        {isRolling ? "Rolling..." : "🎲 Roll Dice"}
                    </button>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 mb-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-red-300 mb-1">Number of Dice</label>
                            <select value={diceCount} onChange={(e) => { setDiceCount(parseInt(e.target.value)); setResults([]); }} className="w-full px-3 py-2 bg-slate-900 border border-red-700 rounded text-white">
                                {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-red-300 mb-1">Sides</label>
                            <select value={sides} onChange={(e) => { setSides(parseInt(e.target.value)); setResults([]); }} className="w-full px-3 py-2 bg-slate-900 border border-red-700 rounded text-white">
                                {[4, 6, 8, 10, 12, 20, 100].map(n => <option key={n} value={n}>D{n}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                {history.length > 0 && (
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                        <div className="text-sm text-slate-400 mb-2">History</div>
                        <div className="space-y-1">
                            {history.map((h, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                    <span className="text-slate-300">{h.results.join(" + ")}</span>
                                    <span className="text-white font-medium">= {h.total}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
