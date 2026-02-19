"use client";

import { useState, useRef } from "react";
import Link from "next/link";

export default function ImageCropper() {
    const [image, setImage] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0, width: 200, height: 200 });
    const [result, setResult] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<"free" | "1:1" | "16:9" | "4:3">("free");
    const imgRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => { setImage(ev.target?.result as string); setResult(null); };
        reader.readAsDataURL(file);
    };

    const handleCrop = () => {
        if (!image || !canvasRef.current || !imgRef.current) return;
        const canvas = canvasRef.current;
        const img = imgRef.current;
        const scaleX = img.naturalWidth / img.width;
        const scaleY = img.naturalHeight / img.height;
        canvas.width = crop.width * scaleX;
        canvas.height = crop.height * scaleY;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, crop.x * scaleX, crop.y * scaleY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
        setResult(canvas.toDataURL("image/png"));
    };

    const download = () => {
        if (!result) return;
        const a = document.createElement("a");
        a.href = result;
        a.download = `cropped-${Date.now()}.png`;
        a.click();
    };

    const presets = [
        { label: "Profile Pic", w: 150, h: 150 },
        { label: "Cover", w: 300, h: 100 },
        { label: "Thumbnail", w: 200, h: 112 },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-900 via-slate-900 to-slate-900">
            <nav className="border-b border-rose-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-rose-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">✂️ Image Cropper</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <canvas ref={canvasRef} className="hidden" />
                <div className="bg-slate-800/50 rounded-xl p-6 border border-rose-800/30 mb-6">
                    <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id="upload" />
                    <label htmlFor="upload" className="block p-8 border-2 border-dashed border-rose-700 rounded-lg text-center cursor-pointer hover:bg-slate-700/30">📁 Upload Image</label>
                </div>
                {image && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-rose-800/30">
                            <div className="relative inline-block">
                                <img ref={imgRef} src={image} alt="Source" className="max-w-full rounded" crossOrigin="anonymous" />
                                <div className="absolute border-2 border-white shadow-lg" style={{ left: crop.x, top: crop.y, width: crop.width, height: crop.height, cursor: "move" }} />
                            </div>
                            <div className="grid grid-cols-4 gap-2 mt-4">
                                <div><label className="block text-xs text-rose-300">X</label><input type="number" value={crop.x} onChange={(e) => setCrop({ ...crop, x: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1 bg-slate-900 border border-rose-700 rounded text-white text-sm" /></div>
                                <div><label className="block text-xs text-rose-300">Y</label><input type="number" value={crop.y} onChange={(e) => setCrop({ ...crop, y: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1 bg-slate-900 border border-rose-700 rounded text-white text-sm" /></div>
                                <div><label className="block text-xs text-rose-300">Width</label><input type="number" value={crop.width} onChange={(e) => setCrop({ ...crop, width: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1 bg-slate-900 border border-rose-700 rounded text-white text-sm" /></div>
                                <div><label className="block text-xs text-rose-300">Height</label><input type="number" value={crop.height} onChange={(e) => setCrop({ ...crop, height: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1 bg-slate-900 border border-rose-700 rounded text-white text-sm" /></div>
                            </div>
                            <div className="flex gap-2 mt-4 flex-wrap">
                                {presets.map(p => (
                                    <button key={p.label} onClick={() => setCrop({ ...crop, width: p.w, height: p.h })} className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-sm">{p.label}</button>
                                ))}
                            </div>
                            <button onClick={handleCrop} className="w-full mt-4 py-3 bg-rose-600 text-white rounded-lg font-medium">Crop Image</button>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-rose-800/30">
                            <div className="text-sm text-rose-300 mb-2">Cropped Result</div>
                            {result ? (
                                <>
                                    <img src={result} alt="Cropped" className="max-w-full rounded-lg mb-4" />
                                    <button onClick={download} className="w-full py-2 bg-green-600 text-white rounded-lg">⬇️ Download</button>
                                </>
                            ) : (
                                <div className="text-slate-500 text-center py-12">Click Crop to preview</div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
