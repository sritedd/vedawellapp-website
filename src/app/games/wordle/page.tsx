"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const WORDS = [
    "REACT", "SWIFT", "BRAIN", "CLOUD", "PIXEL", "QUERY", "STACK",
    "DEBUG", "ARRAY", "CACHE", "FLASK", "LINUX", "MOUSE", "PATCH",
    "PRINT", "SCOPE", "SHELL", "TABLE", "VIRUS", "BADGE", "CLASS",
    "CRANE", "DWARF", "FLAME", "GRAPE", "HOUSE", "JOLLY", "KNACK",
    "LEAPS", "MAGIC", "NASAL", "OZONE", "PLUMB", "QUEEN", "RANGE",
    "SHOUT", "TRICK", "ULTRA", "VIVID", "WALTZ", "XENON", "YOUTH",
    "ZEBRA", "AGILE", "BLOOM", "CRAFT", "DISCO", "ETHIC", "FRESH",
];

const KEYBOARD_ROWS = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

type LetterStatus = "correct" | "present" | "absent" | "unused";

export default function WordlePage() {
    const [targetWord, setTargetWord] = useState("");
    const [guesses, setGuesses] = useState<string[]>([]);
    const [currentGuess, setCurrentGuess] = useState("");
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);
    const [shake, setShake] = useState(false);
    const [letterStatuses, setLetterStatuses] = useState<Record<string, LetterStatus>>({});

    useEffect(() => {
        setTargetWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
    }, []);

    const getLetterStatus = (letter: string, position: number, word: string): LetterStatus => {
        if (targetWord[position] === letter) return "correct";
        if (targetWord.includes(letter)) return "present";
        return "absent";
    };

    const submitGuess = () => {
        if (currentGuess.length !== 5) {
            setShake(true);
            setTimeout(() => setShake(false), 500);
            return;
        }

        const newGuesses = [...guesses, currentGuess];
        setGuesses(newGuesses);

        // Update letter statuses for keyboard
        const newStatuses = { ...letterStatuses };
        for (let i = 0; i < currentGuess.length; i++) {
            const letter = currentGuess[i];
            const status = getLetterStatus(letter, i, currentGuess);
            // Only update if better (correct > present > absent)
            if (status === "correct" || (status === "present" && newStatuses[letter] !== "correct") || !newStatuses[letter]) {
                newStatuses[letter] = status;
            }
        }
        setLetterStatuses(newStatuses);

        if (currentGuess === targetWord) {
            setWon(true);
            setGameOver(true);
        } else if (newGuesses.length >= 6) {
            setGameOver(true);
        }

        setCurrentGuess("");
    };

    const handleKey = (key: string) => {
        if (gameOver) return;

        if (key === "ENTER") {
            submitGuess();
        } else if (key === "⌫" || key === "BACKSPACE") {
            setCurrentGuess((prev) => prev.slice(0, -1));
        } else if (currentGuess.length < 5 && /^[A-Z]$/.test(key)) {
            setCurrentGuess((prev) => prev + key);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            handleKey(e.key.toUpperCase());
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentGuess, gameOver]);

    const resetGame = () => {
        setTargetWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
        setGuesses([]);
        setCurrentGuess("");
        setGameOver(false);
        setWon(false);
        setLetterStatuses({});
    };

    const getGridCellClass = (letter: string | null, status: LetterStatus | null) => {
        const base = "w-14 h-14 border-2 flex items-center justify-center text-2xl font-bold uppercase transition-all duration-300";
        if (!letter) return `${base} border-gray-300`;
        if (!status) return `${base} border-gray-500`;
        if (status === "correct") return `${base} bg-green-500 border-green-500 text-white`;
        if (status === "present") return `${base} bg-yellow-500 border-yellow-500 text-white`;
        return `${base} bg-gray-500 border-gray-500 text-white`;
    };

    const getKeyClass = (key: string) => {
        const status = letterStatuses[key];
        const base = "font-bold rounded transition-colors";
        const size = key.length > 1 ? "px-3 py-4 text-xs" : "px-4 py-4 text-lg";

        if (status === "correct") return `${base} ${size} bg-green-500 text-white`;
        if (status === "present") return `${base} ${size} bg-yellow-500 text-white`;
        if (status === "absent") return `${base} ${size} bg-gray-500 text-white`;
        return `${base} ${size} bg-gray-200 hover:bg-gray-300`;
    };

    // Build display grid
    const displayRows: { letter: string | null; status: LetterStatus | null }[][] = [];
    for (let i = 0; i < 6; i++) {
        const row: { letter: string | null; status: LetterStatus | null }[] = [];
        if (i < guesses.length) {
            for (let j = 0; j < 5; j++) {
                row.push({
                    letter: guesses[i][j],
                    status: getLetterStatus(guesses[i][j], j, guesses[i]),
                });
            }
        } else if (i === guesses.length) {
            for (let j = 0; j < 5; j++) {
                row.push({
                    letter: currentGuess[j] || null,
                    status: null,
                });
            }
        } else {
            for (let j = 0; j < 5; j++) {
                row.push({ letter: null, status: null });
            }
        }
        displayRows.push(row);
    }

    return (
        <div className="min-h-screen bg-white">
            <nav className="border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold">
                        <span>🎮</span>
                        <span>VedaWell Games</span>
                    </Link>
                    <Link href="/games" className="text-gray-600 hover:text-gray-900">
                        ← All Games
                    </Link>
                </div>
            </nav>

            <main className="py-8 px-6">
                <div className="max-w-md mx-auto text-center">
                    <h1 className="text-3xl font-bold mb-6">Wordle</h1>

                    {/* Game Grid */}
                    <div className={`grid gap-1 justify-center mb-6 ${shake ? "animate-shake" : ""}`}>
                        {displayRows.map((row, i) => (
                            <div key={i} className="flex gap-1">
                                {row.map((cell, j) => (
                                    <div
                                        key={j}
                                        className={getGridCellClass(cell.letter, cell.status)}
                                    >
                                        {cell.letter}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Game Over Message */}
                    {gameOver && (
                        <div className="mb-6">
                            {won ? (
                                <p className="text-2xl font-bold text-green-600 mb-4">
                                    🎉 You won in {guesses.length} guesses!
                                </p>
                            ) : (
                                <p className="text-2xl font-bold text-red-600 mb-4">
                                    The word was: <span className="text-black">{targetWord}</span>
                                </p>
                            )}
                            <button
                                onClick={resetGame}
                                className="px-6 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600"
                            >
                                Play Again
                            </button>
                        </div>
                    )}

                    {/* Keyboard */}
                    <div className="space-y-2">
                        {KEYBOARD_ROWS.map((row, i) => (
                            <div key={i} className="flex justify-center gap-1">
                                {row.map((key) => (
                                    <button
                                        key={key}
                                        onClick={() => handleKey(key)}
                                        className={getKeyClass(key)}
                                    >
                                        {key}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>

                    <p className="mt-6 text-gray-500 text-sm">
                        Guess the 5-letter word in 6 tries.
                        Green = correct, Yellow = wrong position, Gray = not in word.
                    </p>
                </div>
            </main>

            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20%, 60% { transform: translateX(-5px); }
                    40%, 80% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.4s ease-in-out;
                }
            `}</style>
        </div>
    );
}
