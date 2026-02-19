"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ColorConverter() {
    const [hex, setHex] = useState("#3b82f6");
    const [rgb, setRgb] = useState({ r: 59, g: 130, b: 246 });
    const [hsl, setHsl] = useState({ h: 217, s: 91, l: 60 });
    const [copied, setCopied] = useState("");

    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16),
            }
            : null;
    };

    const rgbToHex = (r: number, g: number, b: number) => {
        return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
    };

    const rgbToHsl = (r: number, g: number, b: number) => {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0;
        let s = 0;
        const l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                    break;
                case g:
                    h = ((b - r) / d + 2) / 6;
                    break;
                case b:
                    h = ((r - g) / d + 4) / 6;
                    break;
            }
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100),
        };
    };

    const hslToRgb = (h: number, s: number, l: number) => {
        h /= 360;
        s /= 100;
        l /= 100;

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p: number, q: number, t: number) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255),
        };
    };

    const updateFromHex = (newHex: string) => {
        setHex(newHex);
        const newRgb = hexToRgb(newHex);
        if (newRgb) {
            setRgb(newRgb);
            setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
        }
    };

    const updateFromRgb = (newRgb: { r: number; g: number; b: number }) => {
        setRgb(newRgb);
        setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
        setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
    };

    const updateFromHsl = (newHsl: { h: number; s: number; l: number }) => {
        setHsl(newHsl);
        const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
        setRgb(newRgb);
        setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    };

    const copyValue = async (value: string, type: string) => {
        await navigator.clipboard.writeText(value);
        setCopied(type);
        setTimeout(() => setCopied(""), 1500);
    };

    const colorFormats = [
        { type: "hex", label: "HEX", value: hex.toUpperCase() },
        { type: "rgb", label: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
        { type: "hsl", label: "HSL", value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
        { type: "rgba", label: "RGBA", value: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)` },
    ];

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

            <main className="py-12 px-6">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-2 text-center">🎨 Color Converter</h1>
                    <p className="text-white/60 text-center mb-8">
                        Convert colors between HEX, RGB, and HSL formats
                    </p>

                    {/* Color Preview */}
                    <div
                        className="w-full h-32 rounded-2xl mb-8 shadow-2xl"
                        style={{ backgroundColor: hex }}
                    />

                    {/* Color Picker */}
                    <div className="flex justify-center mb-8">
                        <input
                            type="color"
                            value={hex}
                            onChange={(e) => updateFromHex(e.target.value)}
                            className="w-20 h-20 rounded-xl cursor-pointer"
                        />
                    </div>

                    {/* Format Outputs */}
                    <div className="grid gap-4 mb-8">
                        {colorFormats.map((format) => (
                            <div
                                key={format.type}
                                className="flex items-center gap-4 p-4 bg-white/10 rounded-xl"
                            >
                                <span className="w-16 text-white/50 text-sm">{format.label}</span>
                                <code className="flex-1 font-mono text-white">{format.value}</code>
                                <button
                                    onClick={() => copyValue(format.value, format.type)}
                                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${copied === format.type
                                            ? "bg-green-500 text-white"
                                            : "bg-white/20 text-white hover:bg-white/30"
                                        }`}
                                >
                                    {copied === format.type ? "Copied!" : "Copy"}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Sliders */}
                    <div className="space-y-6 bg-white/10 rounded-2xl p-6">
                        <h3 className="text-white font-medium mb-4">Adjust Values</h3>

                        {/* RGB Sliders */}
                        <div className="space-y-4">
                            <div>
                                <label className="flex justify-between text-white/70 text-sm mb-2">
                                    <span>Red</span>
                                    <span>{rgb.r}</span>
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="255"
                                    value={rgb.r}
                                    onChange={(e) => updateFromRgb({ ...rgb, r: parseInt(e.target.value) })}
                                    className="w-full accent-red-500"
                                />
                            </div>
                            <div>
                                <label className="flex justify-between text-white/70 text-sm mb-2">
                                    <span>Green</span>
                                    <span>{rgb.g}</span>
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="255"
                                    value={rgb.g}
                                    onChange={(e) => updateFromRgb({ ...rgb, g: parseInt(e.target.value) })}
                                    className="w-full accent-green-500"
                                />
                            </div>
                            <div>
                                <label className="flex justify-between text-white/70 text-sm mb-2">
                                    <span>Blue</span>
                                    <span>{rgb.b}</span>
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="255"
                                    value={rgb.b}
                                    onChange={(e) => updateFromRgb({ ...rgb, b: parseInt(e.target.value) })}
                                    className="w-full accent-blue-500"
                                />
                            </div>
                        </div>

                        <hr className="border-white/10" />

                        {/* HSL Sliders */}
                        <div className="space-y-4">
                            <div>
                                <label className="flex justify-between text-white/70 text-sm mb-2">
                                    <span>Hue</span>
                                    <span>{hsl.h}°</span>
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="360"
                                    value={hsl.h}
                                    onChange={(e) => updateFromHsl({ ...hsl, h: parseInt(e.target.value) })}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="flex justify-between text-white/70 text-sm mb-2">
                                    <span>Saturation</span>
                                    <span>{hsl.s}%</span>
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={hsl.s}
                                    onChange={(e) => updateFromHsl({ ...hsl, s: parseInt(e.target.value) })}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="flex justify-between text-white/70 text-sm mb-2">
                                    <span>Lightness</span>
                                    <span>{hsl.l}%</span>
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={hsl.l}
                                    onChange={(e) => updateFromHsl({ ...hsl, l: parseInt(e.target.value) })}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
