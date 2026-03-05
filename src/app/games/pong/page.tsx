"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

const W = 500, H = 350;
const PADDLE_W = 12, PADDLE_H = 70;
const BALL_SIZE = 10;
const AI_SPEED = 3.5, PADDLE_SPEED = 5;

export default function PongGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [playerScore, setPlayerScore] = useState(0);
    const [aiScore, setAiScore] = useState(0);
    const [playing, setPlaying] = useState(false);

    const state = useRef({
        playerY: H / 2 - PADDLE_H / 2,
        aiY: H / 2 - PADDLE_H / 2,
        ballX: W / 2, ballY: H / 2,
        dx: 4, dy: 2,
        keys: {} as Record<string, boolean>,
        playerScore: 0, aiScore: 0,
    });

    const startGame = useCallback(() => {
        const s = state.current;
        s.playerY = H / 2 - PADDLE_H / 2;
        s.aiY = H / 2 - PADDLE_H / 2;
        s.ballX = W / 2; s.ballY = H / 2;
        s.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
        s.dy = (Math.random() - 0.5) * 4;
        s.playerScore = 0; s.aiScore = 0;
        setPlayerScore(0); setAiScore(0);
        setPlaying(true);
    }, []);

    useEffect(() => {
        if (!playing) return;

        const handleKey = (e: KeyboardEvent) => {
            state.current.keys[e.key] = e.type === "keydown";
            if (["ArrowUp", "ArrowDown"].includes(e.key)) e.preventDefault();
        };
        window.addEventListener("keydown", handleKey);
        window.addEventListener("keyup", handleKey);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;

        let animId: number;
        const loop = () => {
            const s = state.current;

            // Player paddle
            if (s.keys["ArrowUp"] || s.keys["w"]) s.playerY = Math.max(0, s.playerY - PADDLE_SPEED);
            if (s.keys["ArrowDown"] || s.keys["s"]) s.playerY = Math.min(H - PADDLE_H, s.playerY + PADDLE_SPEED);

            // AI paddle
            const aiCenter = s.aiY + PADDLE_H / 2;
            if (s.ballX > W / 3) { // Only track when ball is heading toward AI
                if (aiCenter < s.ballY - 10) s.aiY = Math.min(H - PADDLE_H, s.aiY + AI_SPEED);
                if (aiCenter > s.ballY + 10) s.aiY = Math.max(0, s.aiY - AI_SPEED);
            }

            // Ball movement
            s.ballX += s.dx;
            s.ballY += s.dy;

            // Top/bottom walls
            if (s.ballY <= 0 || s.ballY >= H - BALL_SIZE) s.dy = -s.dy;

            // Paddle collision — player (left)
            if (s.ballX <= 30 + PADDLE_W && s.ballX >= 30
                && s.ballY + BALL_SIZE >= s.playerY && s.ballY <= s.playerY + PADDLE_H) {
                s.dx = Math.abs(s.dx) * 1.05;
                s.dy = ((s.ballY + BALL_SIZE / 2) - (s.playerY + PADDLE_H / 2)) / (PADDLE_H / 2) * 4;
            }

            // Paddle collision — AI (right)
            if (s.ballX >= W - 30 - PADDLE_W - BALL_SIZE && s.ballX <= W - 30 - BALL_SIZE
                && s.ballY + BALL_SIZE >= s.aiY && s.ballY <= s.aiY + PADDLE_H) {
                s.dx = -Math.abs(s.dx) * 1.05;
                s.dy = ((s.ballY + BALL_SIZE / 2) - (s.aiY + PADDLE_H / 2)) / (PADDLE_H / 2) * 4;
            }

            // Scoring
            if (s.ballX < 0) {
                s.aiScore++;
                setAiScore(s.aiScore);
                s.ballX = W / 2; s.ballY = H / 2;
                s.dx = 4; s.dy = (Math.random() - 0.5) * 4;
            }
            if (s.ballX > W) {
                s.playerScore++;
                setPlayerScore(s.playerScore);
                s.ballX = W / 2; s.ballY = H / 2;
                s.dx = -4; s.dy = (Math.random() - 0.5) * 4;
            }

            // Check win (first to 7)
            if (s.playerScore >= 7 || s.aiScore >= 7) {
                setPlaying(false);
                return;
            }

            // Cap speed
            s.dx = Math.sign(s.dx) * Math.min(Math.abs(s.dx), 10);

            // Draw
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(0, 0, W, H);

            // Center line
            ctx.setLineDash([8, 8]);
            ctx.strokeStyle = "#334155";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(W / 2, 0);
            ctx.lineTo(W / 2, H);
            ctx.stroke();
            ctx.setLineDash([]);

            // Paddles
            ctx.fillStyle = "#60a5fa";
            ctx.beginPath(); ctx.roundRect(30, s.playerY, PADDLE_W, PADDLE_H, 4); ctx.fill();
            ctx.fillStyle = "#f87171";
            ctx.beginPath(); ctx.roundRect(W - 30 - PADDLE_W, s.aiY, PADDLE_W, PADDLE_H, 4); ctx.fill();

            // Ball
            ctx.fillStyle = "#fbbf24";
            ctx.beginPath();
            ctx.arc(s.ballX + BALL_SIZE / 2, s.ballY + BALL_SIZE / 2, BALL_SIZE / 2, 0, Math.PI * 2);
            ctx.fill();

            // Scores
            ctx.fillStyle = "#475569";
            ctx.font = "bold 48px monospace";
            ctx.textAlign = "center";
            ctx.fillText(s.playerScore.toString(), W / 2 - 50, 55);
            ctx.fillText(s.aiScore.toString(), W / 2 + 50, 55);

            animId = requestAnimationFrame(loop);
        };
        animId = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("keydown", handleKey);
            window.removeEventListener("keyup", handleKey);
        };
    }, [playing]);

    // Touch controls
    const handleTouch = useCallback((e: React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const y = (e.touches[0].clientY - rect.top) / rect.height * H;
        state.current.playerY = Math.max(0, Math.min(H - PADDLE_H, y - PADDLE_H / 2));
    }, []);

    const gameOverMessage = state.current.playerScore >= 7 ? "You Win! 🎉" : "AI Wins!";

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg mb-4">
                <Link href="/games" className="text-slate-300 hover:underline text-sm">← Back to Games</Link>
            </div>

            <h1 className="text-4xl font-bold text-white mb-2">🏓 Pong</h1>
            <div className="flex gap-6 mb-4 text-slate-300">
                <span className="text-blue-400">You: {playerScore}</span>
                <span className="text-red-400">AI: {aiScore}</span>
            </div>

            <div className="relative">
                <canvas
                    ref={canvasRef}
                    width={W}
                    height={H}
                    className="rounded-xl border-2 border-slate-600 shadow-2xl"
                    style={{ width: "min(500px, 90vw)", height: "auto", aspectRatio: `${W}/${H}` }}
                    onTouchMove={handleTouch}
                />
                {!playing && (
                    <div className="absolute inset-0 bg-black/60 rounded-xl flex flex-col items-center justify-center">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {playerScore > 0 || aiScore > 0 ? gameOverMessage : "🏓 Pong"}
                        </h2>
                        <button onClick={startGame} className="px-8 py-3 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-500 transition-colors">
                            {playerScore > 0 || aiScore > 0 ? "Play Again" : "Start Game"}
                        </button>
                    </div>
                )}
            </div>

            <p className="mt-4 text-slate-400 text-sm text-center">Arrow keys or W/S to move. First to 7 wins!</p>
            <p className="mt-1 text-slate-500 text-sm md:hidden">📱 Touch & drag to move paddle</p>
        </div>
    );
}
