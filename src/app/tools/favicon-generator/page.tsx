"use client";

import { useState, useRef } from "react";
import Link from "next/link";

export default function FaviconGenerator() {
    const [image, setImage] = useState<string | null>(null);
    const [bgColor, setBgColor] = useState("#ffffff");
    const [padding, setPadding] = useState(10);
    const [shape, setShape] = useState<"square" | "rounded" | "circle">("square");
    const [sizes, setSizes] = useState([16, 32, 48, 64, 128, 256]);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setImage(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const generateFavicon = (size: number): string => {
        if (!image || !canvasRef.current) return "";
        const canvas = canvasRef.current;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;

        // Draw background
        ctx.fillStyle = bgColor;
        if (shape === "circle") {
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (shape === "rounded") {
            const r = size * 0.2;
            ctx.beginPath();
            ctx.roundRect(0, 0, size, size, r);
            ctx.fill();
        } else {
            ctx.fillRect(0, 0, size, size);
        }

        // Draw image
        const img = new Image();
        img.src = image;
        const p = (padding / 100) * size;
        ctx.drawImage(img, p, p, size - p * 2, size - p * 2);
        return canvas.toDataURL("image/png");
    };

    const downloadAll = () => {
        sizes.forEach(size => {
            const dataUrl = generateFavicon(size);
            if (dataUrl) {
                const a = document.createElement("a");
                a.href = dataUrl;
                a.download = `favicon-${size}x${size}.png`;
                a.click();
            }
        });
    };

    const downloadICO = () => {
        const dataUrl = generateFavicon(32);
        if (dataUrl) {
            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = "favicon.ico";
            a.click();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-900 via-slate-900 to-slate-900">
            <nav className="border-b border-amber-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-amber-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">⭐ Favicon Generator</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <canvas ref={canvasRef} className="hidden" />
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-amber-800/30">
                            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id="upload" />
                            <label htmlFor="upload" className="block p-6 border-2 border-dashed border-amber-700 rounded-lg text-center cursor-pointer hover:bg-slate-700/30">
                                {image ? <img src={image} alt="Source" className="max-h-24 mx-auto" /> : "📁 Upload Logo/Icon"}
                            </label>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-amber-800/30 space-y-4">
                            <div>
                                <label className="block text-sm text-amber-300 mb-2">Background Color</label>
                                <div className="flex gap-2">
                                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-12 h-10 rounded cursor-pointer" />
                                    <input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="flex-1 px-4 py-2 bg-slate-900 border border-amber-700 rounded text-white font-mono" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-amber-300 mb-2">Padding: {padding}%</label>
                                <input type="range" value={padding} onChange={(e) => setPadding(parseInt(e.target.value))} min="0" max="40" className="w-full" />
                            </div>
                            <div>
                                <label className="block text-sm text-amber-300 mb-2">Shape</label>
                                <div className="flex gap-2">
                                    {(["square", "rounded", "circle"] as const).map(s => (
                                        <button key={s} onClick={() => setShape(s)} className={`flex-1 py-2 rounded capitalize ${shape === s ? "bg-amber-600 text-white" : "bg-slate-700 text-slate-300"}`}>{s}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-amber-800/30">
                        <h3 className="text-white font-medium mb-4">Preview</h3>
                        {image && (
                            <>
                                <div className="flex gap-4 items-end justify-center mb-6 flex-wrap">
                                    {[16, 32, 64, 128].map(size => (
                                        <div key={size} className="text-center">
                                            <div className="mb-1 inline-block" style={{ width: size, height: size }}>
                                                <img src={generateFavicon(size)} alt={`${size}px`} style={{ width: size, height: size }} />
                                            </div>
                                            <div className="text-xs text-slate-400">{size}px</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-slate-900 p-4 rounded-lg mb-4">
                                    <div className="text-xs text-slate-400 mb-2">Browser Tab Preview</div>
                                    <div className="flex items-center gap-2 bg-slate-800 rounded px-3 py-2">
                                        <img src={generateFavicon(16)} alt="tab" className="w-4 h-4" />
                                        <span className="text-white text-sm">Your Website</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <button onClick={downloadAll} className="w-full py-2 bg-amber-600 text-white rounded-lg">⬇️ Download All Sizes (PNG)</button>
                                    <button onClick={downloadICO} className="w-full py-2 bg-slate-700 text-white rounded-lg">⬇️ Download favicon.ico</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
