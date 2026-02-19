"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface MatchResult {
    match: string;
    index: number;
    groups: string[];
}

const COMMON_PATTERNS = [
    { name: "Email", pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}" },
    { name: "Phone (AU)", pattern: "(?:\\+61|0)[2-478](?:[ -]?\\d){8}" },
    { name: "URL", pattern: "https?:\\/\\/[\\w\\-._~:/?#\\[\\]@!$&'()*+,;=%]+" },
    { name: "IP Address", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b" },
    { name: "Date (DD/MM/YYYY)", pattern: "\\d{2}\\/\\d{2}\\/\\d{4}" },
    { name: "Hex Color", pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b" },
    { name: "Credit Card", pattern: "\\b(?:\\d{4}[ -]?){3}\\d{4}\\b" },
    { name: "Australian Postcode", pattern: "\\b\\d{4}\\b" },
    { name: "Password (8+ chars, upper, lower, digit)", pattern: "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}" },
];

export default function RegexTester() {
    const [pattern, setPattern] = useState("");
    const [flags, setFlags] = useState("g");
    const [testString, setTestString] = useState(`Test your regex patterns here!

Example text with various formats:
- Email: john.doe@example.com, support@vedawell.in
- Phone: 0412 345 678, +61 2 1234 5678
- URLs: https://vedawell.in, http://example.com/path?query=1
- IP: 192.168.1.1, 10.0.0.255
- Dates: 25/12/2025, 01/01/2026
- Colors: #ff5733, #abc, #123456
- Postcodes: 2000, 3000, 4000

Try the common patterns on the right, or write your own!`);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const { matches, highlightedText, regex } = useMemo(() => {
        if (!pattern) {
            return { matches: [], highlightedText: testString, regex: null };
        }

        try {
            const regex = new RegExp(pattern, flags);
            setError(null);

            const matches: MatchResult[] = [];
            let match;

            if (flags.includes("g")) {
                while ((match = regex.exec(testString)) !== null) {
                    matches.push({
                        match: match[0],
                        index: match.index,
                        groups: match.slice(1),
                    });
                    // Prevent infinite loops on zero-length matches
                    if (match[0].length === 0) regex.lastIndex++;
                }
            } else {
                match = regex.exec(testString);
                if (match) {
                    matches.push({
                        match: match[0],
                        index: match.index,
                        groups: match.slice(1),
                    });
                }
            }

            // Create highlighted text
            let highlighted = testString;
            // Sort matches by index descending so replacements don't mess up indices
            const sortedMatches = [...matches].sort((a, b) => b.index - a.index);
            for (const m of sortedMatches) {
                const before = highlighted.slice(0, m.index);
                const after = highlighted.slice(m.index + m.match.length);
                highlighted = before + `<<<MATCH>>>${m.match}<<<END>>>` + after;
            }

            return { matches, highlightedText: highlighted, regex };
        } catch (e) {
            setError((e as Error).message);
            return { matches: [], highlightedText: testString, regex: null };
        }
    }, [pattern, flags, testString]);

    const applyPattern = (p: string) => {
        setPattern(p);
    };

    const copyPattern = () => {
        navigator.clipboard.writeText(`/${pattern}/${flags}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleFlag = (flag: string) => {
        if (flags.includes(flag)) {
            setFlags(flags.replace(flag, ""));
        } else {
            setFlags(flags + flag);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-slate-900">
            {/* Header */}
            <nav className="border-b border-purple-800/50 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/tools" className="text-purple-400 hover:text-white">
                            ← Back
                        </Link>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <span>🔍</span>
                            Regex Tester
                        </h1>
                    </div>
                    <button
                        onClick={copyPattern}
                        disabled={!pattern}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
                    >
                        {copied ? "✓ Copied" : "Copy Pattern"}
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-6">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Column - Input */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Pattern Input */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-800/30">
                            <label className="block text-sm text-purple-300 mb-2 font-medium">
                                Regular Expression
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-purple-400 text-xl">/</span>
                                <input
                                    type="text"
                                    value={pattern}
                                    onChange={(e) => setPattern(e.target.value)}
                                    placeholder="Enter your regex pattern..."
                                    className={`flex-1 px-4 py-3 bg-slate-900 border ${error ? "border-red-500" : "border-purple-700"} rounded-lg text-white font-mono text-lg focus:border-purple-500 focus:outline-none`}
                                />
                                <span className="text-purple-400 text-xl">/</span>
                                <div className="flex gap-1">
                                    {["g", "i", "m", "s"].map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => toggleFlag(f)}
                                            className={`w-10 h-10 rounded font-mono text-sm ${flags.includes(f)
                                                    ? "bg-purple-600 text-white"
                                                    : "bg-slate-700 text-slate-400"
                                                }`}
                                            title={{
                                                g: "Global (find all)",
                                                i: "Case insensitive",
                                                m: "Multiline",
                                                s: "Dotall (. matches newline)",
                                            }[f]}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {error && (
                                <div className="mt-2 text-red-400 text-sm flex items-center gap-2">
                                    <span>⚠️</span> {error}
                                </div>
                            )}
                        </div>

                        {/* Test String */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-800/30">
                            <label className="block text-sm text-purple-300 mb-2 font-medium">
                                Test String
                            </label>
                            <textarea
                                value={testString}
                                onChange={(e) => setTestString(e.target.value)}
                                rows={12}
                                className="w-full px-4 py-3 bg-slate-900 border border-purple-700 rounded-lg text-white font-mono text-sm focus:border-purple-500 focus:outline-none resize-none"
                                placeholder="Enter text to test against..."
                            />
                        </div>

                        {/* Highlighted Results */}
                        {pattern && !error && (
                            <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-800/30">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm text-purple-300 font-medium">
                                        Highlighted Matches
                                    </h3>
                                    <span className="text-purple-400 text-sm">
                                        {matches.length} match{matches.length !== 1 ? "es" : ""}
                                    </span>
                                </div>
                                <div className="p-4 bg-slate-900 rounded-lg font-mono text-sm whitespace-pre-wrap break-all">
                                    {highlightedText.split("<<<MATCH>>>").map((part, i) => {
                                        if (part.includes("<<<END>>>")) {
                                            const [match, rest] = part.split("<<<END>>>");
                                            return (
                                                <span key={i}>
                                                    <mark className="bg-yellow-400 text-black px-0.5 rounded">
                                                        {match}
                                                    </mark>
                                                    {rest}
                                                </span>
                                            );
                                        }
                                        return <span key={i}>{part}</span>;
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Match List */}
                        {matches.length > 0 && (
                            <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-800/30">
                                <h3 className="text-sm text-purple-300 font-medium mb-4">
                                    Match Details
                                </h3>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {matches.map((m, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-4 p-3 bg-slate-900 rounded-lg text-sm"
                                        >
                                            <span className="text-purple-400 font-mono">#{i + 1}</span>
                                            <code className="flex-1 text-green-400 font-mono">
                                                &quot;{m.match}&quot;
                                            </code>
                                            <span className="text-slate-500">
                                                index: {m.index}
                                            </span>
                                            {m.groups.length > 0 && (
                                                <span className="text-blue-400">
                                                    groups: [{m.groups.join(", ")}]
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Common Patterns */}
                    <div className="space-y-6">
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-800/30">
                            <h3 className="text-sm text-purple-300 font-medium mb-4">
                                📚 Common Patterns
                            </h3>
                            <div className="space-y-2">
                                {COMMON_PATTERNS.map((p, i) => (
                                    <button
                                        key={i}
                                        onClick={() => applyPattern(p.pattern)}
                                        className="w-full text-left p-3 bg-slate-900 hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        <div className="text-white font-medium text-sm">{p.name}</div>
                                        <div className="text-purple-400 font-mono text-xs truncate">
                                            {p.pattern}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quick Reference */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-800/30">
                            <h3 className="text-sm text-purple-300 font-medium mb-4">
                                📖 Quick Reference
                            </h3>
                            <div className="space-y-2 text-sm">
                                {[
                                    { token: ".", desc: "Any character" },
                                    { token: "\\d", desc: "Digit [0-9]" },
                                    { token: "\\w", desc: "Word char [a-zA-Z0-9_]" },
                                    { token: "\\s", desc: "Whitespace" },
                                    { token: "^", desc: "Start of line" },
                                    { token: "$", desc: "End of line" },
                                    { token: "*", desc: "0 or more" },
                                    { token: "+", desc: "1 or more" },
                                    { token: "?", desc: "0 or 1" },
                                    { token: "{n,m}", desc: "n to m times" },
                                    { token: "[abc]", desc: "Character class" },
                                    { token: "(abc)", desc: "Capture group" },
                                    { token: "(?:abc)", desc: "Non-capture group" },
                                    { token: "a|b", desc: "Alternation" },
                                ].map((item, i) => (
                                    <div key={i} className="flex justify-between">
                                        <code className="text-purple-400 font-mono">{item.token}</code>
                                        <span className="text-slate-400">{item.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
