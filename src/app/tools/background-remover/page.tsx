"use client";

import { useState, useRef } from "react";
import Link from "next/link";

export default function ImageBackgroundRemover() {
    const [image, setImage] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [threshold, setThreshold] = useState(30);
    const [bgColor, setBgColor] = useState<"white" | "transparent">("transparent");
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => { setImage(ev.target?.result as string); setResult(null); };
        reader.readAsDataURL(file);
    };

    const removeBackground = () => {
        if (!image || !canvasRef.current) return;
        setIsProcessing(true);
        const img = new Image();
        img.onload = () => {
            const canvas = canvasRef.current!;
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Get corner colors to detect background
            const corners = [
                [0, 0], [img.width - 1, 0], [0, img.height - 1], [img.width - 1, img.height - 1]
            ];
            let avgR = 0, avgG = 0, avgB = 0;
            corners.forEach(([x, y]) => {
                const i = (y * img.width + x) * 4;
                avgR += data[i]; avgG += data[i + 1]; avgB += data[i + 2];
            });
            avgR /= 4; avgG /= 4; avgB /= 4;

            // Remove similar colors
            for (let i = 0; i < data.length; i += 4) {
                const diff = Math.abs(data[i] - avgR) + Math.abs(data[i + 1] - avgG) + Math.abs(data[i + 2] - avgB);
                if (diff < threshold * 3) {
                    if (bgColor === "transparent") {
                        data[i + 3] = 0; // Make transparent
                    } else {
                        data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; // Make white
                    }
                }
            }
            ctx.putImageData(imageData, 0, 0);
            setResult(canvas.toDataURL("image/png"));
            setIsProcessing(false);
        };
        img.src = image;
    };

    const download = () => {
        if (!result) return;
        const a = document.createElement("a");
        a.href = result;
        a.download = `no-bg-${Date.now()}.png`;
        a.click();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-900">
            <nav className="border-b border-emerald-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-emerald-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">✂️ Background Remover</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <canvas ref={canvasRef} className="hidden" />
                <div className="bg-slate-800/50 rounded-xl p-6 border border-emerald-800/30 mb-6">
                    <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id="upload" />
                    <label htmlFor="upload" className="block p-8 border-2 border-dashed border-emerald-700 rounded-lg text-center cursor-pointer hover:bg-slate-700/30">
                        <div className="text-4xl mb-2">📷</div>
                        <div className="text-white">Click to upload an image</div>
                        <div className="text-slate-400 text-sm mt-1">Works best with solid color backgrounds</div>
                    </label>
                </div>
                {image && (
                    <>
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-emerald-800/30 mb-6">
                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm text-emerald-300 mb-2">Sensitivity: {threshold}</label>
                                    <input type="range" value={threshold} onChange={(e) => setThreshold(parseInt(e.target.value))} min="5" max="100" className="w-full" />
                                </div>
                                <div>
                                    <label className="block text-sm text-emerald-300 mb-2">Replace with</label>
                                    <select value={bgColor} onChange={(e) => setBgColor(e.target.value as typeof bgColor)} className="w-full px-4 py-2 bg-slate-900 border border-emerald-700 rounded-lg text-white">
                                        <option value="transparent">Transparent</option>
                                        <option value="white">White</option>
                                    </select>
                                </div>
                            </div>
                            <button onClick={removeBackground} disabled={isProcessing} className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50">
                                {isProcessing ? "Processing..." : "Remove Background"}
                            </button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                                <div className="text-sm text-slate-400 mb-2">Original</div>
                                <img src={image} alt="Original" className="w-full rounded-lg" />
                            </div>
                            {result && (
                                <div className="bg-slate-800/50 rounded-xl p-4 border border-emerald-800/30" style={{ backgroundImage: "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)", backgroundSize: "20px 20px", backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px" }}>
                                    <div className="text-sm text-emerald-400 mb-2">Result (Transparent BG)</div>
                                    <img src={result} alt="Result" className="w-full rounded-lg" />
                                    <button onClick={download} className="w-full mt-4 py-2 bg-green-600 text-white rounded-lg">⬇️ Download PNG</button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
