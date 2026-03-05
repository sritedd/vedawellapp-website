"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

type Piece = string | null;
type Board = Piece[];

const INITIAL: Board = [
    "bR","bN","bB","bQ","bK","bB","bN","bR",
    "bP","bP","bP","bP","bP","bP","bP","bP",
    null,null,null,null,null,null,null,null,
    null,null,null,null,null,null,null,null,
    null,null,null,null,null,null,null,null,
    null,null,null,null,null,null,null,null,
    "wP","wP","wP","wP","wP","wP","wP","wP",
    "wR","wN","wB","wQ","wK","wB","wN","wR",
];

const SYMBOLS: Record<string, string> = {
    wK:"♔",wQ:"♕",wR:"♖",wB:"♗",wN:"♘",wP:"♙",
    bK:"♚",bQ:"♛",bR:"♜",bB:"♝",bN:"♞",bP:"♟",
};

function rc(i: number) { return [Math.floor(i / 8), i % 8]; }
function idx(r: number, c: number) { return r * 8 + c; }
function inBounds(r: number, c: number) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

function getValidMoves(board: Board, from: number, turn: "w" | "b"): number[] {
    const piece = board[from];
    if (!piece || piece[0] !== turn) return [];
    const [r, c] = rc(from);
    const type = piece[1];
    const moves: number[] = [];
    const enemy = turn === "w" ? "b" : "w";

    const addIfValid = (tr: number, tc: number) => {
        if (!inBounds(tr, tc)) return false;
        const target = board[idx(tr, tc)];
        if (target && target[0] === turn) return false;
        moves.push(idx(tr, tc));
        return !target;
    };

    const slide = (dirs: [number, number][]) => {
        for (const [dr, dc] of dirs) {
            for (let i = 1; i < 8; i++) {
                if (!addIfValid(r + dr * i, c + dc * i)) break;
            }
        }
    };

    if (type === "P") {
        const dir = turn === "w" ? -1 : 1;
        const startRow = turn === "w" ? 6 : 1;
        if (inBounds(r + dir, c) && !board[idx(r + dir, c)]) {
            moves.push(idx(r + dir, c));
            if (r === startRow && !board[idx(r + dir * 2, c)]) {
                moves.push(idx(r + dir * 2, c));
            }
        }
        for (const dc of [-1, 1]) {
            if (inBounds(r + dir, c + dc) && board[idx(r + dir, c + dc)]?.[0] === enemy) {
                moves.push(idx(r + dir, c + dc));
            }
        }
    } else if (type === "N") {
        for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
            addIfValid(r + dr, c + dc);
        }
    } else if (type === "B") {
        slide([[-1,-1],[-1,1],[1,-1],[1,1]]);
    } else if (type === "R") {
        slide([[-1,0],[1,0],[0,-1],[0,1]]);
    } else if (type === "Q") {
        slide([[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]);
    } else if (type === "K") {
        for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
            addIfValid(r + dr, c + dc);
        }
    }
    return moves;
}

function isInCheck(board: Board, color: "w" | "b"): boolean {
    const kingIdx = board.findIndex(p => p === color + "K");
    if (kingIdx === -1) return false;
    const enemy = color === "w" ? "b" : "w";
    for (let i = 0; i < 64; i++) {
        if (board[i]?.[0] === enemy) {
            if (getValidMoves(board, i, enemy).includes(kingIdx)) return true;
        }
    }
    return false;
}

function getLegalMoves(board: Board, from: number, turn: "w" | "b"): number[] {
    return getValidMoves(board, from, turn).filter(to => {
        const newBoard = [...board];
        newBoard[to] = newBoard[from];
        newBoard[from] = null;
        return !isInCheck(newBoard, turn);
    });
}

function hasAnyLegalMove(board: Board, color: "w" | "b"): boolean {
    for (let i = 0; i < 64; i++) {
        if (board[i]?.[0] === color && getLegalMoves(board, i, color).length > 0) return true;
    }
    return false;
}

