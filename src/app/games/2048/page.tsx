"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdBanner from "@/components/AdBanner";

export default function Game2048() {
    const [grid, setGrid] = useState<number[]>(Array(16).fill(0));
    const [score, setScore] = useState(0);
    const [best, setBest] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);

    // Initialize game
    useEffect(() => {
        const savedBest = localStorage.getItem("2048best");
        if (savedBest) setBest(parseInt(savedBest));
        initGame();
    }, []);

    const initGame = () => {
        const newGrid = Array(16).fill(0);
        addTile(newGrid);
        addTile(newGrid);
        setGrid(newGrid);
        setScore(0);
        setGameOver(false);
        setWon(false);
    };

    const addTile = (currentGrid: number[]) => {
        const empty = currentGrid
            .map((v, i) => (v === 0 ? i : -1))
            .filter((i) => i >= 0);
        if (empty.length === 0) return;
        const idx = empty[Math.floor(Math.random() * empty.length)];
        currentGrid[idx] = Math.random() < 0.9 ? 2 : 4;
    };

    const slide = (row: number[]): { newRow: number[]; points: number; reached2048: boolean } => {
        let arr = row.filter((v) => v);
        let points = 0;
        let reached2048 = false;

        for (let i = 0; i < arr.length - 1; i++) {
            if (arr[i] === arr[i + 1]) {
                arr[i] *= 2;
                points += arr[i];
                if (arr[i] === 2048) reached2048 = true;
                arr.splice(i + 1, 1);
            }
        }
        while (arr.length < 4) arr.push(0);
        return { newRow: arr, points, reached2048 };
    };

    const move = useCallback((direction: "left" | "right" | "up" | "down") => {
        if (gameOver) return;

        const newGrid = [...grid];
        let moved = false;
        let totalPoints = 0;
        let reached2048 = false;

        if (direction === "left") {
            for (let r = 0; r < 4; r++) {
                const row = newGrid.slice(r * 4, r * 4 + 4);
                const { newRow, points, reached2048: won } = slide(row);
                for (let c = 0; c < 4; c++) {
                    if (newGrid[r * 4 + c] !== newRow[c]) moved = true;
                    newGrid[r * 4 + c] = newRow[c];
                }
                totalPoints += points;
                if (won) reached2048 = true;
            }
        } else if (direction === "right") {
            for (let r = 0; r < 4; r++) {
                const row = newGrid.slice(r * 4, r * 4 + 4).reverse();
                const { newRow, points, reached2048: won } = slide(row);
                const reversed = newRow.reverse();
                for (let c = 0; c < 4; c++) {
                    if (newGrid[r * 4 + c] !== reversed[c]) moved = true;
                    newGrid[r * 4 + c] = reversed[c];
                }
                totalPoints += points;
                if (won) reached2048 = true;
            }
        } else if (direction === "up") {
            for (let c = 0; c < 4; c++) {
                const col = [newGrid[c], newGrid[c + 4], newGrid[c + 8], newGrid[c + 12]];
                const { newRow, points, reached2048: won } = slide(col);
                for (let r = 0; r < 4; r++) {
                    if (newGrid[r * 4 + c] !== newRow[r]) moved = true;
                    newGrid[r * 4 + c] = newRow[r];
                }
                totalPoints += points;
                if (won) reached2048 = true;
            }
        } else if (direction === "down") {
            for (let c = 0; c < 4; c++) {
                const col = [newGrid[c + 12], newGrid[c + 8], newGrid[c + 4], newGrid[c]];
                const { newRow, points, reached2048: won } = slide(col);
                newGrid[c + 12] = newRow[0];
                newGrid[c + 8] = newRow[1];
                newGrid[c + 4] = newRow[2];
                newGrid[c] = newRow[3];
                if (col.some((v, i) => v !== [newRow[0], newRow[1], newRow[2], newRow[3]][i])) moved = true;
                totalPoints += points;
                if (won) reached2048 = true;
            }
        }

        if (moved) {
            addTile(newGrid);
            const newScore = score + totalPoints;
            setGrid(newGrid);
            setScore(newScore);

            if (newScore > best) {
                setBest(newScore);
                localStorage.setItem("2048best", newScore.toString());
            }

            if (reached2048 && !won) {
                setWon(true);
            }

            // Check game over
            if (!newGrid.includes(0)) {
                let canMove = false;
                for (let r = 0; r < 4 && !canMove; r++) {
                    for (let c = 0; c < 4 && !canMove; c++) {
                        const v = newGrid[r * 4 + c];
                        if (c < 3 && newGrid[r * 4 + c + 1] === v) canMove = true;
                        if (r < 3 && newGrid[(r + 1) * 4 + c] === v) canMove = true;
                    }
                }
                if (!canMove) setGameOver(true);
            }
        }
    }, [grid, score, best, gameOver, won]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
                e.preventDefault();
                if (e.key === "ArrowLeft") move("left");
                if (e.key === "ArrowRight") move("right");
                if (e.key === "ArrowUp") move("up");
                if (e.key === "ArrowDown") move("down");
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [move]);

    // Touch controls
    useEffect(() => {
        let touchStartX = 0;
        let touchStartY = 0;

        const handleTouchStart = (e: TouchEvent) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 30) move("right");
                else if (dx < -30) move("left");
            } else {
                if (dy > 30) move("down");
                else if (dy < -30) move("up");
            }
        };

        window.addEventListener("touchstart", handleTouchStart);
        window.addEventListener("touchend", handleTouchEnd);
        return () => {
            window.removeEventListener("touchstart", handleTouchStart);
            window.removeEventListener("touchend", handleTouchEnd);
        };
    }, [move]);

    const getCellStyle = (value: number) => {
        const styles: Record<number, string> = {
            2: "bg-[#eee4da] text-[#776e65]",
            4: "bg-[#ede0c8] text-[#776e65]",
            8: "bg-[#f2b179] text-white",
            16: "bg-[#f59563] text-white",
            32: "bg-[#f67c5f] text-white",
            64: "bg-[#f65e3b] text-white",
            128: "bg-[#edcf72] text-white text-2xl",
            256: "bg-[#edcc61] text-white text-2xl",
            512: "bg-[#edc850] text-white text-2xl",
            1024: "bg-[#edc53f] text-white text-xl",
            2048: "bg-[#edc22e] text-white text-xl",
        };
        return styles[value] || "bg-[#cdc1b4]";
    };

    return (
        <div className="min-h-screen bg-[#faf8ef] flex flex-col items-center justify-center p-4">
            {/* Header */}
            <div className="w-full max-w-md mb-4">
                <Link href="/games" className="text-[#776e65] hover:underline text-sm">
                    ← Back to Games
                </Link>
            </div>

            <h1 className="text-5xl font-bold text-[#776e65] mb-4">2048</h1>

            <AdBanner slot="1696472735" format="horizontal" className="mb-4 w-full max-w-md" />

            {/* Score */}
            <div className="flex gap-4 mb-6">
                <div className="bg-[#bbada0] text-white px-6 py-3 rounded-lg text-center">
                    <div className="text-xs uppercase">Score</div>
                    <div className="text-2xl font-bold">{score}</div>
                </div>
                <div className="bg-[#bbada0] text-white px-6 py-3 rounded-lg text-center">
                    <div className="text-xs uppercase">Best</div>
                    <div className="text-2xl font-bold">{best}</div>
                </div>
            </div>

            {/* Game Board */}
            <div className="relative bg-[#bbada0] p-3 rounded-xl">
                <div className="grid grid-cols-4 gap-3">
                    {grid.map((value, idx) => (
                        <div
                            key={idx}
                            className={`w-16 h-16 md:w-20 md:h-20 rounded-md flex items-center justify-center text-3xl font-bold transition-all ${getCellStyle(value)}`}
                        >
                            {value || ""}
                        </div>
                    ))}
                </div>

                {/* Overlay */}
                {(gameOver || won) && (
                    <div className="absolute inset-0 bg-white/80 rounded-xl flex flex-col items-center justify-center">
                        <h2 className="text-3xl font-bold text-[#776e65] mb-4">
                            {gameOver ? "Game Over!" : "You Win!"}
                        </h2>
                        <button
                            onClick={initGame}
                            className="px-6 py-3 bg-[#8f7a66] text-white rounded-lg font-semibold hover:bg-[#9f8a76] transition-colors"
                        >
                            Play Again
                        </button>
                    </div>
                )}
            </div>

            {/* Controls */}
            <button
                onClick={initGame}
                className="mt-6 px-8 py-3 bg-[#8f7a66] text-white rounded-lg font-semibold hover:bg-[#9f8a76] transition-colors"
            >
                New Game
            </button>

            <p className="mt-4 text-[#776e65] text-center">
                Use arrow keys to move tiles. Combine same numbers to reach 2048!
            </p>
            <p className="mt-2 text-[#776e65]/70 text-sm md:hidden">
                📱 Swipe to move tiles
            </p>
            <AdBanner slot="9056088001" format="horizontal" className="mt-8 w-full max-w-md" />
        </div>
    );
}
