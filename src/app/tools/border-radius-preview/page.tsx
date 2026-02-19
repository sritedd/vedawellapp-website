"use client";

import { useState } from "react";
import Link from "next/link";

export default function BorderRadiusPreview() {
    const [topLeft, setTopLeft] = useState(20);
    const [topRight, setTopRight] = useState(20);
    const [bottomRight, setBottomRight] = useState(20);
    const [bottomLeft, setBottomLeft] = useState(20);
    const [linked, setLinked] = useState(true);
    const [copied, setCopied] = useState(false);

    const updateAll = (value: number) => {
        if (linked) {
            setTopLeft(value);
            setTopRight(value);
            setBottomRight(value);
            setBottomLeft(value);
        }
    };

    const css = topLeft === topRight && topRight === bottomRight && bottomRight === bottomLeft
        ? `border-radius: ${topLeft}px;`
        : `border-radius: ${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px;`;

    const copy = () => { navigator.clipboard.writeText(css); setCopied(true); setTimeout(() => setCopied(false), 2000); };

    const presets = [
        { name: "Square", values: [0, 0, 0, 0] },
        { name: "Rounded", values: [10, 10, 10, 10] },
        { name: "Pill", values: [50, 50, 50, 50] },
        { name: "Blob", values: [30, 70, 70, 30] },
        { name: "Leaf", values: [0, 50, 0, 50] },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-900 via-slate-900 to-slate-900">
            <nav className="border-b border-rose-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/tools" className="text-rose-400 hover:text-white">← Back</Link>
                        <h1 className="text-xl font-bold text-white">⬜ Border Radius Preview</h1>
                    </div>
                    <button onClick={copy} className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm">{copied ? "✓ Copied" : "Copy CSS"}</button>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6 grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-rose-800/30">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-white font-medium">Controls</span>
                            <label className="flex items-center gap-2 text-sm text-slate-400">
                                <input type="checkbox" checked={linked} onChange={(e) => setLinked(e.target.checked)} />
                                Link corners
                            </label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-xs text-rose-300 mb-1">Top Left: {topLeft}px</label><input type="range" value={topLeft} onChange={(e) => { setTopLeft(parseInt(e.target.value)); updateAll(parseInt(e.target.value)); }} min="0" max="100" className="w-full" /></div>
                            <div><label className="block text-xs text-rose-300 mb-1">Top Right: {topRight}px</label><input type="range" value={topRight} onChange={(e) => { setTopRight(parseInt(e.target.value)); if (linked) updateAll(parseInt(e.target.value)); }} min="0" max="100" className="w-full" /></div>
                            <div><label className="block text-xs text-rose-300 mb-1">Bottom Left: {bottomLeft}px</label><input type="range" value={bottomLeft} onChange={(e) => { setBottomLeft(parseInt(e.target.value)); if (linked) updateAll(parseInt(e.target.value)); }} min="0" max="100" className="w-full" /></div>
                            <div><label className="block text-xs text-rose-300 mb-1">Bottom Right: {bottomRight}px</label><input type="range" value={bottomRight} onChange={(e) => { setBottomRight(parseInt(e.target.value)); if (linked) updateAll(parseInt(e.target.value)); }} min="0" max="100" className="w-full" /></div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {presets.map(p => (
                            <button key={p.name} onClick={() => { setTopLeft(p.values[0]); setTopRight(p.values[1]); setBottomRight(p.values[2]); setBottomLeft(p.values[3]); }} className="px-3 py-1 bg-slate-700 text-white rounded text-sm hover:bg-slate-600">{p.name}</button>
                        ))}
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-rose-800/30">
                        <pre className="text-green-400 font-mono text-sm">{css}</pre>
                    </div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6 border border-rose-800/30 flex items-center justify-center min-h-[300px]">
                    <div className="w-48 h-48 bg-rose-500" style={{ borderRadius: `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px` }} />
                </div>
            </main>
        </div>
    );
}