export default function ChessGame() {
    const [board, setBoard] = useState<Board>([...INITIAL]);
    const [turn, setTurn] = useState<"w" | "b">("w");
    const [selected, setSelected] = useState<number | null>(null);
    const [validMoves, setValidMoves] = useState<number[]>([]);
    const [status, setStatus] = useState<string>("White to move");
    const [captured, setCaptured] = useState<{ w: string[]; b: string[] }>({ w: [], b: [] });

    const resetGame = () => {
        setBoard([...INITIAL]);
        setTurn("w");
        setSelected(null);
        setValidMoves([]);
        setStatus("White to move");
        setCaptured({ w: [], b: [] });
    };

    const handleClick = useCallback((i: number) => {
        if (status.includes("Checkmate") || status.includes("Stalemate")) return;

        if (selected !== null && validMoves.includes(i)) {
            const newBoard = [...board];
            const capturedPiece = newBoard[i];
            let movingPiece = newBoard[selected]!;

            // Pawn promotion
            const [tr] = rc(i);
            if (movingPiece[1] === "P" && (tr === 0 || tr === 7)) {
                movingPiece = movingPiece[0] + "Q";
            }

            newBoard[i] = movingPiece;
            newBoard[selected] = null;

            const newCaptured = { ...captured };
            if (capturedPiece) {
                newCaptured[capturedPiece[0] as "w" | "b"] = [...newCaptured[capturedPiece[0] as "w" | "b"], capturedPiece];
            }

            const nextTurn = turn === "w" ? "b" : "w";
            const inCheck = isInCheck(newBoard, nextTurn);
            const canMove = hasAnyLegalMove(newBoard, nextTurn);

            let newStatus: string;
            if (!canMove && inCheck) {
                newStatus = `Checkmate! ${turn === "w" ? "White" : "Black"} wins!`;
            } else if (!canMove) {
                newStatus = "Stalemate — Draw!";
            } else if (inCheck) {
                newStatus = `${nextTurn === "w" ? "White" : "Black"} in Check!`;
            } else {
                newStatus = `${nextTurn === "w" ? "White" : "Black"} to move`;
            }

            setBoard(newBoard);
            setTurn(nextTurn);
            setSelected(null);
            setValidMoves([]);
            setStatus(newStatus);
            setCaptured(newCaptured);
        } else if (board[i]?.[0] === turn) {
            const moves = getLegalMoves(board, i, turn);
            setSelected(i);
            setValidMoves(moves);
        } else {
            setSelected(null);
            setValidMoves([]);
        }
    }, [board, turn, selected, validMoves, status, captured]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-yellow-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg mb-4">
                <Link href="/games" className="text-amber-200 hover:underline text-sm">← Back to Games</Link>
            </div>

            <h1 className="text-4xl font-bold text-white mb-2">♚ Chess</h1>
            <p className="text-amber-200 mb-4 font-semibold">{status}</p>

            {/* Captured pieces */}
            <div className="flex gap-4 mb-3 text-lg">
                <div className="text-white/80">{captured.b.map(p => SYMBOLS[p]).join(" ")}</div>
                <div className="text-white/80">{captured.w.map(p => SYMBOLS[p]).join(" ")}</div>
            </div>

            {/* Board */}
            <div className="border-4 border-amber-950 rounded-lg overflow-hidden">
                <div className="grid grid-cols-8">
                    {board.map((piece, i) => {
                        const [r, c] = rc(i);
                        const isDark = (r + c) % 2 === 1;
                        const isSelected = selected === i;
                        const isValidMove = validMoves.includes(i);
                        return (
                            <button
                                key={i}
                                onClick={() => handleClick(i)}
                                className={`w-10 h-10 md:w-14 md:h-14 flex items-center justify-center text-2xl md:text-4xl transition-all
                                    ${isDark ? "bg-[#b58863]" : "bg-[#f0d9b5]"}
                                    ${isSelected ? "ring-4 ring-yellow-400 ring-inset z-10" : ""}
                                    ${isValidMove ? (piece ? "ring-4 ring-red-400 ring-inset" : "ring-4 ring-green-400/60 ring-inset") : ""}
                                    hover:brightness-110`}
                            >
                                {piece ? SYMBOLS[piece] : isValidMove ? <span className="w-3 h-3 rounded-full bg-green-600/40" /> : null}
                            </button>
                        );
                    })}
                </div>
            </div>

            <button onClick={resetGame} className="mt-6 px-8 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-500 transition-colors">
                New Game
            </button>
            <p className="mt-3 text-amber-200/70 text-sm text-center">Click a piece to select, then click a destination. Pawns auto-promote to Queen.</p>
        </div>
    );
}
