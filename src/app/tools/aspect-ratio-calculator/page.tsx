"use client";

import { useState } from "react";
import Link from "next/link";

const COMMON_RATIOS = [
    { name: "16:9", w: 16, h: 9 },
    { name: "4:3", w: 4, h: 3 },
    { name: "1:1", w: 1, h: 1 },
    { name: "21:9", w: 21, h: 9 },
    { name: "3:2", w: 3, h: 2 },
    { name: "9:16", w: 9, h: 16 },
];

export default function AspectRatioCalculator() {
    const [width, setWidth] = useState(1920);
    const [height, setHeight] = useState(1080);
    const [lockedDimension, setLockedDimension] = useState<"width" | "height">("width");

    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const ratio = gcd(width, height);
    const ratioW = width / ratio;
    const ratioH = height / ratio;

    const applyRatio = (w: number, h: number) => {
        if (lockedDimension === "width") {
            setHeight(Math.round((width / w) * h));
        } else {
            setWidth(Math.round((height / h) * w));
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900">
            <nav className="border-b border-indigo-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-indigo-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">📐 Aspect Ratio Calculator</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-indigo-800/30 mb-6">
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm text-indigo-300 mb-1">Width</label>
                            <div className="flex gap-2">
                                <input type="number" value={width} onChange={(e) => setWidth(parseInt(e.target.value) || 0)} className="flex-1 px-4 py-2 bg-slate-900 border border-indigo-700 rounded-lg text-white" />
                                <button onClick={() => setLockedDimension("width")} className={`px-3 py-2 rounded-lg ${lockedDimension === "width" ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-300"}`}>🔒</button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-indigo-300 mb-1">Height</label>
                            <div className="flex gap-2">
                                <input type="number" value={height} onChange={(e) => setHeight(parseInt(e.target.value) || 0)} className="flex-1 px-4 py-2 bg-slate-900 border border-indigo-700 rounded-lg text-white" />
                                <button onClick={() => setLockedDimension("height")} className={`px-3 py-2 rounded-lg ${lockedDimension === "height" ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-300"}`}>🔒</button>
                            </div>
                        </div>
                    </div>
                    <div className="text-center py-4 bg-slate-900 rounded-lg">
                        <div className="text-sm text-slate-400 mb-1">Aspect Ratio</div>
                        <div className="text-4xl font-bold text-indigo-400">{ratioW}:{ratioH}</div>
                    </div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6 border border-indigo-800/30 mb-6">
                    <h3 className="text-white font-medium mb-4">Common Ratios</h3>
                    <div className="flex flex-wrap gap-2">
                        {COMMON_RATIOS.map(r => (
                            <button key={r.name} onClick={() => applyRatio(r.w, r.h)} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">{r.name}</button>
                        ))}
                    </div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6 border border-indigo-800/30">
                    <div className="text-sm text-slate-400 mb-2">Preview</div>
                    <div className="flex justify-center">
                        <div className="bg-indigo-600/30 border-2 border-indigo-500" style={{ width: Math.min(300, width / 10), height: Math.min(200, height / 10), aspectRatio: `${width}/${height}` }} />
                    </div>
                </div>
            </main>
        </div>
    );
}
