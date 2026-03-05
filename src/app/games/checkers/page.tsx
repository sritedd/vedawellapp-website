"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

type PieceType = "r" | "b" | "rK" | "bK" | null;
type Board = PieceType[];

function initBoard(): Board {
    const b: Board = Array(64).fill(null);
    for (let r = 0; r < 3; r++)
        for (let c = 0; c < 8; c++)
            if ((r + c) % 2 === 1) b[r * 8 + c] = "b";
    for (let r = 5; r < 8; r++)
        for (let c = 0; c < 8; c++)
            if ((r + c) % 2 === 1) b[r * 8 + c] = "r";
    return b;
}

function getColor(p: PieceType) { return p?.[0] ?? null; }
function isKing(p: PieceType) { return p === "rK" || p === "bK"; }

function getJumps(board: Board, from: number, color: string): number[][] {
    const [r, c] = [Math.floor(from / 8), from % 8];
    const piece = board[from];
    const dirs: [number, number][] = [];
    if (color === "r" || isKing(piece)) dirs.push([-1, -1], [-1, 1]);
    if (color === "b" || isKing(piece)) dirs.push([1, -1], [1, 1]);
    const paths: number[][] = [];

    function dfs(pos: number, visited: Set<number>, path: number[], b: Board) {
        const [pr, pc] = [Math.floor(pos / 8), pos % 8];
        let found = false;
        for (const [dr, dc] of dirs) {
            const mr = pr + dr, mc = pc + dc;
            const jr = pr + dr * 2, jc = pc + dc * 2;
            if (jr < 0 || jr >= 8 || jc < 0 || jc >= 8) continue;
            const mid = mr * 8 + mc, land = jr * 8 + jc;
            const midColor = getColor(b[mid]);
            if (midColor && midColor !== color && !visited.has(mid) && !b[land]) {
                found = true;
                const nb = [...b];
                nb[land] = nb[pos]; nb[pos] = null; nb[mid] = null;
                const nv = new Set(visited); nv.add(mid);
                dfs(land, nv, [...path, land], nb);
            }
        }
        if (!found && path.length > 0) paths.push(path);
    }

    dfs(from, new Set(), [], board);
    return paths;
}

function getSimpleMoves(board: Board, from: number, color: string): number[] {
    const [r, c] = [Math.floor(from / 8), from % 8];
    const piece = board[from];
    const dirs: [number, number][] = [];
    if (color === "r" || isKing(piece)) dirs.push([-1, -1], [-1, 1]);
    if (color === "b" || isKing(piece)) dirs.push([1, -1], [1, 1]);
    const moves: number[] = [];
    for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && !board[nr * 8 + nc]) {
            moves.push(nr * 8 + nc);
        }
    }
    return moves;
}

