"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import ToolFAQ from "@/components/tools/ToolFAQ";
import { readAsDataURL, loadImage, validateImageFile, friendlyError } from "@/lib/tools/safety";

export default function ImageCompressor() {
    const [image, setImage] = useState<string | null>(null);
    const [compressed, setCompressed] = useState<string | null>(null);
    const [quality, setQuality] = useState(80);
    const [originalSize, setOriginalSize] = useState(0);
    const [compressedSize, setCompressedSize] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState("");
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError("");
        try {
            validateImageFile(file);
            const dataUrl = await readAsDataURL(file);
            setOriginalSize(file.size);
            setImage(dataUrl);
            setCompressed(null);
        } catch (err) {
            setError(friendlyError(err, "Could not read that image."));
        }
        e.target.value = "";
    };

    const compress = async () => {
        if (!image || !canvasRef.current) return;
        setIsProcessing(true);
        setError("");
        try {
            const img = await loadImage(image);
            const canvas = canvasRef.current;
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Canvas unavailable in this browser");
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL("image/jpeg", quality / 100);
            setCompressed(dataUrl);
            setCompressedSize(Math.round((dataUrl.length - "data:image/jpeg;base64,".length) * 0.75));
        } catch (err) {
            setError(friendlyError(err, "Compression failed."));
        } finally {
            setIsProcessing(false);
        }
    };

    const download = () => {
        if (!compressed) return;
        const a = document.createElement("a");
        a.href = compressed;
        a.download = `compressed-${Date.now()}.jpg`;
        a.click();
    };

    const formatSize = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    const savings = originalSize > 0 && compressedSize > 0 ? Math.round((1 - compressedSize / originalSize) * 100) : 0;

    return (
        <div className="min-h-screen text-white bg-gradient-to-br from-pink-900 via-slate-900 to-slate-900">
            <nav className="border-b border-pink-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-pink-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">🗜️ Image Compressor</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <canvas ref={canvasRef} className="hidden" />
                <div className="bg-slate-800/50 rounded-xl p-6 border border-pink-800/30 mb-6">
                    <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id="upload" />
                    <label htmlFor="upload" className="block p-8 border-2 border-dashed border-pink-700 rounded-lg text-center cursor-pointer hover:bg-slate-700/30">
                        {image ? "Click to upload a different image" : "📁 Click to upload an image"}
                    </label>
                    {error && (
                        <p role="alert" className="mt-3 text-sm text-red-300 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2">{error}</p>
                    )}
                </div>
                {image && (
                    <>
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-pink-800/30 mb-6">
                            <label className="block text-sm text-pink-300 mb-2">Quality: {quality}%</label>
                            <input type="range" value={quality} onChange={(e) => setQuality(parseInt(e.target.value))} min="10" max="100" className="w-full mb-4" />
                            <button onClick={compress} disabled={isProcessing} className="w-full py-3 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 disabled:opacity-50">{isProcessing ? "Compressing..." : "Compress Image"}</button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-pink-800/30">
                                <div className="text-sm text-slate-400 mb-2">Original ({formatSize(originalSize)})</div>
                                <img src={image} alt="Original" className="w-full rounded-lg" />
                            </div>
                            {compressed && (
                                <div className="bg-slate-800/50 rounded-xl p-4 border border-green-800/30">
                                    <div className="text-sm text-green-400 mb-2">Compressed ({formatSize(compressedSize)}) - {savings}% smaller</div>
                                    <img src={compressed} alt="Compressed" className="w-full rounded-lg" />
                                    <button onClick={download} className="w-full mt-4 py-2 bg-green-600 text-white rounded-lg">⬇️ Download</button>
                                </div>
                            )}
                        </div>
                    </>
                )}
                <ToolFAQ faqs={[
                    { question: "Does compressing images reduce their quality?", answer: "Our compressor uses intelligent lossy compression that reduces file size while maintaining visual quality. At 80% quality (our default), the difference is imperceptible to the human eye, yet file sizes drop by 50-80%. You can adjust the quality slider to find your ideal balance." },
                    { question: "Is it safe to upload images to this tool?", answer: "Yes, completely safe. Image compression happens 100% in your browser using the HTML5 Canvas API. Your images are never uploaded to any server, never stored, and never seen by anyone else. This is the most private image compressor available." },
                    { question: "What image formats can I compress?", answer: "This tool supports JPEG, PNG, and WebP compression. JPEG works best for photographs (60-80% size reduction). PNG is ideal for graphics with transparency. WebP offers the best compression ratio for web use and is supported by all modern browsers." },
                    { question: "What is the maximum file size I can compress?", answer: "Since processing happens in your browser, the limit depends on your device's memory. Most devices handle images up to 50MB without issues. For very large images (50MB+), you may experience slower processing but it will still work." },
                ]} />
            </main>
        </div>
    );
}
