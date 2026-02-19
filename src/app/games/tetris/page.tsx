"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

const COLS = 10;
const ROWS = 20;
const CELL_SIZE = 28;

const TETROMINOS = {
    I: { shape: [[1, 1, 1, 1]], color: "#00f0f0" },
    O: { shape: [[1, 1], [1, 1]], color: "#f0f000" },
    T: { shape: [[0, 1, 0], [1, 1, 1]], color: "#a000f0" },
    S: { shape: [[0, 1, 1], [1, 1, 0]], color: "#00f000" },
    Z: { shape: [[1, 1, 0], [0, 1, 1]], color: "#f00000" },
    J: { shape: [[1, 0, 0], [1, 1, 1]], color: "#0000f0" },
    L: { shape: [[0, 0, 1], [1, 1, 1]], color: "#f0a000" },
};

type TetrominoKey = keyof typeof TETROMINOS;

interface Piece {
    type: TetrominoKey;
    shape: number[][];
    x: number;
    y: number;
    color: string;
}

export default function Tetris() {
    const [board, setBoard] = useState<(string | null)[][]>(
        Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
    );
    const [piece, setPiece] = useState<Piece | null>(null);
    const [nextPiece, setNextPiece] = useState<TetrominoKey | null>(null);
    const [score, setScore] = useState(0);
    const [lines, setLines] = useState(0);
    const [level, setLevel] = useState(1);
    const [gameOver, setGameOver] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);

    const boardRef = useRef(board);
    boardRef.current = board;

    const getRandomPiece = (): Piece => {
        const types = Object.keys(TETROMINOS) as TetrominoKey[];
        const type = types[Math.floor(Math.random() * types.length)];
        const { shape, color } = TETROMINOS[type];
        return {
            type,
            shape: shape.map(row => [...row]),
            x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
            y: 0,
            color,
        };
    };

    const isValidMove = (p: Piece, board: (string | null)[][]): boolean => {
        for (let y = 0; y < p.shape.length; y++) {
            for (let x = 0; x < p.shape[y].length; x++) {
                if (p.shape[y][x]) {
                    const newX = p.x + x;
                    const newY = p.y + y;
                    if (newX < 0 || newX >= COLS || newY >= ROWS) return false;
                    if (newY >= 0 && board[newY][newX]) return false;
                }
            }
        }
        return true;
    };

    const rotatePiece = (p: Piece): Piece => {
        const newShape = p.shape[0].map((_, i) =>
            p.shape.map(row => row[i]).reverse()
        );
        return { ...p, shape: newShape };
    };

    const lockPiece = useCallback(() => {
        if (!piece) return;

        const newBoard = boardRef.current.map(row => [...row]);

        // Add piece to board
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const boardY = piece.y + y;
                    const boardX = piece.x + x;
                    if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                        newBoard[boardY][boardX] = piece.color;
                    }
                }
            }
        }

        // Clear completed lines
        let clearedLines = 0;
        for (let y = ROWS - 1; y >= 0; y--) {
            if (newBoard[y].every(cell => cell !== null)) {
                newBoard.splice(y, 1);
                newBoard.unshift(Array(COLS).fill(null));
                clearedLines++;
                y++; // Check same row again
            }
        }

        if (clearedLines > 0) {
            const points = [0, 100, 300, 500, 800][clearedLines] * level;
            setScore(s => s + points);
            setLines(l => {
                const newLines = l + clearedLines;
                setLevel(Math.floor(newLines / 10) + 1);
                return newLines;
            });
        }

        setBoard(newBoard);

        // Spawn new piece
        const newPiece = nextPiece ? {
            type: nextPiece,
            shape: TETROMINOS[nextPiece].shape.map(row => [...row]),
            x: Math.floor(COLS / 2) - Math.floor(TETROMINOS[nextPiece].shape[0].length / 2),
            y: 0,
            color: TETROMINOS[nextPiece].color,
        } : getRandomPiece();

        if (!isValidMove(newPiece, newBoard)) {
            setGameOver(true);
            setPiece(null);
            return;
        }

        setPiece(newPiece);
        setNextPiece(Object.keys(TETROMINOS)[Math.floor(Math.random() * 7)] as TetrominoKey);
    }, [piece, nextPiece, level]);

    const movePiece = useCallback((dx: number, dy: number) => {
        if (!piece || gameOver || isPaused) return;

        const newPiece = { ...piece, x: piece.x + dx, y: piece.y + dy };

        if (isValidMove(newPiece, boardRef.current)) {
            setPiece(newPiece);
        } else if (dy > 0) {
            lockPiece();
        }
    }, [piece, gameOver, isPaused, lockPiece]);

    const rotate = useCallback(() => {
        if (!piece || gameOver || isPaused) return;

        const rotated = rotatePiece(piece);
        if (isValidMove(rotated, boardRef.current)) {
            setPiece(rotated);
        }
    }, [piece, gameOver, isPaused]);

    const hardDrop = useCallback(() => {
        if (!piece || gameOver || isPaused) return;

        let newY = piece.y;
        while (isValidMove({ ...piece, y: newY + 1 }, boardRef.current)) {
            newY++;
        }
        setPiece({ ...piece, y: newY });
        setTimeout(lockPiece, 0);
    }, [piece, gameOver, isPaused, lockPiece]);

    const startGame = () => {
        setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
        setScore(0);
        setLines(0);
        setLevel(1);
        setGameOver(false);
        setIsPaused(false);
        setGameStarted(true);
        setPiece(getRandomPiece());
        setNextPiece(Object.keys(TETROMINOS)[Math.floor(Math.random() * 7)] as TetrominoKey);
    };

    // Game loop
    useEffect(() => {
        if (!gameStarted || gameOver || isPaused) return;

        const speed = Math.max(100, 1000 - (level - 1) * 100);
        const interval = setInterval(() => movePiece(0, 1), speed);
        return () => clearInterval(interval);
    }, [gameStarted, gameOver, isPaused, level, movePiece]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!gameStarted) return;

            if (e.key === "p" || e.key === "P" || e.key === "Escape") {
                setIsPaused(p => !p);
                return;
            }

            if (isPaused) return;

            switch (e.key) {
                case "ArrowLeft":
                    e.preventDefault();
                    movePiece(-1, 0);
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    movePiece(1, 0);
                    break;
                case "ArrowDown":
                    e.preventDefault();
                    movePiece(0, 1);
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    rotate();
                    break;
                case " ":
                    e.preventDefault();
                    hardDrop();
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [gameStarted, isPaused, movePiece, rotate, hardDrop]);

    // Render board with current piece
    const renderBoard = () => {
        const display = board.map(row => [...row]);

        if (piece) {
            for (let y = 0; y < piece.shape.length; y++) {
                for (let x = 0; x < piece.shape[y].length; x++) {
                    if (piece.shape[y][x]) {
                        const boardY = piece.y + y;
                        const boardX = piece.x + x;
                        if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                            display[boardY][boardX] = piece.color;
                        }
                    }
                }
            }
        }

        return display;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex flex-col items-center justify-center p-4">
            {/* Header */}
            <div className="w-full max-w-lg mb-4">
                <Link href="/games" className="text-white/70 hover:text-white text-sm">
                    ← Back to Games
                </Link>
            </div>

            <h1 className="text-4xl font-bold text-white mb-4">🧱 Tetris</h1>

            <div className="flex gap-6">
                {/* Game Board */}
                <div className="bg-black/50 p-2 rounded-lg">
                    <div
                        className="grid gap-px bg-gray-800"
                        style={{
                            gridTemplateColumns: `repeat(${COLS}, ${CELL_SIZE}px)`,
                            gridTemplateRows: `repeat(${ROWS}, ${CELL_SIZE}px)`,
                        }}
                    >
                        {renderBoard().map((row, y) =>
                            row.map((cell, x) => (
                                <div
                                    key={`${y}-${x}`}
                                    className="rounded-sm"
                                    style={{
                                        backgroundColor: cell || "#1a1a2e",
                                        boxShadow: cell ? `inset 2px 2px 4px rgba(255,255,255,0.3), inset -2px -2px 4px rgba(0,0,0,0.3)` : "none",
                                    }}
                                />
                            ))
                        )}
                    </div>

                    {/* Overlays */}
                    {!gameStarted && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg" style={{ position: "relative", marginTop: -ROWS * CELL_SIZE - 4 }}>
                            <button
                                onClick={startGame}
                                className="px-8 py-4 bg-purple-500 text-white rounded-lg font-bold text-xl hover:bg-purple-400"
                            >
                                Start Game
                            </button>
                        </div>
                    )}
                </div>

                {/* Side Panel */}
                <div className="space-y-4">
                    {/* Score */}
                    <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-white">
                        <div className="text-sm opacity-70">Score</div>
                        <div className="text-2xl font-bold">{score}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-white">
                        <div className="text-sm opacity-70">Lines</div>
                        <div className="text-2xl font-bold">{lines}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-white">
                        <div className="text-sm opacity-70">Level</div>
                        <div className="text-2xl font-bold">{level}</div>
                    </div>

                    {/* Next Piece */}
                    {nextPiece && (
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                            <div className="text-sm text-white/70 mb-2">Next</div>
                            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(4, 16px)` }}>
                                {TETROMINOS[nextPiece].shape.map((row, y) =>
                                    row.map((cell, x) => (
                                        <div
                                            key={`${y}-${x}`}
                                            className="w-4 h-4 rounded-sm"
                                            style={{
                                                backgroundColor: cell ? TETROMINOS[nextPiece].color : "transparent",
                                            }}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Controls */}
                    <button
                        onClick={() => setIsPaused(p => !p)}
                        className="w-full py-2 bg-white/20 text-white rounded-lg hover:bg-white/30"
                    >
                        {isPaused ? "Resume" : "Pause"}
                    </button>
                </div>
            </div>

            {/* Game Over */}
            {gameOver && (
                <div className="mt-6 text-center">
                    <h2 className="text-2xl font-bold text-red-400">Game Over!</h2>
                    <p className="text-white/70 mt-2">Final Score: {score}</p>
                    <button
                        onClick={startGame}
                        className="mt-4 px-6 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-400"
                    >
                        Play Again
                    </button>
                </div>
            )}

            <p className="mt-6 text-white/70 text-center text-sm">
                ← → Move • ↑ Rotate • ↓ Soft Drop • Space Hard Drop • P Pause
            </p>
        </div>
    );
}
