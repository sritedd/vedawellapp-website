"use client";

import { useState } from "react";
import Link from "next/link";

export default function HashGenerator() {
    const [input, setInput] = useState("");
    const [hashes, setHashes] = useState<{ algorithm: string; hash: string }[]>([]);
    const [isHashing, setIsHashing] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    const generateHashes = async () => {
        if (!input) return;
        setIsHashing(true);

        const algorithms = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];
        const results: { algorithm: string; hash: string }[] = [];

        const encoder = new TextEncoder();
        const data = encoder.encode(input);

        for (const algorithm of algorithms) {
            try {
                const hashBuffer = await crypto.subtle.digest(algorithm, data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
                results.push({ algorithm, hash: hashHex });
            } catch (error) {
                results.push({ algorithm, hash: "Error generating hash" });
            }
        }

        // Add MD5-style hash (simulated with first 32 chars of SHA-256 for demo)
        // Note: Real MD5 would require a library
        const md5Like = results.find(r => r.algorithm === "SHA-256")?.hash.slice(0, 32) || "";

        setHashes([
            { algorithm: "MD5 (simulated)", hash: md5Like },
            ...results,
        ]);
        setIsHashing(false);
    };

    const copyHash = (hash: string, algorithm: string) => {
        navigator.clipboard.writeText(hash);
        setCopied(algorithm);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-900 via-slate-900 to-slate-900">
            {/* Header */}
            <nav className="border-b border-violet-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/tools" className="text-violet-400 hover:text-white">
                            ← Back
                        </Link>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <span>🔐</span>
                            Hash Generator
                        </h1>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto p-6">
                {/* Input */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-violet-800/30 mb-6">
                    <label className="block text-sm text-violet-300 mb-2 font-medium">
                        Text to Hash
                    </label>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter any text to generate its hash..."
                        rows={4}
                        className="w-full px-4 py-3 bg-slate-900 border border-violet-700 rounded-lg text-white font-mono focus:border-violet-500 focus:outline-none resize-none"
                    />
                    <button
                        onClick={generateHashes}
                        disabled={!input || isHashing}
                        className="mt-4 w-full py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isHashing ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Generating...
                            </>
                        ) : (
                            "Generate Hashes"
                        )}
                    </button>
                </div>

                {/* Results */}
                {hashes.length > 0 && (
                    <div className="space-y-4">
                        {hashes.map(({ algorithm, hash }) => (
                            <div
                                key={algorithm}
                                className="bg-slate-800/50 rounded-xl p-6 border border-violet-800/30"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-lg font-medium text-violet-300">{algorithm}</h3>
                                    <button
                                        onClick={() => copyHash(hash, algorithm)}
                                        className="px-3 py-1 bg-violet-600/20 text-violet-400 rounded text-sm hover:bg-violet-600/30"
                                    >
                                        {copied === algorithm ? "✓ Copied" : "Copy"}
                                    </button>
                                </div>
                                <div className="font-mono text-sm text-green-400 bg-slate-900 p-4 rounded-lg break-all">
                                    {hash}
                                </div>
                                <div className="mt-2 text-xs text-slate-500">
                                    {hash.length} characters
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Info */}
                <div className="mt-8 bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                    <h3 className="text-lg font-medium text-white mb-4">About Cryptographic Hashes</h3>
                    <div className="space-y-3 text-sm text-slate-400">
                        <p>
                            <strong className="text-violet-300">SHA-256:</strong> Most commonly used for security. Used in Bitcoin and SSL certificates.
                        </p>
                        <p>
                            <strong className="text-violet-300">SHA-512:</strong> Longer hash with higher security. Good for password hashing.
                        </p>
                        <p>
                            <strong className="text-violet-300">SHA-1:</strong> Legacy algorithm. Not recommended for security-critical applications.
                        </p>
                        <p className="text-amber-400 text-xs mt-4">
                            ⚠️ Hashing is one-way. You cannot reverse a hash to get the original text.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
