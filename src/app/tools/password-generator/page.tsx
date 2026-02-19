"use client";

import { useState } from "react";
import Link from "next/link";

export default function PasswordGenerator() {
    const [length, setLength] = useState(16);
    const [includeUppercase, setIncludeUppercase] = useState(true);
    const [includeLowercase, setIncludeLowercase] = useState(true);
    const [includeNumbers, setIncludeNumbers] = useState(true);
    const [includeSymbols, setIncludeSymbols] = useState(true);
    const [password, setPassword] = useState("");
    const [copied, setCopied] = useState(false);

    const generatePassword = () => {
        let chars = "";
        if (includeUppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        if (includeLowercase) chars += "abcdefghijklmnopqrstuvwxyz";
        if (includeNumbers) chars += "0123456789";
        if (includeSymbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";

        if (!chars) {
            setPassword("Please select at least one option");
            return;
        }

        let result = "";
        const array = new Uint32Array(length);
        crypto.getRandomValues(array);
        for (let i = 0; i < length; i++) {
            result += chars[array[i] % chars.length];
        }
        setPassword(result);
        setCopied(false);
    };

    const copyToClipboard = async () => {
        if (!password || password.includes("Please select")) return;
        await navigator.clipboard.writeText(password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getStrength = () => {
        if (!password || password.includes("Please select")) return { label: "", color: "", width: "0%" };

        let score = 0;
        if (password.length >= 12) score++;
        if (password.length >= 16) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score <= 2) return { label: "Weak", color: "bg-red-500", width: "25%" };
        if (score <= 4) return { label: "Medium", color: "bg-yellow-500", width: "50%" };
        if (score <= 5) return { label: "Strong", color: "bg-blue-500", width: "75%" };
        return { label: "Very Strong", color: "bg-green-500", width: "100%" };
    };

    const strength = getStrength();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
            {/* Header */}
            <nav className="border-b border-white/10 bg-black/20 backdrop-blur">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
                        <span>🛠️</span>
                        <span>VedaWell Tools</span>
                    </Link>
                    <Link href="/tools" className="text-white/70 hover:text-white">
                        ← All Tools
                    </Link>
                </div>
            </nav>

            <main className="py-12 px-6">
                <div className="max-w-lg mx-auto">
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
                        <h1 className="text-3xl font-bold text-white mb-2 text-center">🔐 Password Generator</h1>
                        <p className="text-white/60 text-center mb-8">
                            Generate secure, random passwords
                        </p>

                        {/* Password Display */}
                        <div className="bg-black/30 rounded-xl p-4 mb-6">
                            <div className="flex items-center justify-between gap-4">
                                <code className="text-lg text-green-400 font-mono break-all flex-1">
                                    {password || "Click Generate"}
                                </code>
                                <button
                                    onClick={copyToClipboard}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${copied
                                            ? "bg-green-500 text-white"
                                            : "bg-white/20 text-white hover:bg-white/30"
                                        }`}
                                >
                                    {copied ? "Copied!" : "Copy"}
                                </button>
                            </div>

                            {/* Strength Indicator */}
                            {password && !password.includes("Please select") && (
                                <div className="mt-4">
                                    <div className="flex justify-between text-xs text-white/60 mb-1">
                                        <span>Password Strength</span>
                                        <span>{strength.label}</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${strength.color} transition-all duration-300`}
                                            style={{ width: strength.width }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Length Slider */}
                        <div className="mb-6">
                            <div className="flex justify-between text-white mb-2">
                                <label>Length</label>
                                <span className="font-mono bg-white/20 px-3 py-1 rounded">{length}</span>
                            </div>
                            <input
                                type="range"
                                min="6"
                                max="64"
                                value={length}
                                onChange={(e) => setLength(parseInt(e.target.value))}
                                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-white/40 mt-1">
                                <span>6</span>
                                <span>64</span>
                            </div>
                        </div>

                        {/* Options */}
                        <div className="space-y-3 mb-8">
                            <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                                <span className="text-white">Uppercase (A-Z)</span>
                                <input
                                    type="checkbox"
                                    checked={includeUppercase}
                                    onChange={(e) => setIncludeUppercase(e.target.checked)}
                                    className="w-5 h-5 accent-green-500"
                                />
                            </label>
                            <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                                <span className="text-white">Lowercase (a-z)</span>
                                <input
                                    type="checkbox"
                                    checked={includeLowercase}
                                    onChange={(e) => setIncludeLowercase(e.target.checked)}
                                    className="w-5 h-5 accent-green-500"
                                />
                            </label>
                            <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                                <span className="text-white">Numbers (0-9)</span>
                                <input
                                    type="checkbox"
                                    checked={includeNumbers}
                                    onChange={(e) => setIncludeNumbers(e.target.checked)}
                                    className="w-5 h-5 accent-green-500"
                                />
                            </label>
                            <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                                <span className="text-white">Symbols (!@#$%)</span>
                                <input
                                    type="checkbox"
                                    checked={includeSymbols}
                                    onChange={(e) => setIncludeSymbols(e.target.checked)}
                                    className="w-5 h-5 accent-green-500"
                                />
                            </label>
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={generatePassword}
                            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
                        >
                            🎲 Generate Password
                        </button>
                    </div>

                    {/* Security Tips */}
                    <div className="mt-8 p-6 bg-white/5 rounded-2xl text-white/70 text-sm">
                        <h3 className="font-bold text-white mb-2">🔒 Security Tips</h3>
                        <ul className="space-y-1">
                            <li>• Use at least 16 characters for important accounts</li>
                            <li>• Enable all character types for maximum security</li>
                            <li>• Never reuse passwords across different sites</li>
                            <li>• Consider using a password manager</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}
