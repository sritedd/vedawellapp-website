"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const SAMPLE_TEXTS = [
    "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet and is perfect for typing practice.",
    "Programming is the art of telling a computer what to do. Good code is its own best documentation. Write code that is easy to read and understand.",
    "React is a JavaScript library for building user interfaces. It lets you compose complex UIs from small and isolated pieces of code called components.",
    "TypeScript is a strongly typed programming language that builds on JavaScript. It adds optional static typing and class-based object-oriented programming.",
    "The best way to learn something is by doing. Practice makes perfect. Start typing now and see your speed improve over time with consistent effort.",
];

export default function TypingSpeedTest() {
    const [text, setText] = useState("");
    const [userInput, setUserInput] = useState("");
    const [startTime, setStartTime] = useState<number | null>(null);
    const [endTime, setEndTime] = useState<number | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [errors, setErrors] = useState(0);

    const generateNewText = useCallback(() => {
        const randomText = SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)];
        setText(randomText);
        setUserInput("");
        setStartTime(null);
        setEndTime(null);
        setIsRunning(false);
        setCurrentTime(0);
        setErrors(0);
    }, []);

    useEffect(() => {
        generateNewText();
    }, [generateNewText]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning && !endTime) {
            interval = setInterval(() => {
                setCurrentTime(Date.now() - (startTime || Date.now()));
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isRunning, startTime, endTime]);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;

        // Start timer on first keystroke
        if (!startTime && value.length > 0) {
            setStartTime(Date.now());
            setIsRunning(true);
        }

        // Count errors (characters that don't match)
        let errorCount = 0;
        for (let i = 0; i < value.length; i++) {
            if (value[i] !== text[i]) {
                errorCount++;
            }
        }
        setErrors(errorCount);

        setUserInput(value);

        // Check if complete
        if (value === text) {
            setEndTime(Date.now());
            setIsRunning(false);
        }
    };

    const calculateWPM = (): number => {
        if (!startTime) return 0;
        const end = endTime || Date.now();
        const timeInMinutes = (end - startTime) / 60000;
        if (timeInMinutes === 0) return 0;
        const words = userInput.trim().split(/\s+/).length;
        return Math.round(words / timeInMinutes);
    };

    const calculateAccuracy = (): number => {
        if (userInput.length === 0) return 100;
        const correctChars = userInput.split("").filter((char, i) => char === text[i]).length;
        return Math.round((correctChars / userInput.length) * 100);
    };

    const formatTime = (ms: number): string => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    };

    const getCharacterClass = (index: number): string => {
        if (index >= userInput.length) return "text-slate-500"; // Not typed yet
        if (userInput[index] === text[index]) return "text-green-400"; // Correct
        return "text-red-400 bg-red-500/20"; // Wrong
    };

    const isComplete = endTime !== null;
    const wpm = calculateWPM();
    const accuracy = calculateAccuracy();

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-900 via-slate-900 to-slate-900">
            {/* Header */}
            <nav className="border-b border-cyan-800/50 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/tools" className="text-cyan-400 hover:text-white">
                            ← Back
                        </Link>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <span>⌨️</span>
                            Typing Speed Test
                        </h1>
                    </div>
                    <button
                        onClick={generateNewText}
                        className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700"
                    >
                        🔄 New Text
                    </button>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto p-6">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-cyan-800/30">
                        <div className="text-3xl font-bold text-cyan-400">{wpm}</div>
                        <div className="text-slate-400 text-sm">WPM</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-cyan-800/30">
                        <div className="text-3xl font-bold text-green-400">{accuracy}%</div>
                        <div className="text-slate-400 text-sm">Accuracy</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-cyan-800/30">
                        <div className="text-3xl font-bold text-amber-400">{formatTime(currentTime)}</div>
                        <div className="text-slate-400 text-sm">Time</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-cyan-800/30">
                        <div className="text-3xl font-bold text-red-400">{errors}</div>
                        <div className="text-slate-400 text-sm">Errors</div>
                    </div>
                </div>

                {/* Text Display */}
                <div className="bg-slate-800/50 rounded-xl p-8 border border-cyan-800/30 mb-6">
                    <div className="text-2xl leading-relaxed font-mono">
                        {text.split("").map((char, index) => (
                            <span key={index} className={getCharacterClass(index)}>
                                {char}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Input Area */}
                {!isComplete ? (
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-cyan-800/30">
                        <textarea
                            value={userInput}
                            onChange={handleInput}
                            placeholder="Start typing here..."
                            className="w-full h-40 bg-transparent text-white text-xl font-mono resize-none focus:outline-none"
                            autoFocus
                            spellCheck={false}
                            autoComplete="off"
                            autoCorrect="off"
                        />
                    </div>
                ) : (
                    <div className="bg-green-900/20 rounded-xl p-8 border border-green-500/30 text-center">
                        <div className="text-5xl mb-4">🎉</div>
                        <h2 className="text-2xl font-bold text-white mb-4">Test Complete!</h2>
                        <div className="grid grid-cols-3 gap-6 max-w-md mx-auto mb-6">
                            <div>
                                <div className="text-4xl font-bold text-cyan-400">{wpm}</div>
                                <div className="text-slate-400">WPM</div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-green-400">{accuracy}%</div>
                                <div className="text-slate-400">Accuracy</div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-amber-400">{formatTime(currentTime)}</div>
                                <div className="text-slate-400">Time</div>
                            </div>
                        </div>
                        <button
                            onClick={generateNewText}
                            className="px-8 py-3 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Tips */}
                <div className="mt-8 text-center text-slate-500 text-sm">
                    💡 Tip: Focus on accuracy first, speed will come with practice!
                </div>
            </main>
        </div>
    );
}
