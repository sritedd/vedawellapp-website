"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

const W = 480, H = 400;
const PADDLE_W = 80, PADDLE_H = 12;
const BALL_R = 6;
const BRICK_ROWS = 5, BRICK_COLS = 8;
const BRICK_W = W / BRICK_COLS - 4, BRICK_H = 18;
const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];

interface Brick { x: number; y: number; alive: boolean; color: string; }

function initBricks(): Brick[] {
    const bricks: Brick[] = [];
    for (let r = 0; r < BRICK_ROWS; r++)
        for (let c = 0; c < BRICK_COLS; c++)
            bricks.push({ x: c * (BRICK_W + 4) + 2, y: r * (BRICK_H + 4) + 40, alive: true, color: COLORS[r] });
    return bricks;
}

export default function BreakoutGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [playing, setPlaying] = useState(false);
    const [gameOver, setGameOver] = useState(false);

    const state = useRef({
        paddleX: W / 2 - PADDLE_W / 2,
        ballX: W / 2, ballY: H - 40,
        dx: 3, dy: -3,
        bricks: initBricks(),
        score: 0, lives: 3,
        keys: {} as Record<string, boolean>,
    });

    const resetBall = useCallback(() => {
        state.current.ballX = W / 2;
        state.current.ballY = H - 40;
        state.current.dx = 3 * (Math.random() > 0.5 ? 1 : -1);
        state.current.dy = -3;
    }, []);

    const startGame = useCallback(() => {
        state.current.bricks = initBricks();
        state.current.score = 0;
        state.current.lives = 3;
        state.current.paddleX = W / 2 - PADDLE_W / 2;
        resetBall();
        setScore(0);
        setLives(3);
        setGameOver(false);
        setPlaying(true);
    }, [resetBall]);

    useEffect(() => {
        if (!playing) return;

        const handleKey = (e: KeyboardEvent) => {
            state.current.keys[e.key] = e.type === "keydown";
        };
        window.addEventListener("keydown", handleKey);
        window.addEventListener("keyup", handleKey);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;

        let animId: number;
        const loop = () => {
            const s = state.current;

            // Move paddle
            if (s.keys["ArrowLeft"] || s.keys["a"]) s.paddleX = Math.max(0, s.paddleX - 6);
            if (s.keys["ArrowRight"] || s.keys["d"]) s.paddleX = Math.min(W - PADDLE_W, s.paddleX + 6);

            // Move ball
            s.ballX += s.dx;
            s.ballY += s.dy;

            // Wall bounce
            if (s.ballX <= BALL_R || s.ballX >= W - BALL_R) s.dx = -s.dx;
            if (s.ballY <= BALL_R) s.dy = -s.dy;

            // Paddle bounce
            if (s.ballY >= H - PADDLE_H - BALL_R - 10 && s.ballY < H - PADDLE_H - BALL_R - 5
                && s.ballX >= s.paddleX && s.ballX <= s.paddleX + PADDLE_W) {
                s.dy = -Math.abs(s.dy);
                const hitPos = (s.ballX - s.paddleX) / PADDLE_W - 0.5;
                s.dx = hitPos * 6;
            }

            // Brick collision
            for (const brick of s.bricks) {
                if (!brick.alive) continue;
                if (s.ballX >= brick.x && s.ballX <= brick.x + BRICK_W
                    && s.ballY >= brick.y && s.ballY <= brick.y + BRICK_H) {
                    brick.alive = false;
                    s.dy = -s.dy;
                    s.score += 10;
                    setScore(s.score);
                }
            }

            // Ball lost
            if (s.ballY > H) {
                s.lives--;
                setLives(s.lives);
                if (s.lives <= 0) {
                    setGameOver(true);
                    setPlaying(false);
                    return;
                }
                resetBall();
            }

            // Win check
            if (s.bricks.every(b => !b.alive)) {
                setGameOver(true);
                setPlaying(false);
                return;
            }

            // Draw
            ctx.fillStyle = "#1e1b4b";
            ctx.fillRect(0, 0, W, H);

            // Bricks
            for (const brick of s.bricks) {
                if (!brick.alive) continue;
                ctx.fillStyle = brick.color;
                ctx.beginPath();
                ctx.roundRect(brick.x, brick.y, BRICK_W, BRICK_H, 3);
                ctx.fill();
            }

            // Paddle
            ctx.fillStyle = "#e2e8f0";
            ctx.beginPath();
            ctx.roundRect(s.paddleX, H - PADDLE_H - 10, PADDLE_W, PADDLE_H, 6);
            ctx.fill();

            // Ball
            ctx.fillStyle = "#fbbf24";
            ctx.beginPath();
            ctx.arc(s.ballX, s.ballY, BALL_R, 0, Math.PI * 2);
            ctx.fill();

            animId = requestAnimationFrame(loop);
        };
        animId = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("keydown", handleKey);
            window.removeEventListener("keyup", handleKey);
        };
    }, [playing, resetBall]);

    // Touch/mouse controls
    const handleMove = useCallback((clientX: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = (clientX - rect.left) / rect.width * W;
        state.current.paddleX = Math.max(0, Math.min(W - PADDLE_W, x - PADDLE_W / 2));
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-purple-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg mb-4">
                <Link href="/games" className="text-indigo-300 hover:underline text-sm">← Back to Games</Link>
            </div>

            <h1 className="text-4xl font-bold text-white mb-2">Breakout</h1>
            <div className="flex gap-6 mb-4 text-indigo-200">
                <span>Score: {score}</span>
                <span>Lives: {"❤️".repeat(lives)}</span>
            </div>

            <div className="relative">
                <canvas
                    ref={canvasRef}
                    width={W}
                    height={H}
                    className="rounded-xl border-2 border-indigo-700 max-w-full"
                    style={{ width: "min(480px, 90vw)", height: "auto", aspectRatio: `${W}/${H}` }}
                    onMouseMove={e => handleMove(e.clientX)}
                    onTouchMove={e => handleMove(e.touches[0].clientX)}
                />
                {!playing && (
                    <div className="absolute inset-0 bg-black/60 rounded-xl flex flex-col items-center justify-center">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {gameOver ? (state.current.bricks.every(b => !b.alive) ? "You Win! 🎉" : "Game Over!") : "Breakout"}
                        </h2>
                        {gameOver && <p className="text-indigo-200 mb-3">Score: {score}</p>}
                        <button onClick={startGame} className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-500 transition-colors">
                            {gameOver ? "Play Again" : "Start Game"}
                        </button>
                    </div>
                )}
            </div>

            <p className="mt-4 text-indigo-300/70 text-sm text-center">Arrow keys or mouse to move paddle. Break all bricks!</p>
        </div>
    );
}
