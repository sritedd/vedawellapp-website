"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { readAsDataURL, loadImage, validateImageFile, friendlyError } from "@/lib/tools/safety";

export default function MemeGenerator() {
    const [image, setImage] = useState<string | null>(null);
    const [topText, setTopText] = useState("TOP TEXT");
    const [bottomText, setBottomText] = useState("BOTTOM TEXT");
    const [fontSize, setFontSize] = useState(32);
    const [error, setError] = useState("");
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError("");
        try {
            validateImageFile(file);
            const dataUrl = await readAsDataURL(file);
            setImage(dataUrl);
        } catch (err) {
            setError(friendlyError(err, "Could not load that image."));
        }
        e.target.value = "";
    };

    const generateMeme = async () => {
        if (!image || !canvasRef.current) return;
        setError("");
        try {
            const img = await loadImage(image);
            const canvas = canvasRef.current;
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Canvas unavailable in this browser");
            ctx.drawImage(img, 0, 0);
            ctx.font = `bold ${fontSize}px Impact, sans-serif`;
            ctx.fillStyle = "white";
            ctx.strokeStyle = "black";
            ctx.lineWidth = 3;
            ctx.textAlign = "center";
            // Top text
            ctx.strokeText(topText.toUpperCase(), img.naturalWidth / 2, fontSize + 10);
            ctx.fillText(topText.toUpperCase(), img.naturalWidth / 2, fontSize + 10);
            // Bottom text
            ctx.strokeText(bottomText.toUpperCase(), img.naturalWidth / 2, img.naturalHeight - 20);
            ctx.fillText(bottomText.toUpperCase(), img.naturalWidth / 2, img.naturalHeight - 20);
        } catch (err) {
            setError(friendlyError(err, "Could not generate the meme."));
        }
    };

    const download = () => {
        if (!canvasRef.current) return;
        const a = document.createElement("a");
        a.href = canvasRef.current.toDataURL("image/png");
        a.download = `meme-${Date.now()}.png`;
        a.click();
    };

    return (
        <div className="min-h-screen text-white bg-gradient-to-br from-purple-900 via-slate-900 to-slate-900">
            <nav className="border-b border-purple-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-purple-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">😂 Meme Generator</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6 grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-800/30">
                        <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id="upload" />
                        <label htmlFor="upload" className="block p-6 border-2 border-dashed border-purple-700 rounded-lg text-center cursor-pointer hover:bg-slate-700/30 text-slate-400">📁 Upload Image</label>
                        {error && (
                            <p role="alert" className="mt-3 text-sm text-red-300 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2">{error}</p>
                        )}
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-800/30 space-y-4">
                        <div><label className="block text-sm text-purple-300 mb-1">Top Text</label><input type="text" value={topText} onChange={(e) => setTopText(e.target.value)} className="w-full px-4 py-2 bg-slate-900 border border-purple-700 rounded-lg text-white" /></div>
                        <div><label className="block text-sm text-purple-300 mb-1">Bottom Text</label><input type="text" value={bottomText} onChange={(e) => setBottomText(e.target.value)} className="w-full px-4 py-2 bg-slate-900 border border-purple-700 rounded-lg text-white" /></div>
                        <div><label className="block text-sm text-purple-300 mb-1">Font Size: {fontSize}px</label><input type="range" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} min="16" max="72" className="w-full" /></div>
                        <button onClick={generateMeme} disabled={!image} className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50">Generate Meme</button>
                    </div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-800/30">
                    <canvas ref={canvasRef} className="w-full rounded-lg mb-4" />
                    <button onClick={download} className="w-full py-2 bg-green-600 text-white rounded-lg">⬇️ Download</button>
                </div>
            </main>
        </div>
    );
}
