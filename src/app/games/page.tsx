"use client";

import Link from "next/link";

const GAMES = [
    {
        id: "2048",
        name: "2048",
        description: "Slide tiles to combine and reach 2048",
        icon: "🎮",
        color: "from-amber-400 to-orange-500",
        difficulty: "Easy",
    },
    {
        id: "snake",
        name: "Snake",
        description: "Classic snake game - eat and grow!",
        icon: "🐍",
        color: "from-green-400 to-emerald-600",
        difficulty: "Medium",
    },
    {
        id: "tetris",
        name: "Tetris",
        description: "Stack falling blocks to clear lines",
        icon: "🧱",
        color: "from-purple-400 to-indigo-600",
        difficulty: "Medium",
    },
    {
        id: "memory",
        name: "Memory Match",
        description: "Find matching pairs of cards",
        icon: "🃏",
        color: "from-pink-400 to-rose-500",
        difficulty: "Easy",
    },
    {
        id: "minesweeper",
        name: "Minesweeper",
        description: "Clear the minefield without exploding",
        icon: "💣",
        color: "from-gray-400 to-slate-600",
        difficulty: "Hard",
    },
    {
        id: "tic-tac-toe",
        name: "Tic Tac Toe",
        description: "Classic X and O strategy game",
        icon: "⭕",
        color: "from-blue-400 to-cyan-500",
        difficulty: "Easy",
    },
    {
        id: "wordle",
        name: "Wordle",
        description: "Guess the 5-letter word in 6 tries",
        icon: "📝",
        color: "from-emerald-400 to-teal-500",
        difficulty: "Medium",
    },
];

export default function GamesPage() {
    return (
        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
            <main className="py-12 px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Hero */}
                    <div className="text-center mb-12">
                        <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">
                            🎮 Brain Training Games
                        </h1>
                        <p className="text-xl text-white/70 max-w-2xl mx-auto">
                            Challenge yourself with classic games that sharpen your mind.
                            All games work offline and save your high scores locally.
                        </p>
                    </div>

                    {/* Games Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {GAMES.map((game) => (
                            <Link
                                key={game.id}
                                href={`/games/${game.id}`}
                                className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-6 hover:scale-105 transition-all duration-300"
                            >
                                <div
                                    className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-20 transition-opacity`}
                                />
                                <div className="relative">
                                    <div className="text-5xl mb-4">{game.icon}</div>
                                    <h2 className="text-2xl font-bold text-white mb-2">{game.name}</h2>
                                    <p className="text-white/70 mb-4">{game.description}</p>
                                    <div className="flex items-center justify-between">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${game.difficulty === "Easy"
                                                ? "bg-green-500/20 text-green-300"
                                                : game.difficulty === "Medium"
                                                    ? "bg-yellow-500/20 text-yellow-300"
                                                    : "bg-red-500/20 text-red-300"
                                                }`}
                                        >
                                            {game.difficulty}
                                        </span>
                                        <span className="text-white/50 group-hover:text-white transition-colors">
                                            Play →
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Coming Soon */}
                    <div className="mt-12 text-center">
                        <p className="text-white/50 text-sm">
                            More games coming soon: Flappy Bird, Breakout, Pong, Simon Says, and more!
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