export default function CheckersGame() {
    const [board, setBoard] = useState<Board>(initBoard);
    const [turn, setTurn] = useState<"r" | "b">("r");
    const [selected, setSelected] = useState<number | null>(null);
    const [highlights, setHighlights] = useState<number[]>([]);
    const [jumpPaths, setJumpPaths] = useState<number[][]>([]);
    const [status, setStatus] = useState("Red's turn");
    const [score, setScore] = useState({ r: 0, b: 0 });

    const checkWin = useCallback((b: Board, next: "r" | "b") => {
        const hasPieces = b.some(p => getColor(p) === next);
        if (!hasPieces) return turn === "r" ? "Red wins!" : "Black wins!";
        // Check if next player can move
        let canMove = false;
        for (let i = 0; i < 64; i++) {
            if (getColor(b[i]) === next) {
                if (getJumps(b, i, next).length > 0 || getSimpleMoves(b, i, next).length > 0) {
                    canMove = true; break;
                }
            }
        }
        if (!canMove) return turn === "r" ? "Red wins!" : "Black wins!";
        return null;
    }, [turn]);

    const handleClick = useCallback((i: number) => {
        if (status.includes("wins")) return;

        if (selected !== null) {
            // Check if clicking a valid move
            if (jumpPaths.length > 0) {
                const path = jumpPaths.find(p => p[p.length - 1] === i);
                if (path) {
                    const nb = [...board];
                    let pos = selected;
                    for (const dest of path) {
                        const midR = (Math.floor(pos / 8) + Math.floor(dest / 8)) / 2;
                        const midC = (pos % 8 + dest % 8) / 2;
                        nb[midR * 8 + midC] = null;
                        nb[dest] = nb[pos]; nb[pos] = null;
                        pos = dest;
                    }
                    // King promotion
                    if (getColor(nb[pos]) === "r" && Math.floor(pos / 8) === 0) nb[pos] = "rK";
                    if (getColor(nb[pos]) === "b" && Math.floor(pos / 8) === 7) nb[pos] = "bK";

                    const next = turn === "r" ? "b" : "r";
                    const win = checkWin(nb, next);
                    setBoard(nb);
                    setTurn(next);
                    setSelected(null); setHighlights([]); setJumpPaths([]);
                    setStatus(win || (next === "r" ? "Red's turn" : "Black's turn"));
                    if (win) setScore(s => ({ ...s, [turn]: s[turn as "r" | "b"] + 1 }));
                    return;
                }
            } else if (highlights.includes(i)) {
                const nb = [...board];
                nb[i] = nb[selected]; nb[selected] = null;
                if (getColor(nb[i]) === "r" && Math.floor(i / 8) === 0) nb[i] = "rK";
                if (getColor(nb[i]) === "b" && Math.floor(i / 8) === 7) nb[i] = "bK";

                const next = turn === "r" ? "b" : "r";
                const win = checkWin(nb, next);
                setBoard(nb);
                setTurn(next);
                setSelected(null); setHighlights([]); setJumpPaths([]);
                setStatus(win || (next === "r" ? "Red's turn" : "Black's turn"));
                if (win) setScore(s => ({ ...s, [turn]: s[turn as "r" | "b"] + 1 }));
                return;
            }
        }

        // Select piece
        if (getColor(board[i]) === turn) {
            const jumps = getJumps(board, i, turn);
            // Check if any piece has jumps (mandatory)
            let anyJumps = false;
            for (let j = 0; j < 64; j++) {
                if (getColor(board[j]) === turn && getJumps(board, j, turn).length > 0) {
                    anyJumps = true; break;
                }
            }
            if (anyJumps && jumps.length === 0) return; // Must jump with a piece that can

            if (jumps.length > 0) {
                setSelected(i);
                setJumpPaths(jumps);
                setHighlights(jumps.map(p => p[p.length - 1]));
            } else if (!anyJumps) {
                const moves = getSimpleMoves(board, i, turn);
                setSelected(i);
                setHighlights(moves);
                setJumpPaths([]);
            }
        } else {
            setSelected(null); setHighlights([]); setJumpPaths([]);
        }
    }, [board, turn, selected, highlights, jumpPaths, status, checkWin]);

    const resetGame = () => {
        setBoard(initBoard());
        setTurn("r");
        setSelected(null); setHighlights([]); setJumpPaths([]);
        setStatus("Red's turn");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-orange-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg mb-4">
                <Link href="/games" className="text-red-200 hover:underline text-sm">← Back to Games</Link>
            </div>

            <h1 className="text-4xl font-bold text-white mb-2">Checkers</h1>
            <p className="text-red-200 mb-2 font-semibold">{status}</p>
            <div className="flex gap-4 mb-4 text-sm text-red-200">
                <span>🔴 Red: {score.r}</span>
                <span>⚫ Black: {score.b}</span>
            </div>

            <div className="border-4 border-amber-950 rounded-lg overflow-hidden">
                <div className="grid grid-cols-8">
                    {board.map((piece, i) => {
                        const [r, c] = [Math.floor(i / 8), i % 8];
                        const isDark = (r + c) % 2 === 1;
                        const isSel = selected === i;
                        const isHL = highlights.includes(i);
                        return (
                            <button
                                key={i}
                                onClick={() => handleClick(i)}
                                className={`w-10 h-10 md:w-14 md:h-14 flex items-center justify-center transition-all
                                    ${isDark ? "bg-[#769656]" : "bg-[#eeeed2]"}
                                    ${isSel ? "ring-4 ring-yellow-400 ring-inset" : ""}
                                    ${isHL ? "ring-4 ring-green-400/60 ring-inset" : ""}`}
                            >
                                {piece && (
                                    <div className={`w-7 h-7 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold
                                        ${getColor(piece) === "r" ? "bg-red-600 border-red-400 text-white" : "bg-gray-800 border-gray-600 text-white"}
                                        ${isKing(piece) ? "ring-2 ring-yellow-400" : ""}`}>
                                        {isKing(piece) ? "♛" : ""}
                                    </div>
                                )}
                                {!piece && isHL && <span className="w-3 h-3 rounded-full bg-green-500/50" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            <button onClick={resetGame} className="mt-6 px-8 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-500 transition-colors">
                New Game
            </button>
            <p className="mt-3 text-red-200/70 text-sm text-center">Click a piece to select, then click destination. Jumps are mandatory.</p>
        </div>
    );
}
