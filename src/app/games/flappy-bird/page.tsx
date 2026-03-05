"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

const W = 320, H = 480;
const BIRD_SIZE = 24;
const PIPE_W = 50, GAP = 130;
const GRAVITY = 0.4, JUMP = -7;

interface Pipe { x: number; topH: number; scored: boolean; }

export default function FlappyBirdGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [best, setBest] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [gameOver, setGameOver] = useState(false);

    const state = useRef({
        birdY: H / 2, velocity: 0,
        pipes: [] as Pipe[],
        frame: 0, score: 0,
    });

    useEffect(() => {
        const saved = localStorage.getItem("flappy-best");
        if (saved) setBest(parseInt(saved));
    }, []);

    const jump = useCallback(() => {
        if (!playing) {
            // Start game
            state.current = { birdY: H / 2, velocity: 0, pipes: [], frame: 0, score: 0 };
            setScore(0);
            setGameOver(false);
            setPlaying(true);
            return;
        }
        state.current.velocity = JUMP;
    }, [playing]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === " " || e.key === "ArrowUp") { e.preventDefault(); jump(); }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [jump]);

    useEffect(() => {
        if (!playing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;
        let animId: number;

        const loop = () => {
            const s = state.current;
            s.frame++;

            // Bird physics
            s.velocity += GRAVITY;
            s.birdY += s.velocity;

            // Spawn pipes
            if (s.frame % 90 === 0) {
                const topH = 60 + Math.random() * (H - GAP - 120);
                s.pipes.push({ x: W, topH, scored: false });
            }

            // Move pipes
            for (const pipe of s.pipes) {
                pipe.x -= 2.5;
                if (!pipe.scored && pipe.x + PIPE_W < 60) {
                    pipe.scored = true;
                    s.score++;
                    setScore(s.score);
                }
            }
            s.pipes = s.pipes.filter(p => p.x > -PIPE_W);

            // Collision
            const birdL = 50, birdR = 50 + BIRD_SIZE, birdT = s.birdY, birdB = s.birdY + BIRD_SIZE;
            let dead = birdB > H || birdT < 0;
            for (const pipe of s.pipes) {
                if (birdR > pipe.x && birdL < pipe.x + PIPE_W) {
                    if (birdT < pipe.topH || birdB > pipe.topH + GAP) dead = true;
                }
            }

            if (dead) {
                if (s.score > best) {
                    setBest(s.score);
                    localStorage.setItem("flappy-best", s.score.toString());
                }
                setGameOver(true);
                setPlaying(false);
                return;
            }

            // Draw sky
            const grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, "#87CEEB");
            grad.addColorStop(1, "#E0F7FA");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            // Ground
            ctx.fillStyle = "#8B4513";
            ctx.fillRect(0, H - 20, W, 20);
            ctx.fillStyle = "#228B22";
            ctx.fillRect(0, H - 24, W, 6);

            // Pipes
            for (const pipe of s.pipes) {
                // Top pipe
                ctx.fillStyle = "#2d8a4e";
                ctx.fillRect(pipe.x, 0, PIPE_W, pipe.topH);
                ctx.fillStyle = "#34d058";
                ctx.fillRect(pipe.x - 3, pipe.topH - 20, PIPE_W + 6, 20);
                // Bottom pipe
                const bottomY = pipe.topH + GAP;
                ctx.fillStyle = "#2d8a4e";
                ctx.fillRect(pipe.x, bottomY, PIPE_W, H - bottomY);
                ctx.fillStyle = "#34d058";
                ctx.fillRect(pipe.x - 3, bottomY, PIPE_W + 6, 20);
            }

            // Bird
            ctx.fillStyle = "#fbbf24";
            ctx.beginPath();
            ctx.ellipse(60, s.birdY + BIRD_SIZE / 2, BIRD_SIZE / 2, BIRD_SIZE / 2 - 2, Math.min(s.velocity * 0.05, 0.5), 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#f97316";
            ctx.beginPath();
            ctx.moveTo(60 + BIRD_SIZE / 2, s.birdY + BIRD_SIZE / 2 - 2);
            ctx.lineTo(60 + BIRD_SIZE / 2 + 8, s.birdY + BIRD_SIZE / 2);
            ctx.lineTo(60 + BIRD_SIZE / 2, s.birdY + BIRD_SIZE / 2 + 2);
            ctx.fill();
            // Eye
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(64, s.birdY + BIRD_SIZE / 2 - 3, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.arc(65, s.birdY + BIRD_SIZE / 2 - 3, 2, 0, Math.PI * 2);
            ctx.fill();

            // Score overlay
            ctx.fillStyle = "white";
            ctx.strokeStyle = "black";
            ctx.lineWidth = 3;
            ctx.font = "bold 36px sans-serif";
            ctx.textAlign = "center";
            ctx.strokeText(s.score.toString(), W / 2, 50);
            ctx.fillText(s.score.toString(), W / 2, 50);

            animId = requestAnimationFrame(loop);
        };
        animId = requestAnimationFrame(loop);

        return () => cancelAnimationFrame(animId);
    }, [playing, best]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-300 to-sky-100 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md mb-4">
                <Link href="/games" className="text-sky-800 hover:underline text-sm">← Back to Games</Link>
            </div>

            <h1 className="text-4xl font-bold text-sky-900 mb-2">Flappy Bird</h1>
            <div className="flex gap-4 mb-4 text-sky-800">
                <span>Score: {score}</span>
                <span>Best: {best}</span>
            </div>

            <div className="relative cursor-pointer" onClick={jump}>
                <canvas
                    ref={canvasRef}
                    width={W}
                    height={H}
                    className="rounded-xl border-4 border-sky-600 shadow-2xl"
                    style={{ width: "min(320px, 85vw)", height: "auto", aspectRatio: `${W}/${H}` }}
                />
                {!playing && (
                    <div className="absolute inset-0 bg-black/40 rounded-xl flex flex-col items-center justify-center">
                        <h2 className="text-3xl font-bold text-white mb-2">{gameOver ? "Game Over!" : "🐦 Flappy Bird"}</h2>
                        {gameOver && <p className="text-white/80 mb-2">Score: {score}</p>}
                        <p className="text-white/70 text-sm">Tap or press Space to {gameOver ? "restart" : "start"}</p>
                    </div>
                )}
            </div>
            <p className="mt-4 text-sky-700/70 text-sm text-center">Tap / Space / ↑ to flap. Avoid the pipes!</p>
        </div>
    );
}
