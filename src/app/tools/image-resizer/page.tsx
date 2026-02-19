"use client";

import { useState, useRef } from "react";
import Link from "next/link";

export default function ImageResizer() {
    const [image, setImage] = useState<string | null>(null);
    const [originalWidth, setOriginalWidth] = useState(0);
    const [originalHeight, setOriginalHeight] = useState(0);
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [maintainAspect, setMaintainAspect] = useState(true);
    const [result, setResult] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                setOriginalWidth(img.width);
                setOriginalHeight(img.height);
                setWidth(img.width);
                setHeight(img.height);
                setImage(ev.target?.result as string);
                setResult(null);
            };
            img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const updateWidth = (newWidth: number) => {
        setWidth(newWidth);
        if (maintainAspect && originalWidth > 0) {
            setHeight(Math.round((newWidth / originalWidth) * originalHeight));
        }
    };

    const updateHeight = (newHeight: number) => {
        setHeight(newHeight);
        if (maintainAspect && originalHeight > 0) {
            setWidth(Math.round((newHeight / originalHeight) * originalWidth));
        }
    };

    const resize = () => {
        if (!image || !canvasRef.current) return;
        const canvas = canvasRef.current;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, width, height);
            setResult(canvas.toDataURL("image/png"));
        };
        img.src = image;
    };

    const download = () => {
        if (!result) return;
        const a = document.createElement("a");
        a.href = result;
        a.download = `resized-${width}x${height}.png`;
        a.click();
    };

    const presets = [
        { name: "50%", w: Math.round(originalWidth * 0.5), h: Math.round(originalHeight * 0.5) },
        { name: "25%", w: Math.round(originalWidth * 0.25), h: Math.round(originalHeight * 0.25) },
        { name: "1920×1080", w: 1920, h: 1080 },
        { name: "1280×720", w: 1280, h: 720 },
        { name: "800×600", w: 800, h: 600 },
        { name: "640×480", w: 640, h: 480 },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-900 via-slate-900 to-slate-900">
            <nav className="border-b border-cyan-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-cyan-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">📐 Image Resizer</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <canvas ref={canvasRef} className="hidden" />
                <div className="bg-slate-800/50 rounded-xl p-6 border border-cyan-800/30 mb-6">
                    <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id="upload" />
                    <label htmlFor="upload" className="block p-8 border-2 border-dashed border-cyan-700 rounded-lg text-center cursor-pointer hover:bg-slate-700/30">
                        {image ? <img src={image} alt="Original" className="max-h-32 mx-auto" /> : "📁 Upload Image"}
                    </label>
                </div>
                {image && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
                                <span className="text-slate-400 text-sm">Original: </span>
                                <span className="text-white">{originalWidth} × {originalHeight}</span>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-6 border border-cyan-800/30 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-cyan-300 mb-1">Width (px)</label>
                                        <input type="number" value={width} onChange={(e) => updateWidth(parseInt(e.target.value) || 0)} className="w-full px-4 py-2 bg-slate-900 border border-cyan-700 rounded text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-cyan-300 mb-1">Height (px)</label>
                                        <input type="number" value={height} onChange={(e) => updateHeight(parseInt(e.target.value) || 0)} className="w-full px-4 py-2 bg-slate-900 border border-cyan-700 rounded text-white" />
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 text-sm text-slate-300">
                                    <input type="checkbox" checked={maintainAspect} onChange={(e) => setMaintainAspect(e.target.checked)} />
                                    Maintain aspect ratio
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {presets.map(p => (
                                        <button key={p.name} onClick={() => { setWidth(p.w); setHeight(p.h); }} className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-sm hover:bg-slate-600">{p.name}</button>
                                    ))}
                                </div>
                                <button onClick={resize} className="w-full py-3 bg-cyan-600 text-white rounded-lg font-medium">Resize</button>
                            </div>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-cyan-800/30">
                            <div className="text-sm text-cyan-300 mb-2">Preview ({width} × {height})</div>
                            {result ? (
                                <>
                                    <img src={result} alt="Resized" className="max-w-full rounded-lg mb-4" />
                                    <button onClick={download} className="w-full py-2 bg-green-600 text-white rounded-lg">⬇️ Download</button>
                                </>
                            ) : (
                                <div className="text-slate-500 text-center py-12">Click Resize to preview</div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
