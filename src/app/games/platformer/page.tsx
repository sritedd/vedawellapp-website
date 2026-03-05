"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

const W = 600, H = 400;
const GRAVITY = 0.6, JUMP = -12, SPEED = 4;
const PLAYER_W = 24, PLAYER_H = 32;

interface Platform { x: number; y: number; w: number; type: "normal" | "coin" | "goal"; }

function generateLevel(): Platform[] {
    const platforms: Platform[] = [
        { x: 0, y: H - 20, w: W, type: "normal" }, // ground
        { x: 80, y: 300, w: 100, type: "normal" },
        { x: 220, y: 250, w: 80, type: "coin" },
        { x: 350, y: 200, w: 100, type: "normal" },
        { x: 180, y: 150, w: 80, type: "coin" },
        { x: 450, y: 150, w: 80, type: "normal" },
        { x: 300, y: 100, w: 60, type: "coin" },
        { x: 500, y: 80, w: 80, type: "goal" },
    ];
    return platforms;
}

export default function PlatformerGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [playing, setPlaying] = useState(false);
    const [status, setStatus] = useState<"idle" | "playing" | "won" | "dead">("idle");

    const state = useRef({
        x: 40, y: H - 60,
        vx: 0, vy: 0,
        onGround: false,
        platforms: generateLevel(),
        coins: new Set<number>(),
        score: 0,
        keys: {} as Record<string, boolean>,
    });

    const startGame = useCallback(() => {
        state.current = {
            x: 40, y: H - 60,
            vx: 0, vy: 0,
            onGround: false,
            platforms: generateLevel(),
            coins: new Set<number>(),
            score: 0,
            keys: {},
        };
        setScore(0);
        setLevel(1);
        setPlaying(true);
        setStatus("playing");
    }, []);

    useEffect(() => {
        if (!playing) return;

        const handleKey = (e: KeyboardEvent) => {
            state.current.keys[e.key] = e.type === "keydown";
            if (e.key === " " || e.key === "ArrowUp") e.preventDefault();
        };
        window.addEventListener("keydown", handleKey);
        window.addEventListener("keyup", handleKey);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;

        let animId: number;
        const loop = () => {
            const s = state.current;

            // Movement
            if (s.keys["ArrowLeft"] || s.keys["a"]) s.vx = -SPEED;
            else if (s.keys["ArrowRight"] || s.keys["d"]) s.vx = SPEED;
            else s.vx *= 0.8;

            if ((s.keys["ArrowUp"] || s.keys[" "] || s.keys["w"]) && s.onGround) {
                s.vy = JUMP;
                s.onGround = false;
            }

            s.vy += GRAVITY;
            s.x += s.vx;
            s.y += s.vy;

            // Wrap horizontal
            if (s.x < -PLAYER_W) s.x = W;
            if (s.x > W) s.x = -PLAYER_W;

            // Platform collision
            s.onGround = false;
            for (let i = 0; i < s.platforms.length; i++) {
                const p = s.platforms[i];
                if (s.x + PLAYER_W > p.x && s.x < p.x + p.w
                    && s.y + PLAYER_H >= p.y && s.y + PLAYER_H <= p.y + 15
                    && s.vy >= 0) {
                    s.y = p.y - PLAYER_H;
                    s.vy = 0;
                    s.onGround = true;

                    if (p.type === "coin" && !s.coins.has(i)) {
                        s.coins.add(i);
                        s.score += 100;
                        setScore(s.score);
                    }
                    if (p.type === "goal") {
                        setStatus("won");
                        setPlaying(false);
                        return;
                    }
                }
            }

            // Fall death
            if (s.y > H + 50) {
                setStatus("dead");
                setPlaying(false);
                return;
            }

            // Draw
            const grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, "#1e3a5f");
            grad.addColorStop(1, "#4a1942");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            // Stars
            for (let i = 0; i < 30; i++) {
                const sx = (i * 73 + 17) % W, sy = (i * 41 + 7) % (H / 2);
                ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(Date.now() / 500 + i) * 0.2})`;
                ctx.fillRect(sx, sy, 2, 2);
            }

            // Platforms
            for (let i = 0; i < s.platforms.length; i++) {
                const p = s.platforms[i];
                if (p.type === "coin" && s.coins.has(i)) {
                    ctx.fillStyle = "#555";
                    ctx.fillRect(p.x, p.y, p.w, 8);
                    continue;
                }
                ctx.fillStyle = p.type === "goal" ? "#fbbf24" : p.type === "coin" ? "#a78bfa" : "#4ade80";
                ctx.beginPath();
                ctx.roundRect(p.x, p.y, p.w, p.type === "normal" && i === 0 ? 20 : 10, 4);
                ctx.fill();
                if (p.type === "coin" && !s.coins.has(i)) {
                    ctx.fillStyle = "#fbbf24";
                    ctx.beginPath();
                    ctx.arc(p.x + p.w / 2, p.y - 10, 6, 0, Math.PI * 2);
                    ctx.fill();
                }
                if (p.type === "goal") {
                    ctx.fillStyle = "#fff";
                    ctx.font = "16px sans-serif";
                    ctx.textAlign = "center";
                    ctx.fillText("⭐", p.x + p.w / 2, p.y - 5);
                }
            }

            // Player
            ctx.fillStyle = "#60a5fa";
            ctx.beginPath();
            ctx.roundRect(s.x, s.y, PLAYER_W, PLAYER_H, 4);
            ctx.fill();
            // Eyes
            ctx.fillStyle = "white";
            ctx.fillRect(s.x + 6, s.y + 8, 5, 5);
            ctx.fillRect(s.x + 14, s.y + 8, 5, 5);
            ctx.fillStyle = "#1e3a5f";
            ctx.fillRect(s.x + (s.vx >= 0 ? 8 : 7), s.y + 10, 2, 3);
            ctx.fillRect(s.x + (s.vx >= 0 ? 16 : 15), s.y + 10, 2, 3);

            animId = requestAnimationFrame(loop);
        };
        animId = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("keydown", handleKey);
            window.removeEventListener("keyup", handleKey);
        };
    }, [playing]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#1e3a5f] to-[#4a1942] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl mb-4">
                <Link href="/games" className="text-purple-300 hover:underline text-sm">← Back to Games</Link>
            </div>

            <h1 className="text-4xl font-bold text-white mb-2">🏃 Platformer</h1>
            <div className="flex gap-6 mb-4 text-purple-200">
                <span>Score: {score}</span>
                <span>Level: {level}</span>
            </div>

            <div className="relative">
                <canvas
                    ref={canvasRef}
                    width={W}
                    height={H}
                    className="rounded-xl border-2 border-purple-700 shadow-2xl"
                    style={{ width: "min(600px, 90vw)", height: "auto", aspectRatio: `${W}/${H}` }}
                />
                {!playing && (
                    <div className="absolute inset-0 bg-black/60 rounded-xl flex flex-col items-center justify-center">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {status === "won" ? "Level Complete! ⭐" : status === "dead" ? "You Fell!" : "Platformer"}
                        </h2>
                        {status !== "idle" && <p className="text-purple-200 mb-2">Score: {score}</p>}
                        <button onClick={startGame} className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-500 transition-colors">
                            {status === "idle" ? "Start Game" : "Play Again"}
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile controls */}
            <div className="flex gap-4 mt-4 md:hidden">
                <button onTouchStart={() => state.current.keys["ArrowLeft"] = true} onTouchEnd={() => state.current.keys["ArrowLeft"] = false}
                    className="w-16 h-16 bg-purple-700 text-white rounded-xl text-2xl active:bg-purple-500">←</button>
                <button onTouchStart={() => { state.current.keys["ArrowUp"] = true; state.current.keys[" "] = true; }}
                    onTouchEnd={() => { state.current.keys["ArrowUp"] = false; state.current.keys[" "] = false; }}
                    className="w-16 h-16 bg-purple-700 text-white rounded-xl text-2xl active:bg-purple-500">↑</button>
                <button onTouchStart={() => state.current.keys["ArrowRight"] = true} onTouchEnd={() => state.current.keys["ArrowRight"] = false}
                    className="w-16 h-16 bg-purple-700 text-white rounded-xl text-2xl active:bg-purple-500">→</button>
            </div>

            <p className="mt-3 text-purple-300/60 text-sm text-center">Arrow keys to move, Space to jump. Collect coins and reach the star!</p>
        </div>
    );
}
