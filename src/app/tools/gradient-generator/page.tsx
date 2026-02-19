"use client";

import { useState } from "react";
import Link from "next/link";

interface GradientStop {
    color: string;
    position: number;
}

export default function GradientGenerator() {
    const [type, setType] = useState<"linear" | "radial" | "conic">("linear");
    const [angle, setAngle] = useState(135);
    const [stops, setStops] = useState<GradientStop[]>([
        { color: "#667eea", position: 0 },
        { color: "#764ba2", position: 100 },
    ]);
    const [copied, setCopied] = useState(false);

    const updateStop = (index: number, property: "color" | "position", value: string | number) => {
        const updated = [...stops];
        updated[index] = { ...updated[index], [property]: value };
        setStops(updated);
    };

    const addStop = () => {
        const newPosition = stops.length > 0 ? Math.min(stops[stops.length - 1].position + 20, 100) : 50;
        setStops([...stops, { color: "#f093fb", position: newPosition }]);
    };

    const removeStop = (index: number) => {
        if (stops.length <= 2) return;
        setStops(stops.filter((_, i) => i !== index));
    };

    const generateGradientValue = (): string => {
        const sortedStops = [...stops].sort((a, b) => a.position - b.position);
        const stopsString = sortedStops.map((s) => `${s.color} ${s.position}%`).join(", ");

        switch (type) {
            case "radial":
                return `radial-gradient(circle, ${stopsString})`;
            case "conic":
                return `conic-gradient(from ${angle}deg, ${stopsString})`;
            default:
                return `linear-gradient(${angle}deg, ${stopsString})`;
        }
    };

    const generateCSS = (): string => {
        return `background: ${generateGradientValue()};`;
    };

    const copyCSS = () => {
        navigator.clipboard.writeText(generateCSS());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const presets = [
        { name: "Sunset", stops: [{ color: "#ff512f", position: 0 }, { color: "#dd2476", position: 100 }], angle: 135 },
        { name: "Ocean", stops: [{ color: "#2193b0", position: 0 }, { color: "#6dd5ed", position: 100 }], angle: 135 },
        { name: "Forest", stops: [{ color: "#134e5e", position: 0 }, { color: "#71b280", position: 100 }], angle: 135 },
        { name: "Candy", stops: [{ color: "#d53369", position: 0 }, { color: "#daae51", position: 100 }], angle: 135 },
        { name: "Midnight", stops: [{ color: "#232526", position: 0 }, { color: "#414345", position: 100 }], angle: 180 },
        { name: "Rainbow", stops: [{ color: "#f79533", position: 0 }, { color: "#f37055", position: 20 }, { color: "#ef4e7b", position: 40 }, { color: "#a166ab", position: 60 }, { color: "#5073b8", position: 80 }, { color: "#1098ad", position: 100 }], angle: 90 },
    ];

    const applyPreset = (preset: typeof presets[0]) => {
        setStops(preset.stops);
        setAngle(preset.angle);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-fuchsia-900 via-slate-900 to-slate-900">
            {/* Header */}
            <nav className="border-b border-fuchsia-800/50 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/tools" className="text-fuchsia-400 hover:text-white">
                            ← Back
                        </Link>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <span>🌈</span>
                            Gradient Generator
                        </h1>
                    </div>
                    <button
                        onClick={copyCSS}
                        className="px-4 py-2 bg-fuchsia-600 text-white rounded-lg text-sm font-medium hover:bg-fuchsia-700"
                    >
                        {copied ? "✓ Copied!" : "Copy CSS"}
                    </button>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto p-6">
                {/* Presets */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {presets.map((preset) => (
                        <button
                            key={preset.name}
                            onClick={() => applyPreset(preset)}
                            className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-transform hover:scale-105"
                            style={{ background: `linear-gradient(135deg, ${preset.stops.map(s => s.color).join(", ")})` }}
                        >
                            {preset.name}
                        </button>
                    ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Controls */}
                    <div className="space-y-6">
                        {/* Type & Angle */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-fuchsia-800/30">
                            <h2 className="text-lg font-medium text-white mb-4">Gradient Type</h2>
                            <div className="flex gap-2 mb-4">
                                {(["linear", "radial", "conic"] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setType(t)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize ${type === t
                                                ? "bg-fuchsia-600 text-white"
                                                : "bg-slate-700 text-slate-300"
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                            {type !== "radial" && (
                                <div>
                                    <label className="block text-sm text-fuchsia-300 mb-2">
                                        Angle: {angle}°
                                    </label>
                                    <input
                                        type="range"
                                        value={angle}
                                        onChange={(e) => setAngle(parseInt(e.target.value))}
                                        min="0"
                                        max="360"
                                        className="w-full"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Color Stops */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-fuchsia-800/30">
                            <h2 className="text-lg font-medium text-white mb-4">Color Stops</h2>
                            <div className="space-y-3">
                                {stops.map((stop, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={stop.color}
                                            onChange={(e) => updateStop(i, "color", e.target.value)}
                                            className="w-14 h-10 rounded cursor-pointer border-0"
                                        />
                                        <input
                                            type="text"
                                            value={stop.color}
                                            onChange={(e) => updateStop(i, "color", e.target.value)}
                                            className="flex-1 px-3 py-2 bg-slate-900 border border-fuchsia-700 rounded-lg text-white text-sm focus:border-fuchsia-500 focus:outline-none font-mono"
                                        />
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={stop.position}
                                                onChange={(e) => updateStop(i, "position", parseInt(e.target.value) || 0)}
                                                min="0"
                                                max="100"
                                                className="w-16 px-2 py-2 bg-slate-900 border border-fuchsia-700 rounded-lg text-white text-sm focus:border-fuchsia-500 focus:outline-none text-center"
                                            />
                                            <span className="text-slate-400 text-sm">%</span>
                                        </div>
                                        {stops.length > 2 && (
                                            <button
                                                onClick={() => removeStop(i)}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={addStop}
                                className="w-full mt-4 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600"
                            >
                                + Add Color Stop
                            </button>
                        </div>
                    </div>

                    {/* Preview & Code */}
                    <div className="space-y-6">
                        {/* Preview */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-fuchsia-800/30">
                            <h2 className="text-lg font-medium text-white mb-4">Preview</h2>
                            <div
                                className="h-64 rounded-xl"
                                style={{ background: generateGradientValue() }}
                            />
                        </div>

                        {/* Generated CSS */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-fuchsia-800/30">
                            <h2 className="text-lg font-medium text-white mb-4">Generated CSS</h2>
                            <pre className="bg-slate-900 p-4 rounded-lg text-sm font-mono text-green-400 overflow-x-auto whitespace-pre-wrap">
                                {generateCSS()}
                            </pre>
                        </div>

                        {/* Color Bar */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-fuchsia-800/30">
                            <h2 className="text-lg font-medium text-white mb-4">Color Bar</h2>
                            <div
                                className="h-8 rounded-lg"
                                style={{ background: `linear-gradient(90deg, ${stops.sort((a, b) => a.position - b.position).map(s => `${s.color} ${s.position}%`).join(", ")})` }}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
