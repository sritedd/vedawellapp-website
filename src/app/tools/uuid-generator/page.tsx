"use client";

import { useState } from "react";
import Link from "next/link";

export default function UUIDGenerator() {
    const [uuids, setUuids] = useState<string[]>([]);
    const [count, setCount] = useState(5);
    const [format, setFormat] = useState<"standard" | "uppercase" | "no-dashes">("standard");
    const [version, setVersion] = useState<"v4" | "v7">("v4");
    const [copied, setCopied] = useState<string | null>(null);

    const generateUUIDv4 = (): string => {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    };

    const generateUUIDv7 = (): string => {
        // UUID v7 - Time-ordered UUID (RFC 9562)
        const now = Date.now();
        const hex = now.toString(16).padStart(12, "0");
        const random = Array.from({ length: 4 }, () =>
            Math.floor(Math.random() * 256).toString(16).padStart(2, "0")
        ).join("");

        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-7${random.slice(0, 3)}-${((parseInt(random.slice(3, 5), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0")}${random.slice(5, 7)}-${generateRandomHex(12)}`;
    };

    const generateRandomHex = (length: number): string => {
        return Array.from({ length: length / 2 }, () =>
            Math.floor(Math.random() * 256).toString(16).padStart(2, "0")
        ).join("");
    };

    const formatUUID = (uuid: string): string => {
        switch (format) {
            case "uppercase":
                return uuid.toUpperCase();
            case "no-dashes":
                return uuid.replace(/-/g, "");
            default:
                return uuid;
        }
    };

    const generateUUIDs = () => {
        const newUuids = Array.from({ length: count }, () => {
            const uuid = version === "v4" ? generateUUIDv4() : generateUUIDv7();
            return formatUUID(uuid);
        });
        setUuids(newUuids);
    };

    const copyUUID = (uuid: string) => {
        navigator.clipboard.writeText(uuid);
        setCopied(uuid);
        setTimeout(() => setCopied(null), 2000);
    };

    const copyAll = () => {
        navigator.clipboard.writeText(uuids.join("\n"));
        setCopied("all");
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-900 via-slate-900 to-slate-900">
            {/* Header */}
            <nav className="border-b border-pink-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/tools" className="text-pink-400 hover:text-white">
                            ← Back
                        </Link>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <span>🆔</span>
                            UUID Generator
                        </h1>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto p-6">
                {/* Controls */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-pink-800/30 mb-6">
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                        {/* Version */}
                        <div>
                            <label className="block text-sm text-pink-300 mb-2">Version</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setVersion("v4")}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${version === "v4"
                                            ? "bg-pink-600 text-white"
                                            : "bg-slate-700 text-slate-300"
                                        }`}
                                >
                                    UUID v4
                                </button>
                                <button
                                    onClick={() => setVersion("v7")}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${version === "v7"
                                            ? "bg-pink-600 text-white"
                                            : "bg-slate-700 text-slate-300"
                                        }`}
                                >
                                    UUID v7
                                </button>
                            </div>
                        </div>

                        {/* Format */}
                        <div>
                            <label className="block text-sm text-pink-300 mb-2">Format</label>
                            <select
                                value={format}
                                onChange={(e) => setFormat(e.target.value as typeof format)}
                                className="w-full px-4 py-2 bg-slate-900 border border-pink-700 rounded-lg text-white focus:border-pink-500 focus:outline-none"
                            >
                                <option value="standard">Standard (lowercase)</option>
                                <option value="uppercase">UPPERCASE</option>
                                <option value="no-dashes">No dashes</option>
                            </select>
                        </div>

                        {/* Count */}
                        <div>
                            <label className="block text-sm text-pink-300 mb-2">Count</label>
                            <input
                                type="number"
                                value={count}
                                onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                                min="1"
                                max="100"
                                className="w-full px-4 py-2 bg-slate-900 border border-pink-700 rounded-lg text-white focus:border-pink-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <button
                        onClick={generateUUIDs}
                        className="w-full py-3 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700"
                    >
                        Generate UUIDs
                    </button>
                </div>

                {/* Results */}
                {uuids.length > 0 && (
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-pink-800/30">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-white">Generated UUIDs</h3>
                            <button
                                onClick={copyAll}
                                className="px-4 py-2 bg-pink-600/20 text-pink-400 rounded-lg text-sm hover:bg-pink-600/30"
                            >
                                {copied === "all" ? "✓ Copied All" : "Copy All"}
                            </button>
                        </div>
                        <div className="space-y-2">
                            {uuids.map((uuid, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between p-3 bg-slate-900 rounded-lg group"
                                >
                                    <code className="font-mono text-green-400">{uuid}</code>
                                    <button
                                        onClick={() => copyUUID(uuid)}
                                        className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        {copied === uuid ? "✓" : "Copy"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Info */}
                <div className="mt-8 grid md:grid-cols-2 gap-4">
                    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                        <h3 className="text-lg font-medium text-pink-400 mb-3">UUID v4</h3>
                        <p className="text-slate-400 text-sm">
                            Random UUID. Most commonly used. Extremely low collision probability
                            (1 in 5.3 × 10³⁶). Perfect for database primary keys.
                        </p>
                    </div>
                    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                        <h3 className="text-lg font-medium text-pink-400 mb-3">UUID v7</h3>
                        <p className="text-slate-400 text-sm">
                            Time-ordered UUID (RFC 9562). Encodes timestamp for natural sorting.
                            Better for database indexes. New in 2024.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
