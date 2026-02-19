"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const EMOJIS = ["🍎", "🍊", "🍋", "🍇", "🍓", "🍑", "🥝", "🍒"];

interface Card {
    id: number;
    emoji: string;
    isFlipped: boolean;
    isMatched: boolean;
}

export default function MemoryGame() {
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [matches, setMatches] = useState(0);
    const [best, setBest] = useState<number | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [gameWon, setGameWon] = useState(false);

    useEffect(() => {
        const savedBest = localStorage.getItem("memoryBest");
        if (savedBest) setBest(parseInt(savedBest));
        initGame();
    }, []);

    const initGame = () => {
        const shuffled = [...EMOJIS, ...EMOJIS]
            .sort(() => Math.random() - 0.5)
            .map((emoji, idx) => ({
                id: idx,
                emoji,
                isFlipped: false,
                isMatched: false,
            }));
        setCards(shuffled);
        setFlippedCards([]);
        setMoves(0);
        setMatches(0);
        setGameWon(false);
        setIsLocked(false);
    };

    const flipCard = (id: number) => {
        if (isLocked) return;
        if (flippedCards.length === 2) return;
        if (cards[id].isFlipped || cards[id].isMatched) return;

        const newCards = [...cards];
        newCards[id].isFlipped = true;
        setCards(newCards);

        const newFlipped = [...flippedCards, id];
        setFlippedCards(newFlipped);

        if (newFlipped.length === 2) {
            setMoves((m) => m + 1);
            setIsLocked(true);

            const [first, second] = newFlipped;
            if (newCards[first].emoji === newCards[second].emoji) {
                // Match!
                newCards[first].isMatched = true;
                newCards[second].isMatched = true;
                setCards(newCards);
                setFlippedCards([]);
                setIsLocked(false);

                const newMatches = matches + 1;
                setMatches(newMatches);

                if (newMatches === EMOJIS.length) {
                    // Game won!
                    const finalMoves = moves + 1;
                    if (!best || finalMoves < best) {
                        setBest(finalMoves);
                        localStorage.setItem("memoryBest", finalMoves.toString());
                    }
                    setGameWon(true);
                }
            } else {
                // No match
                setTimeout(() => {
                    newCards[first].isFlipped = false;
                    newCards[second].isFlipped = false;
                    setCards([...newCards]);
                    setFlippedCards([]);
                    setIsLocked(false);
                }, 1000);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-900 to-rose-800 flex flex-col items-center justify-center p-4">
            {/* Header */}
            <div className="w-full max-w-md mb-4">
                <Link href="/games" className="text-white/70 hover:text-white text-sm">
                    ← Back to Games
                </Link>
            </div>

            <h1 className="text-4xl font-bold text-white mb-4">🃏 Memory Match</h1>

            {/* Score */}
            <div className="flex gap-4 mb-6">
                <div className="bg-white/20 backdrop-blur text-white px-6 py-3 rounded-lg text-center">
                    <div className="text-xs uppercase">Moves</div>
                    <div className="text-2xl font-bold">{moves}</div>
                </div>
                <div className="bg-white/20 backdrop-blur text-white px-6 py-3 rounded-lg text-center">
                    <div className="text-xs uppercase">Matches</div>
                    <div className="text-2xl font-bold">{matches}/{EMOJIS.length}</div>
                </div>
                {best && (
                    <div className="bg-white/20 backdrop-blur text-white px-6 py-3 rounded-lg text-center">
                        <div className="text-xs uppercase">Best</div>
                        <div className="text-2xl font-bold">{best}</div>
                    </div>
                )}
            </div>

            {/* Game Board */}
            <div className="grid grid-cols-4 gap-3 p-4 bg-white/10 backdrop-blur rounded-xl">
                {cards.map((card) => (
                    <button
                        key={card.id}
                        onClick={() => flipCard(card.id)}
                        className={`w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center text-3xl font-bold transition-all duration-300 transform ${card.isFlipped || card.isMatched
                                ? "bg-white rotate-0 scale-100"
                                : "bg-gradient-to-br from-pink-400 to-rose-500 rotate-0 scale-100 hover:scale-105"
                            } ${card.isMatched ? "opacity-60" : ""}`}
                        disabled={card.isFlipped || card.isMatched || isLocked}
                    >
                        {card.isFlipped || card.isMatched ? card.emoji : "?"}
                    </button>
                ))}
            </div>

            {/* Win Overlay */}
            {gameWon && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4">
                        <h2 className="text-3xl font-bold mb-2">🎉 You Won!</h2>
                        <p className="text-gray-600 mb-4">
                            Completed in {moves} moves
                            {best === moves && " - New record!"}
                        </p>
                        <button
                            onClick={initGame}
                            className="px-6 py-3 bg-pink-500 text-white rounded-lg font-semibold hover:bg-pink-400 transition-colors"
                        >
                            Play Again
                        </button>
                    </div>
                </div>
            )}

            {/* New Game Button */}
            <button
                onClick={initGame}
                className="mt-6 px-8 py-3 bg-white/20 backdrop-blur text-white rounded-lg font-semibold hover:bg-white/30 transition-colors"
            >
                New Game
            </button>

            <p className="mt-4 text-white/70 text-center">
                Find all matching pairs in the fewest moves!
            </p>
        </div>
    );
}
