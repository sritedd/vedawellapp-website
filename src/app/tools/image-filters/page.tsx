"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import ToolFAQ from "@/components/tools/ToolFAQ";
import AdBanner from "@/components/AdBanner";
import SupportBanner from "@/components/SupportBanner";
import EmailCapture from "@/components/EmailCapture";
import ShareButtons from "@/components/social/ShareButtons";
import JsonLd from "@/components/seo/JsonLd";

interface FilterValues {
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
    grayscale: number;
    sepia: number;
    hueRotate: number;
    invert: number;
    opacity: number;
    sharpness: number;
}

const DEFAULT_FILTERS: FilterValues = {
    brightness: 100, contrast: 100, saturation: 100, blur: 0,
    grayscale: 0, sepia: 0, hueRotate: 0, invert: 0, opacity: 100, sharpness: 0
};

const PRESETS: { name: string; emoji: string; values: Partial<FilterValues> }[] = [
    { name: "Original", emoji: "🖼️", values: {} },
    { name: "Grayscale", emoji: "⬛", values: { grayscale: 100, saturation: 0 } },
    { name: "Sepia", emoji: "🟫", values: { sepia: 100 } },
    { name: "Vivid", emoji: "🌈", values: { saturation: 180, contrast: 110, brightness: 105 } },
    { name: "Fade", emoji: "🌫️", values: { brightness: 120, contrast: 80, saturation: 60 } },
    { name: "Cool", emoji: "🧊", values: { hueRotate: 190, saturation: 120 } },
    { name: "Warm", emoji: "🔥", values: { hueRotate: 340, saturation: 130, brightness: 105 } },
    { name: "Dramatic", emoji: "🎭", values: { contrast: 150, brightness: 90, saturation: 80 } },
];

