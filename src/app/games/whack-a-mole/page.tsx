"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

const GRID = 9;
const GAME_TIME = 30;

export default function WhackAMoleGame() {
    const [moles, setMoles] = useState<boolean[]>(Array(GRID).fill(false));
    const [score, setScore] = useState(0);
    const [best, setBest] = useState(0);
    const [timeLeft, setTimeLeft] = useState(GAME_TIME);
    const [playing, setPlaying] = useState(false);
    const [misses, setMisses] = useState(0);
    const moleTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem("whack-best");
        if (saved) setBest(parseInt(saved));
    }, []);

    const clearMoleTimers = () => {
        moleTimers.current.forEach(clearTimeout);
        moleTimers.current = [];
    };

    const spawnMole = useCallback(() => {
        const idx = Math.floor(Math.random() * GRID);
        setMoles(m => {
            const nm = [...m];
            nm[idx] = true;
            return nm;
        });
        const hideTimer = setTimeout(() => {
            setMoles(m => {
                const nm = [...m];
                if (nm[idx]) {
                    nm[idx] = false;
                    setMisses(ms => ms + 1);
                }
                return nm;
            });
        }, 800 + Math.random() * 600);
        moleTimers.current.push(hideTimer);
    }, []);

    const startGame = useCallback(() => {
        clearMoleTimers();
        setScore(0);
        setMisses(0);
        setTimeLeft(GAME_TIME);
        setMoles(Array(GRID).fill(false));
        setPlaying(true);
    }, []);

    useEffect(() => {
        if (!playing) return;
        const interval = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    setPlaying(false);
                    clearMoleTimers();
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [playing]);

    useEffect(() => {
        if (!playing) return;
        const speed = Math.max(400, 900 - score * 20);
        const interval = setInterval(spawnMole, speed);
        return () => clearInterval(interval);
    }, [playing, spawnMole, score]);

    useEffect(() => {
        if (!playing && timeLeft === 0 && score > best) {
            setBest(score);
            localStorage.setItem("whack-best", score.toString());
        }
    }, [playing, timeLeft, score, best]);

    const whack = (idx: number) => {
        if (!playing || !moles[idx]) return;
        setMoles(m => { const nm = [...m]; nm[idx] = false; return nm; });
        setScore(s => s + 1);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-800 to-emerald-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md mb-4">
                <Link href="/games" className="text-green-200 hover:underline text-sm">← Back to Games</Link>
            </div>

            <h1 className="text-4xl font-bold text-white mb-2">🔨 Whack-a-Mole</h1>
            <div className="flex gap-4 mb-4 text-green-200">
                <span>Score: {score}</span>
                <span>Best: {best}</span>
                <span>⏱ {timeLeft}s</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
                {moles.map((hasMole, i) => (
                    <button
                        key={i}
                        onClick={() => whack(i)}
                        className={`w-24 h-24 md:w-28 md:h-28 rounded-2xl border-4 transition-all duration-100
                            ${hasMole
                                ? "bg-amber-700 border-amber-500 scale-110 cursor-pointer shadow-lg shadow-amber-500/30"
                                : "bg-green-950 border-green-800 cursor-default"}
                            active:scale-95`}
                    >
                        {hasMole && <span className="text-4xl md:text-5xl">🐹</span>}
                        {!hasMole && <div className="w-12 h-4 bg-green-900 rounded-full mx-auto mt-12" />}
                    </button>
                ))}
            </div>

            {!playing && (
                <button onClick={startGame} className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-500 transition-colors">
                    {timeLeft === 0 ? "Play Again" : "Start Game"}
                </button>
            )}
            {!playing && timeLeft === 0 && (
                <p className="mt-3 text-green-200 font-semibold">Final Score: {score} | Missed: {misses}</p>
            )}
            <p className="mt-4 text-green-300/60 text-sm text-center">Tap the moles before they hide! 30 seconds.</p>
        </div>
    );
}
