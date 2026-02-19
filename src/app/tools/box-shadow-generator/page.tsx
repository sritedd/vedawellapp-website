"use client";

import { useState } from "react";
import Link from "next/link";

export default function BoxShadowGenerator() {
    const [shadows, setShadows] = useState([
        { offsetX: 0, offsetY: 4, blur: 6, spread: -1, color: "rgba(0, 0, 0, 0.1)", inset: false },
        { offsetX: 0, offsetY: 2, blur: 4, spread: -2, color: "rgba(0, 0, 0, 0.1)", inset: false },
    ]);
    const [bgColor, setBgColor] = useState("#ffffff");
    const [boxColor, setBoxColor] = useState("#3b82f6");
    const [copied, setCopied] = useState(false);

    const updateShadow = (index: number, property: string, value: number | string | boolean) => {
        const updated = [...shadows];
        updated[index] = { ...updated[index], [property]: value };
        setShadows(updated);
    };

    const addShadow = () => {
        setShadows([...shadows, { offsetX: 0, offsetY: 8, blur: 10, spread: 0, color: "rgba(0, 0, 0, 0.15)", inset: false }]);
    };

    const removeShadow = (index: number) => {
        if (shadows.length <= 1) return;
        setShadows(shadows.filter((_, i) => i !== index));
    };

    const generateCSS = (): string => {
        const shadowString = shadows
            .map((s) => {
                const inset = s.inset ? "inset " : "";
                return `${inset}${s.offsetX}px ${s.offsetY}px ${s.blur}px ${s.spread}px ${s.color}`;
            })
            .join(",\n    ");
        return `box-shadow: ${shadowString};`;
    };

    const copyCSS = () => {
        navigator.clipboard.writeText(generateCSS());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const presets = [
        { name: "Subtle", shadows: [{ offsetX: 0, offsetY: 1, blur: 3, spread: 0, color: "rgba(0, 0, 0, 0.12)", inset: false }] },
        { name: "Medium", shadows: [{ offsetX: 0, offsetY: 4, blur: 6, spread: -1, color: "rgba(0, 0, 0, 0.1)", inset: false }, { offsetX: 0, offsetY: 2, blur: 4, spread: -2, color: "rgba(0, 0, 0, 0.1)", inset: false }] },
        { name: "Large", shadows: [{ offsetX: 0, offsetY: 10, blur: 15, spread: -3, color: "rgba(0, 0, 0, 0.1)", inset: false }, { offsetX: 0, offsetY: 4, blur: 6, spread: -4, color: "rgba(0, 0, 0, 0.1)", inset: false }] },
        { name: "XL", shadows: [{ offsetX: 0, offsetY: 20, blur: 25, spread: -5, color: "rgba(0, 0, 0, 0.1)", inset: false }, { offsetX: 0, offsetY: 8, blur: 10, spread: -6, color: "rgba(0, 0, 0, 0.1)", inset: false }] },
        { name: "Inset", shadows: [{ offsetX: 0, offsetY: 2, blur: 4, spread: 0, color: "rgba(0, 0, 0, 0.06)", inset: true }] },
        { name: "Glow", shadows: [{ offsetX: 0, offsetY: 0, blur: 20, spread: 0, color: "rgba(59, 130, 246, 0.5)", inset: false }] },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900">
            {/* Header */}
            <nav className="border-b border-indigo-800/50 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/tools" className="text-indigo-400 hover:text-white">
                            ← Back
                        </Link>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <span>🎨</span>
                            Box Shadow Generator
                        </h1>
                    </div>
                    <button
                        onClick={copyCSS}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
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
                            onClick={() => setShadows(preset.shadows)}
                            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700"
                        >
                            {preset.name}
                        </button>
                    ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Controls */}
                    <div className="space-y-4">
                        {shadows.map((shadow, index) => (
                            <div key={index} className="bg-slate-800/50 rounded-xl p-6 border border-indigo-800/30">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-white font-medium">Shadow {index + 1}</h3>
                                    <div className="flex items-center gap-2">
                                        <label className="flex items-center gap-2 text-sm text-slate-400">
                                            <input
                                                type="checkbox"
                                                checked={shadow.inset}
                                                onChange={(e) => updateShadow(index, "inset", e.target.checked)}
                                                className="rounded"
                                            />
                                            Inset
                                        </label>
                                        {shadows.length > 1 && (
                                            <button
                                                onClick={() => removeShadow(index)}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Offset X: {shadow.offsetX}px</label>
                                        <input
                                            type="range"
                                            value={shadow.offsetX}
                                            onChange={(e) => updateShadow(index, "offsetX", parseInt(e.target.value))}
                                            min="-50"
                                            max="50"
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Offset Y: {shadow.offsetY}px</label>
                                        <input
                                            type="range"
                                            value={shadow.offsetY}
                                            onChange={(e) => updateShadow(index, "offsetY", parseInt(e.target.value))}
                                            min="-50"
                                            max="50"
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Blur: {shadow.blur}px</label>
                                        <input
                                            type="range"
                                            value={shadow.blur}
                                            onChange={(e) => updateShadow(index, "blur", parseInt(e.target.value))}
                                            min="0"
                                            max="100"
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Spread: {shadow.spread}px</label>
                                        <input
                                            type="range"
                                            value={shadow.spread}
                                            onChange={(e) => updateShadow(index, "spread", parseInt(e.target.value))}
                                            min="-50"
                                            max="50"
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-xs text-slate-400 mb-1">Color</label>
                                    <input
                                        type="text"
                                        value={shadow.color}
                                        onChange={(e) => updateShadow(index, "color", e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-900 border border-indigo-700 rounded-lg text-white text-sm focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={addShadow}
                            className="w-full py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 border border-dashed border-slate-600"
                        >
                            + Add Shadow Layer
                        </button>
                    </div>

                    {/* Preview & Code */}
                    <div className="space-y-6">
                        {/* Preview */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-indigo-800/30">
                            <h2 className="text-lg font-medium text-white mb-4">Preview</h2>
                            <div className="flex gap-4 mb-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Background</label>
                                    <input
                                        type="color"
                                        value={bgColor}
                                        onChange={(e) => setBgColor(e.target.value)}
                                        className="w-16 h-8 rounded cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Box Color</label>
                                    <input
                                        type="color"
                                        value={boxColor}
                                        onChange={(e) => setBoxColor(e.target.value)}
                                        className="w-16 h-8 rounded cursor-pointer"
                                    />
                                </div>
                            </div>
                            <div
                                className="h-64 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: bgColor }}
                            >
                                <div
                                    className="w-40 h-40 rounded-xl"
                                    style={{
                                        backgroundColor: boxColor,
                                        boxShadow: shadows
                                            .map((s) => `${s.inset ? "inset " : ""}${s.offsetX}px ${s.offsetY}px ${s.blur}px ${s.spread}px ${s.color}`)
                                            .join(", "),
                                    }}
                                />
                            </div>
                        </div>

                        {/* Generated CSS */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-indigo-800/30">
                            <h2 className="text-lg font-medium text-white mb-4">Generated CSS</h2>
                            <pre className="bg-slate-900 p-4 rounded-lg text-sm font-mono text-green-400 overflow-x-auto whitespace-pre-wrap">
                                {generateCSS()}
                            </pre>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