export default function ImageFilters() {
    const [image, setImage] = useState<string | null>(null);
    const [filters, setFilters] = useState<FilterValues>({ ...DEFAULT_FILTERS });
    const [format, setFormat] = useState<"jpeg" | "png" | "webp">("jpeg");
    const [quality, setQuality] = useState(90);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const cssFilter = useCallback((f: FilterValues) =>
        `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturation}%) blur(${f.blur}px) grayscale(${f.grayscale}%) sepia(${f.sepia}%) hue-rotate(${f.hueRotate}deg) invert(${f.invert}%) opacity(${f.opacity}%)`,
        []);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => { setImage(ev.target!.result as string); setFilters({ ...DEFAULT_FILTERS }); };
        reader.readAsDataURL(file);
    };

    const applyPreset = (preset: typeof PRESETS[0]) => {
        setFilters({ ...DEFAULT_FILTERS, ...preset.values });
    };

    const update = (key: keyof FilterValues, value: number) => setFilters(prev => ({ ...prev, [key]: value }));
    const reset = () => setFilters({ ...DEFAULT_FILTERS });

    const download = () => {
        if (!image || !canvasRef.current) return;
        const img = new Image();
        img.onload = () => {
            const canvas = canvasRef.current!;
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d")!;
            ctx.filter = cssFilter(filters);
            ctx.drawImage(img, 0, 0);
            const mimeType = `image/${format}`;
            const dataUrl = canvas.toDataURL(mimeType, quality / 100);
            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = `filtered-${Date.now()}.${format}`;
            a.click();
        };
        img.src = image;
    };

    const sliders: { key: keyof FilterValues; label: string; min: number; max: number; step?: number; unit: string }[] = [
        { key: "brightness", label: "Brightness", min: 0, max: 200, unit: "%" },
        { key: "contrast", label: "Contrast", min: 0, max: 300, unit: "%" },
        { key: "saturation", label: "Saturation", min: 0, max: 300, unit: "%" },
        { key: "hueRotate", label: "Hue Rotate", min: 0, max: 360, unit: "°" },
        { key: "sepia", label: "Sepia", min: 0, max: 100, unit: "%" },
        { key: "grayscale", label: "Grayscale", min: 0, max: 100, unit: "%" },
        { key: "invert", label: "Invert", min: 0, max: 100, unit: "%" },
        { key: "blur", label: "Blur", min: 0, max: 20, step: 0.5, unit: "px" },
        { key: "opacity", label: "Opacity", min: 0, max: 100, unit: "%" },
    ];

    const defaults: FilterValues = DEFAULT_FILTERS;

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-950 via-slate-900 to-slate-900">
            <nav className="border-b border-purple-900/50 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-purple-400 hover:text-white transition-colors">← Back</Link>
                    <h1 className="text-xl font-bold text-white">✨ Image Filters & Effects</h1>
                </div>
            </nav>
            <main className="max-w-5xl mx-auto p-6 space-y-6">
                <canvas ref={canvasRef} className="hidden" />

                {/* Upload */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-900/30">
                    <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id="img-upload" />
                    <label htmlFor="img-upload" className="block p-10 border-2 border-dashed border-purple-700/60 rounded-xl text-center cursor-pointer hover:bg-slate-700/30 transition-colors group">
                        <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">✨</div>
                        {image ? (
                            <div className="text-purple-300">Image loaded — click to replace</div>
                        ) : (
                            <>
                                <div className="text-white font-medium mb-1">Upload an image</div>
                                <div className="text-slate-400 text-sm">Apply filters and effects — 100% browser-based</div>
                            </>
                        )}
                    </label>
                </div>

                {image && (
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Preview */}
                        <div className="space-y-4">
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-900/30">
                                <div className="text-sm text-purple-300 mb-3">Live Preview</div>
                                <img
                                    src={image}
                                    alt="Preview"
                                    className="w-full rounded-lg"
                                    style={{ filter: cssFilter(filters) }}
                                />
                            </div>

                            {/* Presets */}
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-900/30">
                                <div className="text-sm text-purple-300 mb-3">Quick Presets</div>
                                <div className="grid grid-cols-4 gap-2">
                                    {PRESETS.map(p => (
                                        <button key={p.name} onClick={() => applyPreset(p)} className="py-2 px-1 bg-slate-700/60 hover:bg-purple-700/60 rounded-lg text-xs text-center transition-colors">
                                            <div>{p.emoji}</div>
                                            <div className="text-slate-300 mt-0.5">{p.name}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Download */}
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-900/30 space-y-3">
                                <div className="grid grid-cols-3 gap-2">
                                    {(["jpeg", "png", "webp"] as const).map(f => (
                                        <button key={f} onClick={() => setFormat(f)} className={`py-2 rounded-lg uppercase text-sm font-medium ${format === f ? "bg-purple-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>{f}</button>
                                    ))}
                                </div>
                                {format !== "png" && (
                                    <div>
                                        <label className="text-xs text-slate-400">Quality: {quality}%</label>
                                        <input type="range" min="50" max="100" value={quality} onChange={e => setQuality(parseInt(e.target.value))} className="w-full" />
                                    </div>
                                )}
                                <button onClick={download} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors">
                                    ⬇️ Download {format.toUpperCase()}
                                </button>
                            </div>
                        </div>

                        {/* Sliders */}
                        <div className="bg-slate-800/50 rounded-xl p-5 border border-purple-900/30 space-y-4">
                            <div className="flex items-center justify-between mb-1">
                                <div className="text-sm font-semibold text-white">Adjust Filters</div>
                                <button onClick={reset} className="text-xs text-purple-400 hover:text-purple-300">Reset all</button>
                            </div>
                            {sliders.map(s => (
                                <div key={s.key}>
                                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                                        <span>{s.label}</span>
                                        <span>{filters[s.key]}{s.unit}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={s.min}
                                        max={s.max}
                                        step={s.step || 1}
                                        value={filters[s.key]}
                                        onChange={e => update(s.key, parseFloat(e.target.value))}
                                        className="w-full accent-purple-500"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <ToolFAQ faqs={[
                    { question: "Are filters applied destructively?", answer: "No. Filters are applied non-destructively in the live preview. The original image stays unchanged. Filters are only baked into the image when you click download." },
                    { question: "What filters are available?", answer: "Brightness, Contrast, Saturation, Hue Rotate, Sepia, Grayscale, Invert, Blur, and Opacity. You can also use Quick Presets for common looks like Vivid, Warm, Cool, and Dramatic." },
                    { question: "Which format should I export to?", answer: "JPEG is best for photos (smallest file size). PNG preserves transparency and sharp edges. WebP offers the best compression for web use and is supported by all modern browsers." },
                    { question: "Is this tool private?", answer: "Yes. All image processing uses the HTML5 Canvas API — no images are uploaded to any server." },
                ]} />

                <div className="my-6">
                    <AdBanner slot="4817652390" format="rectangle" />
                </div>
                <SupportBanner />
                <EmailCapture source="image-filters" />
                <div className="mt-6 flex items-center justify-center">
                    <ShareButtons title="Image Filters & Effects - VedaWell Tools" text="I just used the free Image Filters tool on VedaWell! Check it out:" />
                </div>
                <JsonLd type="SoftwareApplication" data={{ name: "Image Filters & Effects", description: "Apply photo filters and effects in your browser.", applicationCategory: "UtilityApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }} />
            </main>
        </div>
    );
}
