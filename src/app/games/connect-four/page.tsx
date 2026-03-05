"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

const ROWS = 6, COLS = 7;
type Cell = 0 | 1 | 2;

function createBoard(): Cell[][] {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function checkWin(board: Cell[][], player: Cell): number[][] | null {
    const dirs = [[0,1],[1,0],[1,1],[1,-1]];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c] !== player) continue;
            for (const [dr, dc] of dirs) {
                const cells: number[][] = [];
                let ok = true;
                for (let i = 0; i < 4; i++) {
                    const nr = r + dr * i, nc = c + dc * i;
                    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc] !== player) { ok = false; break; }
                    cells.push([nr, nc]);
                }
                if (ok) return cells;
            }
        }
    }
    return null;
}

export default function ConnectFourGame() {
    const [board, setBoard] = useState<Cell[][]>(createBoard);
    const [turn, setTurn] = useState<1 | 2>(1);
    const [status, setStatus] = useState("🔴 Red's turn");
    const [winCells, setWinCells] = useState<Set<string>>(new Set());
    const [score, setScore] = useState({ 1: 0, 2: 0 });
    const [hoverCol, setHoverCol] = useState<number | null>(null);

    const drop = useCallback((col: number) => {
        if (winCells.size > 0 || status.includes("Draw")) return;
        // Find lowest empty row
        let row = -1;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (board[r][col] === 0) { row = r; break; }
        }
        if (row === -1) return;

        const nb = board.map(r => [...r]);
        nb[row][col] = turn;

        const win = checkWin(nb, turn);
        if (win) {
            const ws = new Set(win.map(([r, c]) => `${r},${c}`));
            setBoard(nb);
            setWinCells(ws);
            setStatus(turn === 1 ? "🔴 Red wins!" : "🟡 Yellow wins!");
            setScore(s => ({ ...s, [turn]: s[turn] + 1 }));
            return;
        }

        // Check draw
        if (nb.every(r => r.every(c => c !== 0))) {
            setBoard(nb);
            setStatus("Draw!");
            return;
        }

        const next = turn === 1 ? 2 : 1;
        setBoard(nb);
        setTurn(next as 1 | 2);
        setStatus(next === 1 ? "🔴 Red's turn" : "🟡 Yellow's turn");
    }, [board, turn, winCells, status, score]);

    const resetGame = () => {
        setBoard(createBoard());
        setTurn(1);
        setStatus("🔴 Red's turn");
        setWinCells(new Set());
        setHoverCol(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-800 to-blue-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg mb-4">
                <Link href="/games" className="text-blue-200 hover:underline text-sm">← Back to Games</Link>
            </div>

            <h1 className="text-4xl font-bold text-white mb-2">Connect Four</h1>
            <p className="text-blue-200 mb-2 font-semibold">{status}</p>
            <div className="flex gap-4 mb-4 text-sm text-blue-200">
                <span>🔴 Red: {score[1]}</span>
                <span>🟡 Yellow: {score[2]}</span>
            </div>

            {/* Board */}
            <div className="bg-blue-700 p-3 rounded-xl shadow-2xl">
                <div className="grid grid-cols-7 gap-2">
                    {board.map((row, r) =>
                        row.map((cell, c) => (
                            <button
                                key={`${r}-${c}`}
                                onClick={() => drop(c)}
                                onMouseEnter={() => setHoverCol(c)}
                                onMouseLeave={() => setHoverCol(null)}
                                className={`w-10 h-10 md:w-14 md:h-14 rounded-full transition-all border-2
                                    ${cell === 1 ? "bg-red-500 border-red-400" : cell === 2 ? "bg-yellow-400 border-yellow-300" : "bg-blue-900 border-blue-800"}
                                    ${winCells.has(`${r},${c}`) ? "ring-4 ring-white animate-pulse" : ""}
                                    ${hoverCol === c && cell === 0 ? "bg-blue-800" : ""}
                                    hover:brightness-110`}
                            />
                        ))
                    )}
                </div>
            </div>

            <button onClick={resetGame} className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 transition-colors">
                New Game
            </button>
            <p className="mt-3 text-blue-200/70 text-sm text-center">Click a column to drop your piece. Get 4 in a row to win!</p>
        </div>
    );
}
