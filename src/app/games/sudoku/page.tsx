"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

function generatePuzzle(): { puzzle: number[]; solution: number[] } {
    const grid = Array(81).fill(0);

    function isValid(g: number[], pos: number, num: number): boolean {
        const row = Math.floor(pos / 9), col = pos % 9;
        for (let i = 0; i < 9; i++) {
            if (g[row * 9 + i] === num || g[i * 9 + col] === num) return false;
        }
        const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
        for (let r = br; r < br + 3; r++)
            for (let c = bc; c < bc + 3; c++)
                if (g[r * 9 + c] === num) return false;
        return true;
    }

    function solve(g: number[]): boolean {
        const empty = g.indexOf(0);
        if (empty === -1) return true;
        const nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
        for (const n of nums) {
            if (isValid(g, empty, n)) {
                g[empty] = n;
                if (solve(g)) return true;
                g[empty] = 0;
            }
        }
        return false;
    }

    solve(grid);
    const solution = [...grid];
    const puzzle = [...grid];

    // Remove ~45 cells for medium difficulty
    const indices = Array.from({length: 81}, (_, i) => i).sort(() => Math.random() - 0.5);
    for (let i = 0; i < 45; i++) {
        puzzle[indices[i]] = 0;
    }

    return { puzzle, solution };
}

export default function SudokuGame() {
    const [puzzle, setPuzzle] = useState<number[]>(Array(81).fill(0));
    const [solution, setSolution] = useState<number[]>(Array(81).fill(0));
    const [board, setBoard] = useState<number[]>(Array(81).fill(0));
    const [fixed, setFixed] = useState<boolean[]>(Array(81).fill(false));
    const [selected, setSelected] = useState<number | null>(null);
    const [errors, setErrors] = useState<Set<number>>(new Set());
    const [won, setWon] = useState(false);
    const [timer, setTimer] = useState(0);

    const newGame = useCallback(() => {
        const { puzzle: p, solution: s } = generatePuzzle();
        setPuzzle(p);
        setSolution(s);
        setBoard([...p]);
        setFixed(p.map(v => v !== 0));
        setSelected(null);
        setErrors(new Set());
        setWon(false);
        setTimer(0);
    }, []);

    useEffect(() => { newGame(); }, [newGame]);

    useEffect(() => {
        if (won) return;
        const interval = setInterval(() => setTimer(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, [won]);

    const handleInput = useCallback((num: number) => {
        if (selected === null || fixed[selected] || won) return;
        const newBoard = [...board];
        newBoard[selected] = num;
        setBoard(newBoard);

        // Check errors
        const newErrors = new Set<number>();
        for (let i = 0; i < 81; i++) {
            if (newBoard[i] !== 0 && newBoard[i] !== solution[i]) {
                newErrors.add(i);
            }
        }
        setErrors(newErrors);

        // Check win
        if (newBoard.every((v, i) => v === solution[i])) {
            setWon(true);
        }
    }, [selected, fixed, board, solution, won]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            const num = parseInt(e.key);
            if (num >= 1 && num <= 9) handleInput(num);
            if (e.key === "Backspace" || e.key === "Delete") handleInput(0);
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [handleInput]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md mb-4">
                <Link href="/games" className="text-blue-200 hover:underline text-sm">← Back to Games</Link>
            </div>

            <h1 className="text-4xl font-bold text-white mb-2">Sudoku</h1>
            <div className="flex gap-4 mb-4 text-blue-200">
                <span>⏱ {formatTime(timer)}</span>
                {won && <span className="text-green-400 font-bold">🎉 Solved!</span>}
            </div>

            {/* Board */}
            <div className="bg-white p-1 rounded-lg">
                <div className="grid grid-cols-9" style={{ gap: "1px" }}>
                    {board.map((val, i) => {
                        const row = Math.floor(i / 9), col = i % 9;
                        const borderR = col === 2 || col === 5 ? "border-r-2 border-r-gray-800" : "";
                        const borderB = row === 2 || row === 5 ? "border-b-2 border-b-gray-800" : "";
                        return (
                            <button
                                key={i}
                                onClick={() => setSelected(i)}
                                className={`w-9 h-9 md:w-11 md:h-11 flex items-center justify-center text-lg md:text-xl font-bold border border-gray-300 transition-colors
                                    ${borderR} ${borderB}
                                    ${selected === i ? "bg-blue-200" : "bg-white"}
                                    ${fixed[i] ? "text-gray-800" : errors.has(i) ? "text-red-500 bg-red-50" : "text-blue-600"}
                                    ${!fixed[i] ? "hover:bg-blue-100 cursor-pointer" : "cursor-default"}`}
                            >
                                {val || ""}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Number pad */}
            <div className="flex gap-2 mt-4 flex-wrap justify-center">
                {[1,2,3,4,5,6,7,8,9].map(n => (
                    <button
                        key={n}
                        onClick={() => handleInput(n)}
                        className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-500 transition-colors"
                    >
                        {n}
                    </button>
                ))}
                <button
                    onClick={() => handleInput(0)}
                    className="w-10 h-10 md:w-12 md:h-12 bg-gray-600 text-white rounded-lg font-bold text-sm hover:bg-gray-500 transition-colors"
                >
                    ✕
                </button>
            </div>

            <button onClick={newGame} className="mt-4 px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-500 transition-colors">
                New Game
            </button>
            <p className="mt-3 text-blue-200/70 text-sm text-center">Click a cell, then a number. Use keyboard 1-9 or Backspace.</p>
        </div>
    );
}
