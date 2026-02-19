"use client";

import { useState } from "react";
import Link from "next/link";

export default function CSSGridGenerator() {
    const [columns, setColumns] = useState(3);
    const [rows, setRows] = useState(3);
    const [columnGap, setColumnGap] = useState(16);
    const [rowGap, setRowGap] = useState(16);
    const [columnSizes, setColumnSizes] = useState<string[]>(["1fr", "1fr", "1fr"]);
    const [rowSizes, setRowSizes] = useState<string[]>(["auto", "auto", "auto"]);
    const [copied, setCopied] = useState(false);

    const updateColumns = (count: number) => {
        setColumns(count);
        setColumnSizes(Array(count).fill("1fr"));
    };

    const updateRows = (count: number) => {
        setRows(count);
        setRowSizes(Array(count).fill("auto"));
    };

    const updateColumnSize = (index: number, value: string) => {
        const newSizes = [...columnSizes];
        newSizes[index] = value;
        setColumnSizes(newSizes);
    };

    const updateRowSize = (index: number, value: string) => {
        const newSizes = [...rowSizes];
        newSizes[index] = value;
        setRowSizes(newSizes);
    };

    const generateCSS = (): string => {
        const colTemplate = columnSizes.join(" ");
        const rowTemplate = rowSizes.join(" ");

        return `.container {
  display: grid;
  grid-template-columns: ${colTemplate};
  grid-template-rows: ${rowTemplate};
  column-gap: ${columnGap}px;
  row-gap: ${rowGap}px;
}`;
    };

    const copyCSS = () => {
        navigator.clipboard.writeText(generateCSS());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const presetSizes = ["1fr", "2fr", "auto", "100px", "150px", "200px", "minmax(100px, 1fr)"];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-slate-900">
            {/* Header */}
            <nav className="border-b border-blue-800/50 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/tools" className="text-blue-400 hover:text-white">
                            ← Back
                        </Link>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <span>🔲</span>
                            CSS Grid Generator
                        </h1>
                    </div>
                    <button
                        onClick={copyCSS}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                        {copied ? "✓ Copied!" : "Copy CSS"}
                    </button>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto p-6">
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Controls */}
                    <div className="space-y-6">
                        {/* Grid Size */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-800/30">
                            <h2 className="text-lg font-medium text-white mb-4">Grid Size</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-blue-300 mb-2">Columns</label>
                                    <input
                                        type="number"
                                        value={columns}
                                        onChange={(e) => updateColumns(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
                                        min="1"
                                        max="12"
                                        className="w-full px-4 py-2 bg-slate-900 border border-blue-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-blue-300 mb-2">Rows</label>
                                    <input
                                        type="number"
                                        value={rows}
                                        onChange={(e) => updateRows(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
                                        min="1"
                                        max="12"
                                        className="w-full px-4 py-2 bg-slate-900 border border-blue-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Gaps */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-800/30">
                            <h2 className="text-lg font-medium text-white mb-4">Gaps</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-blue-300 mb-2">Column Gap: {columnGap}px</label>
                                    <input
                                        type="range"
                                        value={columnGap}
                                        onChange={(e) => setColumnGap(parseInt(e.target.value))}
                                        min="0"
                                        max="50"
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-blue-300 mb-2">Row Gap: {rowGap}px</label>
                                    <input
                                        type="range"
                                        value={rowGap}
                                        onChange={(e) => setRowGap(parseInt(e.target.value))}
                                        min="0"
                                        max="50"
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Column Sizes */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-800/30">
                            <h2 className="text-lg font-medium text-white mb-4">Column Sizes</h2>
                            <div className="space-y-2">
                                {columnSizes.map((size, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="text-blue-400 text-sm w-16">Col {i + 1}</span>
                                        <select
                                            value={size}
                                            onChange={(e) => updateColumnSize(i, e.target.value)}
                                            className="flex-1 px-3 py-2 bg-slate-900 border border-blue-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                                        >
                                            {presetSizes.map((s) => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Row Sizes */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-800/30">
                            <h2 className="text-lg font-medium text-white mb-4">Row Sizes</h2>
                            <div className="space-y-2">
                                {rowSizes.map((size, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="text-blue-400 text-sm w-16">Row {i + 1}</span>
                                        <select
                                            value={size}
                                            onChange={(e) => updateRowSize(i, e.target.value)}
                                            className="flex-1 px-3 py-2 bg-slate-900 border border-blue-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                                        >
                                            {presetSizes.map((s) => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Preview & Code */}
                    <div className="space-y-6">
                        {/* Preview */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-800/30">
                            <h2 className="text-lg font-medium text-white mb-4">Preview</h2>
                            <div
                                className="bg-slate-900 p-4 rounded-lg min-h-[300px]"
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: columnSizes.join(" "),
                                    gridTemplateRows: rowSizes.join(" "),
                                    columnGap: `${columnGap}px`,
                                    rowGap: `${rowGap}px`,
                                }}
                            >
                                {Array.from({ length: columns * rows }, (_, i) => (
                                    <div
                                        key={i}
                                        className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white font-medium min-h-[60px]"
                                    >
                                        {i + 1}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Generated CSS */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-800/30">
                            <h2 className="text-lg font-medium text-white mb-4">Generated CSS</h2>
                            <pre className="bg-slate-900 p-4 rounded-lg text-sm font-mono text-green-400 overflow-x-auto">
                                {generateCSS()}
                            </pre>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
