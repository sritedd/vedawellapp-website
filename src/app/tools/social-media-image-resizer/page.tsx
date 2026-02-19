"use client";

import { useState } from "react";
import Link from "next/link";

const SOCIAL_SIZES = {
    "Instagram Post": { width: 1080, height: 1080 },
    "Instagram Story": { width: 1080, height: 1920 },
    "Facebook Post": { width: 1200, height: 630 },
    "Facebook Cover": { width: 820, height: 312 },
    "Twitter Post": { width: 1200, height: 675 },
    "Twitter Header": { width: 1500, height: 500 },
    "LinkedIn Post": { width: 1200, height: 627 },
    "LinkedIn Cover": { width: 1584, height: 396 },
    "YouTube Thumbnail": { width: 1280, height: 720 },
    "Pinterest Pin": { width: 1000, height: 1500 },
};

export default function SocialMediaImageResizer() {
    const [image, setImage] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<keyof typeof SOCIAL_SIZES>("Instagram Post");
    const [result, setResult] = useState<string | null>(null);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => { setImage(ev.target?.result as string); setResult(null); };
        reader.readAsDataURL(file);
    };

    const resize = () => {
        if (!image) return;
        const size = SOCIAL_SIZES[selectedSize];
        const canvas = document.createElement("canvas");
        canvas.width = size.width;
        canvas.height = size.height;
        const ctx = canvas.getContext("2d")!;
        const img = new Image();
        img.onload = () => {
            // Cover resize (crop to fill)
            const scale = Math.max(size.width / img.width, size.height / img.height);
            const x = (size.width - img.width * scale) / 2;
            const y = (size.height - img.height * scale) / 2;
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            setResult(canvas.toDataURL("image/jpeg", 0.9));
        };
        img.src = image;
    };

    const download = () => {
        if (!result) return;
        const a = document.createElement("a");
        a.href = result;
        a.download = `${selectedSize.toLowerCase().replace(/\s+/g, "-")}.jpg`;
        a.click();
    };

    const size = SOCIAL_SIZES[selectedSize];

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-900 via-slate-900 to-slate-900">
            <nav className="border-b border-pink-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-pink-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">📱 Social Media Image Resizer</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-pink-800/30 mb-6">
                    <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id="upload" />
                    <label htmlFor="upload" className="block p-8 border-2 border-dashed border-pink-700 rounded-lg text-center cursor-pointer hover:bg-slate-700/30">
                        {image ? <img src={image} alt="Source" className="max-h-32 mx-auto" /> : "📁 Upload Image"}
                    </label>
                </div>
                {image && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-pink-800/30">
                            <label className="block text-sm text-pink-300 mb-2">Select Platform & Size</label>
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {Object.entries(SOCIAL_SIZES).map(([name, { width, height }]) => (
                                    <button key={name} onClick={() => { setSelectedSize(name as keyof typeof SOCIAL_SIZES); setResult(null); }} className={`p-2 rounded-lg text-left ${selectedSize === name ? "bg-pink-600 text-white" : "bg-slate-700 text-slate-300"}`}>
                                        <div className="text-sm font-medium">{name}</div>
                                        <div className="text-xs opacity-70">{width}×{height}</div>
                                    </button>
                                ))}
                            </div>
                            <button onClick={resize} className="w-full py-3 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700">Resize Image</button>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-pink-800/30">
                            <div className="text-sm text-pink-300 mb-2">{selectedSize} Preview ({size.width}×{size.height})</div>
                            <div className="bg-slate-900 rounded-lg p-4 flex items-center justify-center" style={{ aspectRatio: `${size.width}/${size.height}`, maxHeight: 400 }}>
                                {result ? (
                                    <img src={result} alt="Result" className="max-w-full max-h-full rounded" />
                                ) : (
                                    <div className="text-slate-500 text-center">
                                        <div className="text-4xl mb-2">📐</div>
                                        <div>Click Resize to preview</div>
                                    </div>
                                )}
                            </div>
                            {result && <button onClick={download} className="w-full mt-4 py-2 bg-green-600 text-white rounded-lg">⬇️ Download</button>}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
