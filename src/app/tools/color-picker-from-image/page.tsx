"use client";

import { useState, useRef } from "react";
import Link from "next/link";

interface ColorInfo {
    hex: string;
    rgb: string;
    hsl: string;
}

export default function ColorPickerFromImage() {
    const [image, setImage] = useState<string | null>(null);
    const [colors, setColors] = useState<ColorInfo[]>([]);
    const [pickedColor, setPickedColor] = useState<ColorInfo | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => { setImage(ev.target?.result as string); setColors([]); setPickedColor(null); };
        reader.readAsDataURL(file);
    };

    const rgbToHex = (r: number, g: number, b: number) => "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("");
    const rgbToHsl = (r: number, g: number, b: number) => {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0;
        const l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
    };

    const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
        if (!canvasRef.current || !imgRef.current) return;
        const canvas = canvasRef.current;
        const img = imgRef.current;
        const rect = img.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) * (img.naturalWidth / rect.width));
        const y = Math.floor((e.clientY - rect.top) * (img.naturalHeight / rect.height));
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const [r, g, b] = [pixel[0], pixel[1], pixel[2]];
        const color: ColorInfo = { hex: rgbToHex(r, g, b), rgb: `rgb(${r}, ${g}, ${b})`, hsl: rgbToHsl(r, g, b) };
        setPickedColor(color);
        if (!colors.some(c => c.hex === color.hex)) setColors([color, ...colors.slice(0, 9)]);
    };

    const extractPalette = () => {
        if (!canvasRef.current || !imgRef.current) return;
        const canvas = canvasRef.current;
        const img = imgRef.current;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const colorCounts: Record<string, number> = {};
        for (let i = 0; i < imageData.length; i += 40) { // Sample every 10th pixel
            const r = Math.round(imageData[i] / 32) * 32;
            const g = Math.round(imageData[i + 1] / 32) * 32;
            const b = Math.round(imageData[i + 2] / 32) * 32;
            const hex = rgbToHex(r, g, b);
            colorCounts[hex] = (colorCounts[hex] || 0) + 1;
        }
        const sorted = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
        const palette = sorted.map(([hex]) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return { hex, rgb: `rgb(${r}, ${g}, ${b})`, hsl: rgbToHsl(r, g, b) };
        });
        setColors(palette);
    };

    const copy = (text: string) => { navigator.clipboard.writeText(text); setCopied(text); setTimeout(() => setCopied(null), 2000); };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-900 via-slate-900 to-slate-900">
            <nav className="border-b border-pink-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-pink-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">🎨 Color Picker from Image</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <canvas ref={canvasRef} className="hidden" />
                <div className="bg-slate-800/50 rounded-xl p-6 border border-pink-800/30 mb-6">
                    <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id="upload" />
                    <label htmlFor="upload" className="block p-8 border-2 border-dashed border-pink-700 rounded-lg text-center cursor-pointer hover:bg-slate-700/30">
                        <div className="text-4xl mb-2">🖼️</div>
                        <div className="text-white">Click to upload an image</div>
                    </label>
                </div>
                {image && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-pink-800/30">
                            <div className="text-sm text-pink-300 mb-2">Click on image to pick color</div>
                            <img ref={imgRef} src={image} alt="Source" onClick={handleImageClick} className="w-full rounded-lg cursor-crosshair" crossOrigin="anonymous" />
                            <button onClick={extractPalette} className="w-full mt-4 py-2 bg-pink-600 text-white rounded-lg">🎨 Extract Palette</button>
                        </div>
                        <div className="space-y-4">
                            {pickedColor && (
                                <div className="bg-slate-800/50 rounded-xl p-4 border border-pink-800/30">
                                    <div className="text-sm text-pink-300 mb-2">Selected Color</div>
                                    <div className="flex gap-4 items-center">
                                        <div className="w-20 h-20 rounded-lg" style={{ backgroundColor: pickedColor.hex }} />
                                        <div className="space-y-1">
                                            {[["HEX", pickedColor.hex], ["RGB", pickedColor.rgb], ["HSL", pickedColor.hsl]].map(([label, value]) => (
                                                <button key={label as string} onClick={() => copy(value as string)} className="block text-left w-full">
                                                    <span className="text-slate-400 text-xs">{label}: </span>
                                                    <span className="text-white font-mono text-sm">{copied === value ? "✓ Copied" : value}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {colors.length > 0 && (
                                <div className="bg-slate-800/50 rounded-xl p-4 border border-pink-800/30">
                                    <div className="text-sm text-pink-300 mb-2">Color Palette</div>
                                    <div className="grid grid-cols-4 gap-2">
                                        {colors.map((c, i) => (
                                            <button key={i} onClick={() => { setPickedColor(c); copy(c.hex); }} className="group">
                                                <div className="h-12 rounded-lg mb-1" style={{ backgroundColor: c.hex }} />
                                                <div className="text-xs text-slate-400 group-hover:text-white">{c.hex}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
