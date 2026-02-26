"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import ToolFAQ from "@/components/tools/ToolFAQ";
import AdBanner from "@/components/AdBanner";
import SupportBanner from "@/components/SupportBanner";
import EmailCapture from "@/components/EmailCapture";
import ShareButtons from "@/components/social/ShareButtons";
import JsonLd from "@/components/seo/JsonLd";

interface ImageEntry {
    name: string;
    original: string;
    originalSize: number;
    compressed: string | null;
    compressedSize: number;
    status: "waiting" | "done" | "error";
}

export default function BatchImageCompressor() {
    const [images, setImages] = useState<ImageEntry[]>([]);
    const [quality, setQuality] = useState(80);
    const [processing, setProcessing] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []).filter(f => f.type.startsWith("image/"));
        const entries: ImageEntry[] = await Promise.all(files.map(file => new Promise<ImageEntry>(resolve => {
            const reader = new FileReader();
            reader.onload = ev => resolve({ name: file.name, original: ev.target!.result as string, originalSize: file.size, compressed: null, compressedSize: 0, status: "waiting" });
            reader.readAsDataURL(file);
        })));
        setImages(prev => [...prev, ...entries]);
    };

    const compressImage = (src: string, q: number): Promise<{ dataUrl: string; size: number }> =>
        new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d")!;
                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL("image/jpeg", q / 100);
                const size = Math.round((dataUrl.length - "data:image/jpeg;base64,".length) * 0.75);
                resolve({ dataUrl, size });
            };
            img.onerror = reject;
            img.src = src;
        });

    const compressAll = async () => {
        setProcessing(true);
        const updated = [...images];
        for (let i = 0; i < updated.length; i++) {
            try {
                const { dataUrl, size } = await compressImage(updated[i].original, quality);
                updated[i] = { ...updated[i], compressed: dataUrl, compressedSize: size, status: "done" };
                setImages([...updated]);
            } catch {
                updated[i] = { ...updated[i], status: "error" };
                setImages([...updated]);
            }
        }
        setProcessing(false);
    };

    const downloadOne = (img: ImageEntry) => {
        if (!img.compressed) return;
        const a = document.createElement("a");
        a.href = img.compressed;
        a.download = `compressed-${img.name.replace(/\.[^.]+$/, "")}.jpg`;
        a.click();
    };

    const downloadAll = () => images.filter(i => i.compressed).forEach(downloadOne);
    const removeImage = (i: number) => setImages(prev => prev.filter((_, idx) => idx !== i));
    const clearAll = () => setImages([]);

    const formatSize = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;
    const savings = (orig: number, comp: number) => orig > 0 && comp > 0 ? Math.round((1 - comp / orig) * 100) : 0;
    const doneCount = images.filter(i => i.status === "done").length;
    const totalSaved = images.filter(i => i.status === "done").reduce((s, i) => s + (i.originalSize - i.compressedSize), 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-950 via-slate-900 to-slate-900">
            <nav className="border-b border-pink-900/50 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-pink-400 hover:text-white transition-colors">← Back</Link>
                    <h1 className="text-xl font-bold text-white">📦 Batch Image Compressor</h1>
                </div>
            </nav>
            <main className="max-w-5xl mx-auto p-6 space-y-6">
                <canvas ref={canvasRef} className="hidden" />

                {/* Upload */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-pink-900/30">
                    <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" id="img-upload" />
                    <label htmlFor="img-upload" className="block p-10 border-2 border-dashed border-pink-700/60 rounded-xl text-center cursor-pointer hover:bg-slate-700/30 transition-colors group">
                        <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🖼️</div>
                        <div className="text-white font-medium mb-1">Click to add images</div>
                        <div className="text-slate-400 text-sm">JPG, PNG, WebP — compress up to 50 images at once</div>
                    </label>
                </div>

                {images.length > 0 && (
                    <>
                        {/* Controls */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-pink-900/30 space-y-4">
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex-1 min-w-48">
                                    <label className="block text-sm text-pink-300 mb-2">Compression Quality: {quality}%</label>
                                    <input type="range" min="20" max="100" value={quality} onChange={e => setQuality(parseInt(e.target.value))} className="w-full" />
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <button onClick={compressAll} disabled={processing} className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors">
                                        {processing ? "Compressing…" : `🗜️ Compress All (${images.length})`}
                                    </button>
                                    {doneCount > 0 && (
                                        <button onClick={downloadAll} className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-colors">
                                            ⬇️ Download All
                                        </button>
                                    )}
                                    <button onClick={clearAll} className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm transition-colors">Clear</button>
                                </div>
                            </div>

                            {doneCount > 0 && (
                                <div className="flex gap-6 text-sm text-slate-400 pt-2 border-t border-slate-700">
                                    <span>{doneCount}/{images.length} compressed</span>
                                    <span className="text-green-400">Saved {formatSize(totalSaved)} total</span>
                                </div>
                            )}
                        </div>

                        {/* Image grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {images.map((img, i) => {
                                const s = savings(img.originalSize, img.compressedSize);
                                return (
                                    <div key={i} className="bg-slate-800/50 rounded-xl overflow-hidden border border-pink-900/30">
                                        <div className="relative">
                                            <img src={img.compressed || img.original} alt={img.name} className="w-full h-40 object-cover" />
                                            <button onClick={() => removeImage(i)} className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-red-600 text-white rounded-full text-xs transition-colors">✕</button>
                                            {img.status === "done" && <div className="absolute top-2 left-2 px-2 py-0.5 bg-green-600/90 text-white text-xs rounded-lg">↓{s}%</div>}
                                        </div>
                                        <div className="p-3 space-y-2">
                                            <p className="text-white text-sm truncate">{img.name}</p>
                                            <div className="flex items-center justify-between">
                                                <div className="text-xs text-slate-400">
                                                    {img.status === "done" ? (
                                                        <span><span className="line-through">{formatSize(img.originalSize)}</span> → <span className="text-green-400">{formatSize(img.compressedSize)}</span></span>
                                                    ) : (
                                                        <span>{formatSize(img.originalSize)}</span>
                                                    )}
                                                </div>
                                                {img.status === "done" && (
                                                    <button onClick={() => downloadOne(img)} className="text-xs px-2 py-1 bg-green-700/60 hover:bg-green-600 text-white rounded-lg transition-colors">⬇️</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                <ToolFAQ faqs={[
                    { question: "How many images can I compress at once?", answer: "You can add as many images as your device memory allows — there's no hard limit. The tool processes images one by one in your browser using the Canvas API." },
                    { question: "What quality setting should I use?", answer: "80% quality is our recommended default — it reduces file size by 60-80% with virtually no visible quality loss. Use 60-70% for web thumbnails, 90%+ for print or professional use." },
                    { question: "Are PNG files converted to JPEG?", answer: "Yes. Compression uses JPEG encoding for maximum size reduction. If you need to preserve transparency (PNG alpha), use our Image Format Converter tool instead." },
                    { question: "Is my data private?", answer: "Completely. All compression happens in your browser using the HTML5 Canvas API. No images are uploaded to any server." },
                ]} />

                <div className="my-6">
                    <AdBanner slot="4817652390" format="rectangle" />
                </div>
                <SupportBanner />
                <EmailCapture source="batch-image-compressor" />
                <div className="mt-6 flex items-center justify-center">
                    <ShareButtons title="Batch Image Compressor - VedaWell Tools" text="I just used the free Batch Image Compressor on VedaWell! Check it out:" />
                </div>
                <JsonLd type="SoftwareApplication" data={{ name: "Batch Image Compressor", description: "Compress multiple images at once in your browser.", applicationCategory: "UtilityApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }} />
            </main>
        </div>
    );
}
