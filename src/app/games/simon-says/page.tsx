"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";

const COLORS = ["green", "red", "yellow", "blue"] as const;
type Color = typeof COLORS[number];

const COLOR_STYLES: Record<Color, { base: string; active: string }> = {
    green: { base: "bg-green-600 hover:bg-green-500", active: "bg-green-300 shadow-lg shadow-green-400/50" },
    red: { base: "bg-red-600 hover:bg-red-500", active: "bg-red-300 shadow-lg shadow-red-400/50" },
    yellow: { base: "bg-yellow-500 hover:bg-yellow-400", active: "bg-yellow-200 shadow-lg shadow-yellow-400/50" },
    blue: { base: "bg-blue-600 hover:bg-blue-500", active: "bg-blue-300 shadow-lg shadow-blue-400/50" },
};

export default function SimonSaysGame() {
    const [sequence, setSequence] = useState<Color[]>([]);
    const [playerIndex, setPlayerIndex] = useState(0);
    const [activeColor, setActiveColor] = useState<Color | null>(null);
    const [status, setStatus] = useState<"idle" | "showing" | "input" | "gameover">("idle");
    const [score, setScore] = useState(0);
    const [best, setBest] = useState(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem("simon-best");
        if (saved) setBest(parseInt(saved));
    }, []);

    const clearTimeouts = () => {
        timeoutRef.current.forEach(clearTimeout);
        timeoutRef.current = [];
    };

    const playSequence = useCallback((seq: Color[]) => {
        setStatus("showing");
        clearTimeouts();
        seq.forEach((color, i) => {
            const t1 = setTimeout(() => setActiveColor(color), i * 600);
            const t2 = setTimeout(() => setActiveColor(null), i * 600 + 400);
            timeoutRef.current.push(t1, t2);
        });
        const t3 = setTimeout(() => {
            setStatus("input");
            setPlayerIndex(0);
        }, seq.length * 600 + 200);
        timeoutRef.current.push(t3);
    }, []);

    const startGame = useCallback(() => {
        const first = COLORS[Math.floor(Math.random() * 4)];
        const seq = [first];
        setSequence(seq);
        setScore(0);
        playSequence(seq);
    }, [playSequence]);

    const nextRound = useCallback((currentSeq: Color[]) => {
        const next = COLORS[Math.floor(Math.random() * 4)];
        const newSeq = [...currentSeq, next];
        setSequence(newSeq);
        setScore(newSeq.length - 1);
        setTimeout(() => playSequence(newSeq), 800);
    }, [playSequence]);

    const handlePress = useCallback((color: Color) => {
        if (status !== "input") return;

        setActiveColor(color);
        setTimeout(() => setActiveColor(null), 200);

        if (color === sequence[playerIndex]) {
            const nextIdx = playerIndex + 1;
            if (nextIdx === sequence.length) {
                const newScore = sequence.length;
                if (newScore > best) {
                    setBest(newScore);
                    localStorage.setItem("simon-best", newScore.toString());
                }
                setScore(newScore);
                nextRound(sequence);
            } else {
                setPlayerIndex(nextIdx);
            }
        } else {
            setStatus("gameover");
            clearTimeouts();
        }
    }, [status, sequence, playerIndex, best, nextRound]);

    useEffect(() => {
        return () => clearTimeouts();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md mb-4">
                <Link href="/games" className="text-gray-300 hover:underline text-sm">← Back to Games</Link>
            </div>

            <h1 className="text-4xl font-bold text-white mb-2">Simon Says</h1>
            <div className="flex gap-4 mb-4 text-gray-300">
                <span>Score: {score}</span>
                <span>Best: {best}</span>
            </div>

            {/* Game board */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {COLORS.map(color => (
                    <button
                        key={color}
                        onClick={() => handlePress(color)}
                        disabled={status !== "input"}
                        className={`w-28 h-28 md:w-36 md:h-36 rounded-2xl transition-all duration-150 border-4 border-white/10
                            ${activeColor === color ? COLOR_STYLES[color].active : COLOR_STYLES[color].base}
                            ${status === "input" ? "cursor-pointer active:scale-95" : "cursor-default"}`}
                    />
                ))}
            </div>

            {status === "idle" && (
                <button onClick={startGame} className="px-8 py-3 bg-white text-gray-900 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors">
                    Start Game
                </button>
            )}
            {status === "showing" && (
                <p className="text-yellow-400 font-semibold text-lg animate-pulse">Watch the sequence...</p>
            )}
            {status === "input" && (
                <p className="text-green-400 font-semibold text-lg">Your turn! ({playerIndex + 1}/{sequence.length})</p>
            )}
            {status === "gameover" && (
                <div className="text-center">
                    <p className="text-red-400 font-bold text-xl mb-3">Game Over! Score: {score}</p>
                    <button onClick={startGame} className="px-8 py-3 bg-white text-gray-900 rounded-lg font-bold hover:bg-gray-100 transition-colors">
                        Play Again
                    </button>
                </div>
            )}
            <p className="mt-4 text-gray-400 text-sm text-center">Repeat the color sequence. Each round adds one more!</p>
        </div>
    );
}
