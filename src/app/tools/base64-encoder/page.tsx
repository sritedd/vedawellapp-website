"use client";

import { useState } from "react";
import Link from "next/link";

export default function Base64Encoder() {
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [mode, setMode] = useState<"encode" | "decode">("encode");
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    const processText = (text: string, isEncode: boolean) => {
        setInput(text);
        setError("");

        if (!text) {
            setOutput("");
            return;
        }

        try {
            if (isEncode) {
                // Encode to Base64
                const encoded = btoa(unescape(encodeURIComponent(text)));
                setOutput(encoded);
            } else {
                // Decode from Base64
                const decoded = decodeURIComponent(escape(atob(text)));
                setOutput(decoded);
            }
        } catch (e) {
            setError(isEncode ? "Failed to encode text" : "Invalid Base64 string");
            setOutput("");
        }
    };

    const switchMode = (newMode: "encode" | "decode") => {
        setMode(newMode);
        setInput("");
        setOutput("");
        setError("");
    };

    const swapValues = () => {
        if (output && !error) {
            const newMode = mode === "encode" ? "decode" : "encode";
            setMode(newMode);
            processText(output, newMode === "encode");
        }
    };

    const copyOutput = async () => {
        if (!output) return;
        await navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();

        if (mode === "encode") {
            reader.onload = () => {
                const base64 = reader.result as string;
                // Remove data URL prefix
                const base64Data = base64.split(",")[1];
                setOutput(base64Data);
                setInput(`File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
            };
            reader.readAsDataURL(file);
        } else {
            reader.onload = () => {
                const text = reader.result as string;
                processText(text, false);
            };
            reader.readAsText(file);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900">
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
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-2 text-center">🔐 Base64 Encoder</h1>
                    <p className="text-white/60 text-center mb-8">
                        Encode and decode text and files to Base64 format
                    </p>

                    {/* Mode Toggle */}
                    <div className="flex justify-center mb-8">
                        <div className="inline-flex rounded-lg bg-white/10 p-1">
                            <button
                                onClick={() => switchMode("encode")}
                                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${mode === "encode"
                                        ? "bg-white text-gray-900"
                                        : "text-white hover:text-white/80"
                                    }`}
                            >
                                Encode
                            </button>
                            <button
                                onClick={() => switchMode("decode")}
                                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${mode === "decode"
                                        ? "bg-white text-gray-900"
                                        : "text-white hover:text-white/80"
                                    }`}
                            >
                                Decode
                            </button>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-center">
                            ❌ {error}
                        </div>
                    )}

                    {/* Input/Output */}
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Input */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-white/70 text-sm">
                                    {mode === "encode" ? "Text to Encode" : "Base64 to Decode"}
                                </label>
                                <label className="text-sm text-indigo-400 hover:text-indigo-300 cursor-pointer">
                                    📁 Upload File
                                    <input
                                        type="file"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            <textarea
                                value={input}
                                onChange={(e) => processText(e.target.value, mode === "encode")}
                                placeholder={mode === "encode" ? "Enter text to encode..." : "Paste Base64 string..."}
                                className="w-full h-64 px-4 py-3 bg-black/30 text-white font-mono text-sm rounded-xl border border-white/10 focus:border-indigo-500 outline-none resize-none"
                                spellCheck={false}
                            />
                        </div>

                        {/* Swap Button (center) */}
                        <div className="hidden md:flex items-center justify-center -mx-4">
                            <button
                                onClick={swapValues}
                                className="absolute z-10 p-3 bg-indigo-500 rounded-full hover:bg-indigo-400 transition-colors"
                                title="Swap values"
                            >
                                ⇄
                            </button>
                        </div>

                        {/* Output */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-white/70 text-sm">
                                    {mode === "encode" ? "Base64 Output" : "Decoded Text"}
                                </label>
                                {output && (
                                    <button
                                        onClick={copyOutput}
                                        className={`text-sm px-3 py-1 rounded transition-colors ${copied ? "bg-green-500 text-white" : "bg-white/20 text-white hover:bg-white/30"
                                            }`}
                                    >
                                        {copied ? "Copied!" : "Copy"}
                                    </button>
                                )}
                            </div>
                            <div className="w-full h-64 px-4 py-3 bg-black/30 text-green-400 font-mono text-sm rounded-xl border border-white/10 overflow-auto whitespace-pre-wrap break-all">
                                {output || "Output will appear here..."}
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    {(input || output) && (
                        <div className="mt-4 flex justify-center gap-6 text-white/60 text-sm">
                            <span>Input: {input.length} chars</span>
                            <span>Output: {output.length} chars</span>
                            {mode === "encode" && output && (
                                <span className="text-yellow-400">
                                    Size increase: +{Math.round((output.length / input.length - 1) * 100)}%
                                </span>
                            )}
                        </div>
                    )}

                    {/* Info */}
                    <div className="mt-8 p-6 bg-white/5 rounded-2xl text-white/70 text-sm">
                        <h3 className="text-white font-bold mb-2">About Base64</h3>
                        <p>
                            Base64 is a binary-to-text encoding scheme that represents binary data in ASCII format.
                            It's commonly used for encoding data in URLs, emails, and embedding images in HTML/CSS.
                            The encoded output is approximately 33% larger than the original.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
