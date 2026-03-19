import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

export const metadata: Metadata = {
    title: "19 Free Browser Games — Chess, 2048, Snake, Tetris, Sudoku & More",
    description:
        "Play 19 free browser games: Chess, Sudoku, Solitaire, 2048, Snake, Tetris, Connect Four, Checkers, Battleship, Flappy Bird, Pong & more. No downloads, works offline.",
    keywords:
        "free online games, browser games, chess game, sudoku online, solitaire, 2048 game, snake game, tetris online, connect four, checkers, battleship, flappy bird, pong, brain training games",
    openGraph: {
        title: "19 Free Browser Games — Chess, Sudoku, Snake, Tetris & More",
        description:
            "Play 19 classic games free in your browser. No downloads, works offline, saves high scores.",
        url: "https://vedawellapp.com/games",
    },
    alternates: {
        canonical: "https://vedawellapp.com/games",
    },
};

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
    {
        id: "chess",
        name: "Chess",
        description: "Classic chess with legal move validation",
        icon: "♟️",
        color: "from-amber-700 to-yellow-900",
        difficulty: "Hard",
    },
    {
        id: "sudoku",
        name: "Sudoku",
        description: "Fill the 9×9 grid with numbers 1-9",
        icon: "🔢",
        color: "from-blue-400 to-indigo-600",
        difficulty: "Medium",
    },
    {
        id: "solitaire",
        name: "Solitaire",
        description: "Classic Klondike card game",
        icon: "🃏",
        color: "from-green-600 to-green-800",
        difficulty: "Medium",
    },
    {
        id: "checkers",
        name: "Checkers",
        description: "Jump and capture your opponent's pieces",
        icon: "🔴",
        color: "from-red-500 to-orange-600",
        difficulty: "Medium",
    },
    {
        id: "connect-four",
        name: "Connect Four",
        description: "Drop discs to get four in a row",
        icon: "🟡",
        color: "from-blue-500 to-blue-700",
        difficulty: "Easy",
    },
    {
        id: "battleship",
        name: "Battleship",
        description: "Find and sink the enemy fleet",
        icon: "🚢",
        color: "from-cyan-600 to-slate-700",
        difficulty: "Medium",
    },
    {
        id: "simon-says",
        name: "Simon Says",
        description: "Repeat the color sequence from memory",
        icon: "🎵",
        color: "from-gray-600 to-gray-800",
        difficulty: "Medium",
    },
    {
        id: "breakout",
        name: "Breakout",
        description: "Smash bricks with a bouncing ball",
        icon: "🧱",
        color: "from-indigo-600 to-purple-800",
        difficulty: "Medium",
    },
    {
        id: "flappy-bird",
        name: "Flappy Bird",
        description: "Tap to fly through pipe gaps",
        icon: "🐦",
        color: "from-sky-400 to-sky-600",
        difficulty: "Hard",
    },
    {
        id: "whack-a-mole",
        name: "Whack-a-Mole",
        description: "Tap moles before they disappear!",
        icon: "🔨",
        color: "from-green-500 to-emerald-700",
        difficulty: "Easy",
    },
    {
        id: "platformer",
        name: "Platformer",
        description: "Jump, collect coins, reach the star",
        icon: "🏃",
        color: "from-purple-600 to-indigo-800",
        difficulty: "Medium",
    },
    {
        id: "pong",
        name: "Pong",
        description: "Classic paddle vs AI — first to 7 wins",
        icon: "🏓",
        color: "from-slate-500 to-slate-700",
        difficulty: "Easy",
    },
];

export default function GamesPage() {
    return (
        <>
        <BreadcrumbJsonLd items={[{ name: "Home", href: "/" }, { name: "Browser Games", href: "/games" }]} />
        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
            <main className="py-12 px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Hero */}
                    <div className="text-center mb-12">
                        <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">
                            🎮 {GAMES.length} Free Browser Games
                        </h1>
                        <p className="text-xl text-white/70 max-w-2xl mx-auto">
                            Chess, Sudoku, Solitaire, Tetris and more — play classic games
                            that sharpen your mind. All free, offline-ready, with local high scores.
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

                    {/* Footer note */}
                    <div className="mt-12 text-center">
                        <p className="text-white/50 text-sm">
                            All {GAMES.length} games are free, work offline, and save progress locally.
                        </p>
                    </div>
                </div>
            </main>
        </div>
        </>
    );
}
