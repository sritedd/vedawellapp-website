"use client";

import { useState } from "react";
import Link from "next/link";

export default function TextDiff() {
    const [text1, setText1] = useState("");
    const [text2, setText2] = useState("");

    const computeDiff = () => {
        const lines1 = text1.split("\n");
        const lines2 = text2.split("\n");
        const maxLen = Math.max(lines1.length, lines2.length);
        const result: { line1: string; line2: string; status: "same" | "changed" | "added" | "removed" }[] = [];

        for (let i = 0; i < maxLen; i++) {
            const l1 = lines1[i];
            const l2 = lines2[i];
            if (l1 === l2) result.push({ line1: l1 || "", line2: l2 || "", status: "same" });
            else if (l1 === undefined) result.push({ line1: "", line2: l2, status: "added" });
            else if (l2 === undefined) result.push({ line1: l1, line2: "", status: "removed" });
            else result.push({ line1: l1, line2: l2, status: "changed" });
        }
        return result;
    };

    const diff = computeDiff();
    const changes = diff.filter(d => d.status !== "same").length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900">
            <nav className="border-b border-indigo-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/tools" className="text-indigo-400 hover:text-white">← Back</Link>
                        <h1 className="text-xl font-bold text-white">📝 Text Diff</h1>
                    </div>
                    <span className="text-indigo-400">{changes} difference{changes !== 1 ? "s" : ""}</span>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto p-6">
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div><label className="block text-sm text-indigo-300 mb-2">Original</label><textarea value={text1} onChange={(e) => setText1(e.target.value)} rows={8} className="w-full px-4 py-3 bg-slate-900 border border-indigo-700 rounded-lg text-white font-mono text-sm resize-none" placeholder="Paste original text..." /></div>
                    <div><label className="block text-sm text-indigo-300 mb-2">Modified</label><textarea value={text2} onChange={(e) => setText2(e.target.value)} rows={8} className="w-full px-4 py-3 bg-slate-900 border border-indigo-700 rounded-lg text-white font-mono text-sm resize-none" placeholder="Paste modified text..." /></div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6 border border-indigo-800/30">
                    <h3 className="text-white font-medium mb-4">Comparison</h3>
                    <div className="space-y-1 font-mono text-sm">
                        {diff.map((d, i) => (
                            <div key={i} className={`flex gap-2 p-1 rounded ${d.status === "same" ? "" : d.status === "added" ? "bg-green-900/30" : d.status === "removed" ? "bg-red-900/30" : "bg-yellow-900/30"}`}>
                                <span className="w-8 text-slate-500 text-right">{i + 1}</span>
                                <span className={`flex-1 ${d.status === "removed" ? "text-red-400 line-through" : d.status === "added" ? "text-green-400" : d.status === "changed" ? "text-yellow-400" : "text-slate-300"}`}>
                                    {d.status === "changed" ? d.line2 : d.line1 || d.line2 || " "}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
