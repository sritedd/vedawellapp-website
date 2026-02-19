"use client";

import { useState, useRef } from "react";
import Link from "next/link";

type ImageFormat = "png" | "jpeg" | "webp";

export default function ImageFormatConverter() {
    const [image, setImage] = useState<string | null>(null);
    const [fileName, setFileName] = useState("");
    const [format, setFormat] = useState<ImageFormat>("png");
    const [quality, setQuality] = useState(90);
    const [converted, setConverted] = useState<string | null>(null);
    const [originalSize, setOriginalSize] = useState(0);
    const [convertedSize, setConvertedSize] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name.split(".")[0]);
        setOriginalSize(file.size);
        const reader = new FileReader();
        reader.onload = (ev) => { setImage(ev.target?.result as string); setConverted(null); };
        reader.readAsDataURL(file);
    };

    const convert = () => {
        if (!image || !canvasRef.current) return;
        const img = new Image();
        img.onload = () => {
            const canvas = canvasRef.current!;
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d")!;
            if (format === "jpeg") {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(img, 0, 0);
            const mimeType = `image/${format}`;
            const dataUrl = canvas.toDataURL(mimeType, quality / 100);
            setConverted(dataUrl);
            setConvertedSize(Math.round((dataUrl.length - `data:${mimeType};base64,`.length) * 0.75));
        };
        img.src = image;
    };

    const download = () => {
        if (!converted) return;
        const a = document.createElement("a");
        a.href = converted;
        a.download = `${fileName}.${format}`;
        a.click();
    };

    const formatSize = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    const savings = originalSize > 0 && convertedSize > 0 ? Math.round((1 - convertedSize / originalSize) * 100) : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-slate-900">
            <nav className="border-b border-blue-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-blue-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">🔄 Image Format Converter</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <canvas ref={canvasRef} className="hidden" />
                <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-800/30 mb-6">
                    <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id="upload" />
                    <label htmlFor="upload" className="block p-8 border-2 border-dashed border-blue-700 rounded-lg text-center cursor-pointer hover:bg-slate-700/30">
                        <div className="text-4xl mb-2">📁</div>
                        <div className="text-white">Upload PNG, JPG, WEBP, GIF, BMP...</div>
                    </label>
                </div>
                {image && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-blue-800/30">
                                <div className="text-sm text-blue-300 mb-2">Original ({formatSize(originalSize)})</div>
                                <img src={image} alt="Original" className="w-full rounded-lg" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-800/30">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-blue-300 mb-2">Convert to</label>
                                        <div className="flex gap-2">
                                            {(["png", "jpeg", "webp"] as ImageFormat[]).map(f => (
                                                <button key={f} onClick={() => setFormat(f)} className={`flex-1 py-2 rounded-lg font-medium uppercase ${format === f ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300"}`}>{f}</button>
                                            ))}
                                        </div>
                                    </div>
                                    {format !== "png" && (
                                        <div>
                                            <label className="block text-sm text-blue-300 mb-2">Quality: {quality}%</label>
                                            <input type="range" value={quality} onChange={(e) => setQuality(parseInt(e.target.value))} min="10" max="100" className="w-full" />
                                        </div>
                                    )}
                                    <button onClick={convert} className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Convert</button>
                                </div>
                            </div>
                            {converted && (
                                <div className="bg-slate-800/50 rounded-xl p-4 border border-green-800/30">
                                    <div className="text-sm text-green-400 mb-2">
                                        Converted ({formatSize(convertedSize)})
                                        {savings > 0 && <span className="ml-2 text-green-300">↓{savings}%</span>}
                                        {savings < 0 && <span className="ml-2 text-red-300">↑{Math.abs(savings)}%</span>}
                                    </div>
                                    <img src={converted} alt="Converted" className="w-full rounded-lg mb-4" />
                                    <button onClick={download} className="w-full py-2 bg-green-600 text-white rounded-lg">⬇️ Download {format.toUpperCase()}</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
