"use client";

import { useState, useRef } from "react";
import Link from "next/link";

export default function ImageWatermarker() {
    const [image, setImage] = useState<string | null>(null);
    const [watermarked, setWatermarked] = useState<string | null>(null);
    const [text, setText] = useState("© My Watermark");
    const [fontSize, setFontSize] = useState(24);
    const [opacity, setOpacity] = useState(50);
    const [position, setPosition] = useState<"center" | "bottom-right" | "bottom-left" | "tiled">("bottom-right");
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => { setImage(ev.target?.result as string); setWatermarked(null); };
        reader.readAsDataURL(file);
    };

    const applyWatermark = () => {
        if (!image || !canvasRef.current) return;
        const img = new Image();
        img.onload = () => {
            const canvas = canvasRef.current!;
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(img, 0, 0);
            ctx.font = `${fontSize}px Arial`;
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity / 100})`;
            ctx.strokeStyle = `rgba(0, 0, 0, ${opacity / 100 * 0.5})`;
            ctx.lineWidth = 2;

            if (position === "tiled") {
                const metrics = ctx.measureText(text);
                const textWidth = metrics.width;
                const textHeight = fontSize;
                ctx.rotate(-Math.PI / 6);
                for (let y = -img.height; y < img.height * 2; y += textHeight * 3) {
                    for (let x = -img.width; x < img.width * 2; x += textWidth + 100) {
                        ctx.strokeText(text, x, y);
                        ctx.fillText(text, x, y);
                    }
                }
            } else {
                let x = 0, y = 0;
                const metrics = ctx.measureText(text);
                if (position === "center") { x = (img.width - metrics.width) / 2; y = img.height / 2; }
                else if (position === "bottom-right") { x = img.width - metrics.width - 20; y = img.height - 20; }
                else if (position === "bottom-left") { x = 20; y = img.height - 20; }
                ctx.strokeText(text, x, y);
                ctx.fillText(text, x, y);
            }
            setWatermarked(canvas.toDataURL("image/png"));
        };
        img.src = image;
    };

    const download = () => {
        if (!watermarked) return;
        const a = document.createElement("a");
        a.href = watermarked;
        a.download = `watermarked-${Date.now()}.png`;
        a.click();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-900 via-slate-900 to-slate-900">
            <nav className="border-b border-teal-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-teal-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">💧 Image Watermarker</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <canvas ref={canvasRef} className="hidden" />
                <div className="bg-slate-800/50 rounded-xl p-6 border border-teal-800/30 mb-6">
                    <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id="upload" />
                    <label htmlFor="upload" className="block p-8 border-2 border-dashed border-teal-700 rounded-lg text-center cursor-pointer hover:bg-slate-700/30">
                        {image ? "Click to upload a different image" : "📁 Click to upload an image"}
                    </label>
                </div>
                {image && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-teal-800/30">
                            <div className="space-y-4">
                                <div><label className="block text-sm text-teal-300 mb-1">Watermark Text</label><input type="text" value={text} onChange={(e) => setText(e.target.value)} className="w-full px-4 py-2 bg-slate-900 border border-teal-700 rounded text-white" /></div>
                                <div><label className="block text-sm text-teal-300 mb-1">Font Size: {fontSize}px</label><input type="range" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} min="12" max="72" className="w-full" /></div>
                                <div><label className="block text-sm text-teal-300 mb-1">Opacity: {opacity}%</label><input type="range" value={opacity} onChange={(e) => setOpacity(parseInt(e.target.value))} min="10" max="100" className="w-full" /></div>
                                <div><label className="block text-sm text-teal-300 mb-1">Position</label><select value={position} onChange={(e) => setPosition(e.target.value as typeof position)} className="w-full px-4 py-2 bg-slate-900 border border-teal-700 rounded text-white"><option value="bottom-right">Bottom Right</option><option value="bottom-left">Bottom Left</option><option value="center">Center</option><option value="tiled">Tiled</option></select></div>
                                <button onClick={applyWatermark} className="w-full py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700">Apply Watermark</button>
                            </div>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-teal-800/30">
                            <div className="text-sm text-slate-400 mb-2">{watermarked ? "Watermarked" : "Preview"}</div>
                            <img src={watermarked || image} alt="Preview" className="w-full rounded-lg" />
                            {watermarked && <button onClick={download} className="w-full mt-4 py-2 bg-green-600 text-white rounded-lg">⬇️ Download</button>}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
