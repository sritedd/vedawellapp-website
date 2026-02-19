"use client";

import { useState } from "react";
import Link from "next/link";

export default function ColorPaletteGenerator() {
    const [baseColor, setBaseColor] = useState("#3b82f6");
    const [mode, setMode] = useState<"complementary" | "analogous" | "triadic" | "split" | "shades">("complementary");
    const [copied, setCopied] = useState<string | null>(null);

    const hexToHsl = (hex: string): [number, number, number] => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0;
        const l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    };

    const hslToHex = (h: number, s: number, l: number): string => {
        h = ((h % 360) + 360) % 360;
        s /= 100; l /= 100;
        const a = s * Math.min(l, 1 - l);
        const f = (n: number) => { const k = (n + h / 30) % 12; const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); return Math.round(255 * color).toString(16).padStart(2, "0"); };
        return `#${f(0)}${f(8)}${f(4)}`;
    };

    const [h, s, l] = hexToHsl(baseColor);

    const generatePalette = (): string[] => {
        switch (mode) {
            case "complementary": return [baseColor, hslToHex(h + 180, s, l)];
            case "analogous": return [hslToHex(h - 30, s, l), baseColor, hslToHex(h + 30, s, l)];
            case "triadic": return [baseColor, hslToHex(h + 120, s, l), hslToHex(h + 240, s, l)];
            case "split": return [baseColor, hslToHex(h + 150, s, l), hslToHex(h + 210, s, l)];
            case "shades": return [hslToHex(h, s, 90), hslToHex(h, s, 70), hslToHex(h, s, 50), baseColor, hslToHex(h, s, 30), hslToHex(h, s, 10)];
            default: return [baseColor];
        }
    };

    const palette = generatePalette();
    const copy = (c: string) => { navigator.clipboard.writeText(c); setCopied(c); setTimeout(() => setCopied(null), 2000); };

    return (
        <div className="min-h-screen bg-gradient-to-br from-fuchsia-900 via-slate-900 to-slate-900">
            <nav className="border-b border-fuchsia-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-fuchsia-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">🎨 Color Palette Generator</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-fuchsia-800/30 mb-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-fuchsia-300 mb-2">Base Color</label>
                            <div className="flex gap-2">
                                <input type="color" value={baseColor} onChange={(e) => setBaseColor(e.target.value)} className="w-16 h-10 rounded cursor-pointer" />
                                <input type="text" value={baseColor} onChange={(e) => setBaseColor(e.target.value)} className="flex-1 px-4 py-2 bg-slate-900 border border-fuchsia-700 rounded-lg text-white font-mono" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-fuchsia-300 mb-2">Harmony Mode</label>
                            <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)} className="w-full px-4 py-2 bg-slate-900 border border-fuchsia-700 rounded-lg text-white">
                                <option value="complementary">Complementary</option>
                                <option value="analogous">Analogous</option>
                                <option value="triadic">Triadic</option>
                                <option value="split">Split Complementary</option>
                                <option value="shades">Shades</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {palette.map((color, i) => (
                        <button key={i} onClick={() => copy(color)} className="group">
                            <div className="h-24 rounded-lg mb-2" style={{ backgroundColor: color }} />
                            <div className="text-white font-mono text-sm">{copied === color ? "✓ Copied" : color}</div>
                        </button>
                    ))}
                </div>
            </main>
        </div>
    );
}
