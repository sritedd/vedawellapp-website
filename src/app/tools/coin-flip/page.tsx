"use client";

import { useState } from "react";
import Link from "next/link";

export default function CoinFlip() {
    const [result, setResult] = useState<"heads" | "tails" | null>(null);
    const [isFlipping, setIsFlipping] = useState(false);
    const [history, setHistory] = useState<("heads" | "tails")[]>([]);

    const flip = () => {
        setIsFlipping(true);
        setResult(null);

        // Animate through random results
        let count = 0;
        const interval = setInterval(() => {
            setResult(Math.random() < 0.5 ? "heads" : "tails");
            count++;
            if (count > 10) {
                clearInterval(interval);
                const finalResult: "heads" | "tails" = Math.random() < 0.5 ? "heads" : "tails";
                setResult(finalResult);
                setHistory(prev => ([finalResult, ...prev] as ("heads" | "tails")[]).slice(0, 20));
                setIsFlipping(false);
            }
        }, 100);
    };

    const headsCount = history.filter(h => h === "heads").length;
    const tailsCount = history.filter(h => h === "tails").length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-900 via-slate-900 to-slate-900">
            <nav className="border-b border-amber-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-md mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-amber-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">🪙 Coin Flip</h1>
                </div>
            </nav>
            <main className="max-w-md mx-auto p-6 text-center">
                <div className="bg-slate-800/50 rounded-2xl p-8 border border-amber-800/30 mb-6">
                    <div className={`w-40 h-40 mx-auto rounded-full flex items-center justify-center text-6xl mb-6 ${isFlipping ? "animate-spin" : ""} ${result === "heads" ? "bg-yellow-500" : result === "tails" ? "bg-yellow-600" : "bg-slate-700"}`}>
                        {result === "heads" && "👑"}
                        {result === "tails" && "🦅"}
                        {!result && "🪙"}
                    </div>
                    <div className="text-3xl font-bold text-white mb-6 capitalize">{result || "Ready"}</div>
                    <button onClick={flip} disabled={isFlipping} className="px-12 py-4 bg-amber-600 text-white rounded-full text-xl font-medium hover:bg-amber-700 disabled:opacity-50">
                        {isFlipping ? "Flipping..." : "Flip Coin"}
                    </button>
                </div>
                {history.length > 0 && (
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-yellow-400">Heads: {headsCount}</span>
                            <span className="text-slate-400">History ({history.length})</span>
                            <span className="text-yellow-600">Tails: {tailsCount}</span>
                        </div>
                        <div className="flex gap-1 flex-wrap justify-center">
                            {history.map((h, i) => (
                                <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${h === "heads" ? "bg-yellow-500" : "bg-yellow-600"}`}>
                                    {h === "heads" ? "H" : "T"}
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setHistory([])} className="mt-3 text-sm text-slate-400 hover:text-white">Clear History</button>
                    </div>
                )}
            </main>
        </div>
    );
}
