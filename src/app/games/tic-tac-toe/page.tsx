"use client";

import { useState } from "react";
import Link from "next/link";

type Player = "X" | "O" | null;
type Board = Player[];

const WINNING_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6], // diagonals
];

export default function TicTacToe() {
    const [board, setBoard] = useState<Board>(Array(9).fill(null));
    const [isXNext, setIsXNext] = useState(true);
    const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });

    const calculateWinner = (squares: Board): { winner: Player; line: number[] | null } => {
        for (const [a, b, c] of WINNING_LINES) {
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return { winner: squares[a], line: [a, b, c] };
            }
        }
        return { winner: null, line: null };
    };

    const { winner, line: winningLine } = calculateWinner(board);
    const isDraw = !winner && board.every((cell) => cell !== null);

    const handleClick = (index: number) => {
        if (board[index] || winner) return;

        const newBoard = [...board];
        newBoard[index] = isXNext ? "X" : "O";
        setBoard(newBoard);
        setIsXNext(!isXNext);

        // Check for winner after move
        const result = calculateWinner(newBoard);
        if (result.winner) {
            setScores((s) => ({
                ...s,
                [result.winner!]: s[result.winner!] + 1,
            }));
        } else if (newBoard.every((cell) => cell !== null)) {
            setScores((s) => ({ ...s, draws: s.draws + 1 }));
        }
    };

    const resetGame = () => {
        setBoard(Array(9).fill(null));
        setIsXNext(true);
    };

    const resetScores = () => {
        setScores({ X: 0, O: 0, draws: 0 });
        resetGame();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 to-cyan-800 flex flex-col items-center justify-center p-4">
            {/* Header */}
            <div className="w-full max-w-md mb-4">
                <Link href="/games" className="text-white/70 hover:text-white text-sm">
                    ← Back to Games
                </Link>
            </div>

            <h1 className="text-4xl font-bold text-white mb-4">⭕ Tic Tac Toe</h1>

            {/* Scores */}
            <div className="flex gap-4 mb-6">
                <div className="bg-blue-500/30 backdrop-blur text-white px-6 py-3 rounded-lg text-center">
                    <div className="text-xs uppercase">X Wins</div>
                    <div className="text-2xl font-bold">{scores.X}</div>
                </div>
                <div className="bg-white/20 backdrop-blur text-white px-6 py-3 rounded-lg text-center">
                    <div className="text-xs uppercase">Draws</div>
                    <div className="text-2xl font-bold">{scores.draws}</div>
                </div>
                <div className="bg-cyan-500/30 backdrop-blur text-white px-6 py-3 rounded-lg text-center">
                    <div className="text-xs uppercase">O Wins</div>
                    <div className="text-2xl font-bold">{scores.O}</div>
                </div>
            </div>

            {/* Status */}
            <div className="text-xl text-white mb-4">
                {winner ? (
                    <span className="font-bold">🎉 {winner} Wins!</span>
                ) : isDraw ? (
                    <span>It's a Draw!</span>
                ) : (
                    <span>
                        Next: <span className="font-bold">{isXNext ? "X" : "O"}</span>
                    </span>
                )}
            </div>

            {/* Game Board */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-white/10 backdrop-blur rounded-xl">
                {board.map((cell, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleClick(idx)}
                        className={`w-20 h-20 md:w-24 md:h-24 rounded-xl flex items-center justify-center text-4xl font-bold transition-all ${winningLine?.includes(idx)
                            ? "bg-green-400 scale-105"
                            : cell
                                ? "bg-white/90"
                                : "bg-white/30 hover:bg-white/50"
                            } ${cell === "X" ? "text-blue-600" : "text-cyan-600"}`}
                        disabled={!!cell || !!winner}
                    >
                        {cell}
                    </button>
                ))}
            </div>

            {/* Controls */}
            <div className="flex gap-4 mt-6">
                <button
                    onClick={resetGame}
                    className="px-6 py-3 bg-white/20 backdrop-blur text-white rounded-lg font-semibold hover:bg-white/30 transition-colors"
                >
                    New Game
                </button>
                <button
                    onClick={resetScores}
                    className="px-6 py-3 bg-red-500/30 backdrop-blur text-white rounded-lg font-semibold hover:bg-red-500/40 transition-colors"
                >
                    Reset Scores
                </button>
            </div>

            <p className="mt-6 text-white/70 text-center">
                Take turns placing X and O. Get 3 in a row to win!
            </p>

        </div>
    );
}
