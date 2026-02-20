"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdBanner from "@/components/AdBanner";

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Cell = "empty" | "snake" | "food" | "wall";

const GRID_SIZE = 15;
const INITIAL_SPEED = 200;

export default function SnakeGame2() {
    const [snake, setSnake] = useState<{ x: number; y: number }[]>([
        { x: 7, y: 7 },
        { x: 7, y: 8 },
        { x: 7, y: 9 },
    ]);
    const [food, setFood] = useState<{ x: number; y: number }>({ x: 5, y: 5 });
    const [direction, setDirection] = useState<Direction>("UP");
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [speed, setSpeed] = useState(INITIAL_SPEED);

    useEffect(() => {
        const saved = localStorage.getItem("snake-high-score");
        if (saved) setHighScore(parseInt(saved));
    }, []);

    const generateFood = useCallback(() => {
        let newFood: { x: number; y: number };
        do {
            newFood = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE),
            };
        } while (snake.some((s) => s.x === newFood.x && s.y === newFood.y));
        return newFood;
    }, [snake]);

    const resetGame = () => {
        setSnake([
            { x: 7, y: 7 },
            { x: 7, y: 8 },
            { x: 7, y: 9 },
        ]);
        setFood(generateFood());
        setDirection("UP");
        setGameOver(false);
        setScore(0);
        setSpeed(INITIAL_SPEED);
        setGameStarted(true);
        setIsPaused(false);
    };

    const moveSnake = useCallback(() => {
        if (gameOver || isPaused || !gameStarted) return;

        setSnake((prevSnake) => {
            const head = { ...prevSnake[0] };

            switch (direction) {
                case "UP":
                    head.y--;
                    break;
                case "DOWN":
                    head.y++;
                    break;
                case "LEFT":
                    head.x--;
                    break;
                case "RIGHT":
                    head.x++;
                    break;
            }

            // Check wall collision
            if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
                setGameOver(true);
                if (score > highScore) {
                    setHighScore(score);
                    localStorage.setItem("snake-high-score", score.toString());
                }
                return prevSnake;
            }

            // Check self collision
            if (prevSnake.some((s) => s.x === head.x && s.y === head.y)) {
                setGameOver(true);
                if (score > highScore) {
                    setHighScore(score);
                    localStorage.setItem("snake-high-score", score.toString());
                }
                return prevSnake;
            }

            const newSnake = [head, ...prevSnake];

            // Check food collision
            if (head.x === food.x && head.y === food.y) {
                setScore((s) => s + 10);
                setFood(generateFood());
                // Speed up
                setSpeed((s) => Math.max(50, s - 5));
            } else {
                newSnake.pop();
            }

            return newSnake;
        });
    }, [direction, food, gameOver, generateFood, highScore, isPaused, score, gameStarted]);

    useEffect(() => {
        const interval = setInterval(moveSnake, speed);
        return () => clearInterval(interval);
    }, [moveSnake, speed]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === " ") {
                if (gameOver) {
                    resetGame();
                } else if (gameStarted) {
                    setIsPaused((p) => !p);
                } else {
                    setGameStarted(true);
                }
                return;
            }

            const keyMap: Record<string, Direction> = {
                ArrowUp: "UP",
                ArrowDown: "DOWN",
                ArrowLeft: "LEFT",
                ArrowRight: "RIGHT",
                w: "UP",
                s: "DOWN",
                a: "LEFT",
                d: "RIGHT",
                W: "UP",
                S: "DOWN",
                A: "LEFT",
                D: "RIGHT",
            };

            const newDir = keyMap[e.key];
            if (newDir) {
                const opposites: Record<Direction, Direction> = {
                    UP: "DOWN",
                    DOWN: "UP",
                    LEFT: "RIGHT",
                    RIGHT: "LEFT",
                };
                if (newDir !== opposites[direction]) {
                    setDirection(newDir);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [direction, gameOver, gameStarted]);

    const getCellClass = (x: number, y: number): string => {
        if (snake[0].x === x && snake[0].y === y) {
            return "bg-green-600 rounded-lg";
        }
        if (snake.some((s) => s.x === x && s.y === y)) {
            return "bg-green-500 rounded-sm";
        }
        if (food.x === x && food.y === y) {
            return "bg-red-500 rounded-full";
        }
        return "bg-gray-200";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
            <nav className="border-b border-green-200 bg-white/80 backdrop-blur">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold text-green-800">
                        <span>🎮</span>
                        <span>VedaWell Games</span>
                    </Link>
                    <Link href="/games" className="text-green-600 hover:text-green-800">
                        ← All Games
                    </Link>
                </div>
            </nav>

            <main className="py-8 px-6">
                <div className="max-w-lg mx-auto text-center">
                    <h1 className="text-3xl font-bold text-green-800 mb-2">🐍 Snake</h1>

                    <AdBanner slot="1696472735" format="horizontal" className="mb-4 w-full" />

                    <div className="flex justify-center gap-8 mb-4">
                        <div>
                            <span className="text-gray-600">Score: </span>
                            <span className="font-bold text-xl">{score}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Best: </span>
                            <span className="font-bold text-xl text-green-600">{highScore}</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-4 inline-block">
                        <div
                            className="grid gap-1"
                            style={{
                                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                            }}
                        >
                            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                                const x = i % GRID_SIZE;
                                const y = Math.floor(i / GRID_SIZE);
                                return (
                                    <div
                                        key={i}
                                        className={`w-5 h-5 ${getCellClass(x, y)}`}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="mt-6">
                        {!gameStarted && !gameOver && (
                            <button
                                onClick={() => setGameStarted(true)}
                                className="px-8 py-3 bg-green-500 text-white rounded-xl font-bold text-lg hover:bg-green-600"
                            >
                                Start Game
                            </button>
                        )}
                        {gameOver && (
                            <div>
                                <div className="text-2xl font-bold text-red-600 mb-4">Game Over!</div>
                                <button
                                    onClick={resetGame}
                                    className="px-8 py-3 bg-green-500 text-white rounded-xl font-bold text-lg hover:bg-green-600"
                                >
                                    Play Again
                                </button>
                            </div>
                        )}
                        {gameStarted && !gameOver && (
                            <button
                                onClick={() => setIsPaused((p) => !p)}
                                className="px-6 py-2 bg-gray-200 rounded-lg font-medium"
                            >
                                {isPaused ? "Resume" : "Pause"}
                            </button>
                        )}
                    </div>

                    {/* Mobile Controls */}
                    <div className="mt-6 grid grid-cols-3 gap-2 max-w-48 mx-auto">
                        <div></div>
                        <button
                            onClick={() => direction !== "DOWN" && setDirection("UP")}
                            className="p-4 bg-green-200 rounded-lg text-xl"
                        >
                            ⬆️
                        </button>
                        <div></div>
                        <button
                            onClick={() => direction !== "RIGHT" && setDirection("LEFT")}
                            className="p-4 bg-green-200 rounded-lg text-xl"
                        >
                            ⬅️
                        </button>
                        <div></div>
                        <button
                            onClick={() => direction !== "LEFT" && setDirection("RIGHT")}
                            className="p-4 bg-green-200 rounded-lg text-xl"
                        >
                            ➡️
                        </button>
                        <div></div>
                        <button
                            onClick={() => direction !== "UP" && setDirection("DOWN")}
                            className="p-4 bg-green-200 rounded-lg text-xl"
                        >
                            ⬇️
                        </button>
                        <div></div>
                    </div>

                    <p className="mt-6 text-gray-500 text-sm">
                        Use arrow keys or WASD to move. Space to pause.
                    </p>
                    <AdBanner slot="9056088001" format="horizontal" className="mt-8 w-full" />
                </div>
            </main>
        </div>
    );
}
