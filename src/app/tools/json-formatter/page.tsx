"use client";

import { useState } from "react";
import Link from "next/link";
import ToolFAQ from "@/components/tools/ToolFAQ";

export default function JsonFormatter() {
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [error, setError] = useState("");
    const [indentSize, setIndentSize] = useState(2);
    const [copied, setCopied] = useState(false);

    const formatJson = () => {
        try {
            const parsed = JSON.parse(input);
            setOutput(JSON.stringify(parsed, null, indentSize));
            setError("");
        } catch (e) {
            setError((e as Error).message);
            setOutput("");
        }
    };

    const minifyJson = () => {
        try {
            const parsed = JSON.parse(input);
            setOutput(JSON.stringify(parsed));
            setError("");
        } catch (e) {
            setError((e as Error).message);
            setOutput("");
        }
    };

    const validateJson = () => {
        try {
            JSON.parse(input);
            setError("");
            setOutput("✅ Valid JSON!");
        } catch (e) {
            setError((e as Error).message);
            setOutput("");
        }
    };

    const copyOutput = async () => {
        await navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const loadSample = () => {
        setInput(JSON.stringify({
            name: "John Doe",
            age: 30,
            email: "john@example.com",
            address: {
                street: "123 Main St",
                city: "Sydney",
                country: "Australia"
            },
            hobbies: ["reading", "gaming", "coding"],
            active: true
        }));
        setError("");
        setOutput("");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800">
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

            <main className="py-8 px-6">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-2 text-center">{"{ }"} JSON Formatter</h1>
                    <p className="text-white/60 text-center mb-8">
                        Format, validate, and minify JSON data
                    </p>

                    {/* Controls */}
                    <div className="flex flex-wrap justify-center gap-3 mb-6">
                        <button
                            onClick={formatJson}
                            className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-400 transition-colors"
                        >
                            ✨ Format
                        </button>
                        <button
                            onClick={minifyJson}
                            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-400 transition-colors"
                        >
                            📦 Minify
                        </button>
                        <button
                            onClick={validateJson}
                            className="px-6 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-400 transition-colors"
                        >
                            ✓ Validate
                        </button>
                        <button
                            onClick={loadSample}
                            className="px-6 py-3 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors"
                        >
                            📋 Load Sample
                        </button>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
                            <span className="text-white/70 text-sm">Indent:</span>
                            <select
                                value={indentSize}
                                onChange={(e) => setIndentSize(parseInt(e.target.value))}
                                className="bg-transparent text-white outline-none"
                            >
                                <option value="2" className="text-black">2 spaces</option>
                                <option value="4" className="text-black">4 spaces</option>
                                <option value="1" className="text-black">1 tab</option>
                            </select>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
                            ❌ Error: {error}
                        </div>
                    )}

                    {/* Editors */}
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Input */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-white/70 text-sm">Input JSON</label>
                                <button
                                    onClick={() => {
                                        setInput("");
                                        setOutput("");
                                        setError("");
                                    }}
                                    className="text-white/50 hover:text-white text-sm"
                                >
                                    Clear
                                </button>
                            </div>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder='Paste your JSON here...'
                                className="w-full h-96 px-4 py-3 bg-black/30 text-green-400 font-mono text-sm rounded-xl border border-white/10 focus:border-green-500 outline-none resize-none"
                                spellCheck={false}
                            />
                        </div>

                        {/* Output */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-white/70 text-sm">Output</label>
                                {output && !output.startsWith("✅") && (
                                    <button
                                        onClick={copyOutput}
                                        className={`text-sm px-3 py-1 rounded transition-colors ${copied ? "bg-green-500 text-white" : "bg-white/20 text-white hover:bg-white/30"
                                            }`}
                                    >
                                        {copied ? "Copied!" : "Copy"}
                                    </button>
                                )}
                            </div>
                            <div className="w-full h-96 px-4 py-3 bg-black/30 text-blue-400 font-mono text-sm rounded-xl border border-white/10 overflow-auto whitespace-pre">
                                {output || "Formatted output will appear here..."}
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    {input && (
                        <div className="mt-4 flex justify-center gap-6 text-white/60 text-sm">
                            <span>Input: {input.length} chars</span>
                            {output && !output.startsWith("✅") && (
                                <span>Output: {output.length} chars</span>
                            )}
                            {output && !output.startsWith("✅") && input.length !== output.length && (
                                <span className={output.length < input.length ? "text-green-400" : "text-yellow-400"}>
                                    {output.length < input.length ? "↓" : "↑"} {Math.abs(output.length - input.length)} chars
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <ToolFAQ faqs={[
                    { question: "What is JSON and why does it need formatting?", answer: "JSON (JavaScript Object Notation) is a lightweight data format used for APIs, configuration files, and data exchange. Minified JSON removes whitespace to reduce file size but makes it unreadable. Our formatter adds proper indentation and line breaks so you can read and debug JSON data easily." },
                    { question: "Is my JSON data safe when using this tool?", answer: "Yes, 100%. This JSON formatter runs entirely in your browser. Your data never leaves your device — no server requests, no storage, no logging. It is completely private and secure." },
                    { question: "What causes 'Invalid JSON' errors?", answer: "Common causes include: missing or extra commas, unquoted property names, single quotes instead of double quotes, trailing commas after the last item, and unescaped special characters in strings. Our validator highlights exactly where the error occurs." },
                    { question: "Can I minify JSON with this tool?", answer: "Yes. In addition to formatting (beautifying), this tool can minify JSON by removing all unnecessary whitespace. This is useful for reducing payload size in API responses and configuration files." },
                ]} />
            </main>
        </div>
    );
}
