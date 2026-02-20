"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import AdBanner from "@/components/AdBanner";

type CellState = {
    isMine: boolean;
    isRevealed: boolean;
    isFlagged: boolean;
    adjacentMines: number;
};

const DIFFICULTY = {
    easy: { rows: 8, cols: 8, mines: 10 },
    medium: { rows: 12, cols: 12, mines: 30 },
    hard: { rows: 16, cols: 16, mines: 60 },
};

type Difficulty = keyof typeof DIFFICULTY;

export default function Minesweeper() {
    const [difficulty, setDifficulty] = useState<Difficulty>("easy");
    const [grid, setGrid] = useState<CellState[][]>([]);
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [flagCount, setFlagCount] = useState(0);

    const config = DIFFICULTY[difficulty];

    const initGame = useCallback((clickedRow?: number, clickedCol?: number) => {
        const { rows, cols, mines } = DIFFICULTY[difficulty];

        // Create empty grid
        const newGrid: CellState[][] = Array(rows)
            .fill(null)
            .map(() =>
                Array(cols)
                    .fill(null)
                    .map(() => ({
                        isMine: false,
                        isRevealed: false,
                        isFlagged: false,
                        adjacentMines: 0,
                    }))
            );

        // Place mines (avoiding first click)
        let minesPlaced = 0;
        while (minesPlaced < mines) {
            const r = Math.floor(Math.random() * rows);
            const c = Math.floor(Math.random() * cols);

            // Don't place mine on first click or adjacent to it
            if (clickedRow !== undefined && clickedCol !== undefined) {
                if (Math.abs(r - clickedRow) <= 1 && Math.abs(c - clickedCol) <= 1) continue;
            }

            if (!newGrid[r][c].isMine) {
                newGrid[r][c].isMine = true;
                minesPlaced++;
            }
        }

        // Calculate adjacent mines
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (newGrid[r][c].isMine) continue;
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const nr = r + dr;
                        const nc = c + dc;
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newGrid[nr][nc].isMine) {
                            count++;
                        }
                    }
                }
                newGrid[r][c].adjacentMines = count;
            }
        }

        setGrid(newGrid);
        setGameOver(false);
        setWon(false);
        setFlagCount(0);
        setGameStarted(true);
    }, [difficulty]);

    const revealCell = (row: number, col: number) => {
        if (!gameStarted) {
            initGame(row, col);
            setTimeout(() => handleReveal(row, col), 0);
            return;
        }
        handleReveal(row, col);
    };

    const handleReveal = (row: number, col: number) => {
        if (gameOver || won) return;
        if (grid[row]?.[col]?.isFlagged || grid[row]?.[col]?.isRevealed) return;

        const newGrid = grid.map(r => r.map(c => ({ ...c })));

        if (newGrid[row][col].isMine) {
            // Game over - reveal all mines
            newGrid.forEach(r => r.forEach(c => {
                if (c.isMine) c.isRevealed = true;
            }));
            setGrid(newGrid);
            setGameOver(true);
            return;
        }

        // Flood fill reveal
        const reveal = (r: number, c: number) => {
            if (r < 0 || r >= config.rows || c < 0 || c >= config.cols) return;
            if (newGrid[r][c].isRevealed || newGrid[r][c].isFlagged) return;

            newGrid[r][c].isRevealed = true;

            if (newGrid[r][c].adjacentMines === 0) {
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        reveal(r + dr, c + dc);
                    }
                }
            }
        };

        reveal(row, col);
        setGrid(newGrid);

        // Check win
        const unrevealed = newGrid.flat().filter(c => !c.isRevealed);
        if (unrevealed.every(c => c.isMine)) {
            setWon(true);
        }
    };

    const toggleFlag = (e: React.MouseEvent, row: number, col: number) => {
        e.preventDefault();
        if (gameOver || won || !gameStarted) return;
        if (grid[row][col].isRevealed) return;

        const newGrid = grid.map(r => r.map(c => ({ ...c })));
        newGrid[row][col].isFlagged = !newGrid[row][col].isFlagged;
        setGrid(newGrid);
        setFlagCount(f => newGrid[row][col].isFlagged ? f + 1 : f - 1);
    };

    const getCellContent = (cell: CellState) => {
        if (cell.isFlagged) return "🚩";
        if (!cell.isRevealed) return "";
        if (cell.isMine) return "💣";
        if (cell.adjacentMines === 0) return "";
        return cell.adjacentMines;
    };

    const getNumberColor = (num: number) => {
        const colors = ["", "text-blue-600", "text-green-600", "text-red-600", "text-purple-600", "text-orange-600", "text-cyan-600", "text-pink-600", "text-gray-600"];
        return colors[num] || "";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-800 to-slate-900 flex flex-col items-center justify-center p-4">
            {/* Header */}
            <div className="w-full max-w-lg mb-4">
                <Link href="/games" className="text-white/70 hover:text-white text-sm">
                    ← Back to Games
                </Link>
            </div>

            <h1 className="text-4xl font-bold text-white mb-4">💣 Minesweeper</h1>

            <AdBanner slot="1696472735" format="horizontal" className="mb-4 w-full max-w-md" />

            {/* Difficulty */}
            <div className="flex gap-2 mb-6">
                {(Object.keys(DIFFICULTY) as Difficulty[]).map((d) => (
                    <button
                        key={d}
                        onClick={() => {
                            setDifficulty(d);
                            setGameStarted(false);
                            setGrid([]);
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${difficulty === d
                            ? "bg-white text-gray-900"
                            : "bg-white/20 text-white hover:bg-white/30"
                            }`}
                    >
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                ))}
            </div>

            {/* Stats */}
            <div className="flex gap-4 mb-4 text-white">
                <div className="bg-white/20 px-4 py-2 rounded-lg">
                    💣 {config.mines - flagCount}
                </div>
                <div className="bg-white/20 px-4 py-2 rounded-lg">
                    🚩 {flagCount}
                </div>
            </div>

            {/* Game Board */}
            <div className="bg-gray-700 p-2 rounded-lg">
                {!gameStarted ? (
                    <div
                        className="grid gap-0.5"
                        style={{ gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))` }}
                    >
                        {Array(config.rows * config.cols)
                            .fill(null)
                            .map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => revealCell(Math.floor(idx / config.cols), idx % config.cols)}
                                    className="w-7 h-7 md:w-8 md:h-8 bg-gray-500 hover:bg-gray-400 rounded text-sm font-bold"
                                />
                            ))}
                    </div>
                ) : (
                    <div
                        className="grid gap-0.5"
                        style={{ gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))` }}
                    >
                        {grid.map((row, r) =>
                            row.map((cell, c) => (
                                <button
                                    key={`${r}-${c}`}
                                    onClick={() => revealCell(r, c)}
                                    onContextMenu={(e) => toggleFlag(e, r, c)}
                                    className={`w-7 h-7 md:w-8 md:h-8 rounded text-sm font-bold flex items-center justify-center transition-colors ${cell.isRevealed
                                        ? cell.isMine
                                            ? "bg-red-500"
                                            : "bg-gray-300"
                                        : "bg-gray-500 hover:bg-gray-400"
                                        } ${getNumberColor(cell.adjacentMines)}`}
                                    disabled={gameOver || won}
                                >
                                    {getCellContent(cell)}
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Game Over / Win */}
            {(gameOver || won) && (
                <div className="mt-6 text-center">
                    <h2 className={`text-2xl font-bold ${won ? "text-green-400" : "text-red-400"}`}>
                        {won ? "🎉 You Won!" : "💥 Game Over!"}
                    </h2>
                    <button
                        onClick={() => {
                            setGameStarted(false);
                            setGrid([]);
                        }}
                        className="mt-4 px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100"
                    >
                        Play Again
                    </button>
                </div>
            )}

            <p className="mt-6 text-white/70 text-center text-sm">
                Left-click to reveal • Right-click to flag
            </p>
            <AdBanner slot="9056088001" format="horizontal" className="mt-8 w-full max-w-md" />
        </div>
    );
}
