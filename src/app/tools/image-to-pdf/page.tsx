"use client";

import { useState } from "react";
import Link from "next/link";
import ToolFAQ from "@/components/tools/ToolFAQ";
import AdBanner from "@/components/AdBanner";
import SupportBanner from "@/components/SupportBanner";
import EmailCapture from "@/components/EmailCapture";
import ShareButtons from "@/components/social/ShareButtons";
import JsonLd from "@/components/seo/JsonLd";
import {
    dataUrlToBytes,
    friendlyError,
    loadImage,
    readAsDataURL,
    validateImageFile,
    MAX_BATCH_FILES,
} from "@/lib/tools/safety";

interface ImageFile {
    name: string;
    dataUrl: string;
    width: number;
    height: number;
}

type PageSize = "A4" | "Letter" | "A3" | "fit";

const PAGE_SIZES: Record<PageSize, { w: number; h: number; label: string }> = {
    A4: { w: 595, h: 842, label: "A4 (210 × 297 mm)" },
    Letter: { w: 612, h: 792, label: "Letter (8.5 × 11 in)" },
    A3: { w: 842, h: 1191, label: "A3 (297 × 420 mm)" },
    fit: { w: 0, h: 0, label: "Fit to image size" },
};

export default function ImageToPDF() {
    const [images, setImages] = useState<ImageFile[]>([]);
    const [pageSize, setPageSize] = useState<PageSize>("A4");
    const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
    const [margin, setMargin] = useState(20);
    const [converting, setConverting] = useState(false);
    const [error, setError] = useState("");

    const loadImageFile = async (file: File): Promise<ImageFile> => {
        validateImageFile(file);
        const dataUrl = await readAsDataURL(file);
        const img = await loadImage(dataUrl);
        return { name: file.name, dataUrl, width: img.naturalWidth, height: img.naturalHeight };
    };

    const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const incoming = Array.from(input.files || []);
        if (incoming.length === 0) return;

        setError("");

        // Enforce batch cap (combined with already-loaded images)
        const remaining = MAX_BATCH_FILES - images.length;
        if (remaining <= 0) {
            setError(`Maximum ${MAX_BATCH_FILES} images per PDF. Remove some before adding more.`);
            input.value = "";
            return;
        }
        const toLoad = incoming.slice(0, remaining);
        if (incoming.length > remaining) {
            setError(`Only loaded the first ${remaining} image${remaining === 1 ? "" : "s"} — ${MAX_BATCH_FILES} is the per-PDF max.`);
        }

        const loaded: ImageFile[] = [];
        const failures: string[] = [];
        for (const file of toLoad) {
            try {
                loaded.push(await loadImageFile(file));
            } catch (err) {
                failures.push(`${file.name}: ${friendlyError(err, "Failed to load")}`);
            }
        }

        if (loaded.length > 0) {
            setImages(prev => [...prev, ...loaded]);
        }
        if (failures.length > 0) {
            setError(failures.join(" · "));
        }
        // Reset the input so re-selecting the same file fires onChange again
        input.value = "";
    };

    const removeImage = (i: number) => setImages(prev => prev.filter((_, idx) => idx !== i));
    const moveUp = (i: number) => { if (i === 0) return; setImages(prev => { const a = [...prev];[a[i - 1], a[i]] = [a[i], a[i - 1]]; return a; }); };
    const moveDown = (i: number) => { if (i === images.length - 1) return; setImages(prev => { const a = [...prev];[a[i], a[i + 1]] = [a[i + 1], a[i]]; return a; }); };

    const convert = async () => {
        if (images.length === 0) return;
        setConverting(true);
        setError("");

        // Track blob URLs so we can revoke after download (prevents leak)
        let downloadUrl: string | null = null;

        try {
            const { PDFDocument } = await import("pdf-lib");
            const pdf = await PDFDocument.create();

            for (const img of images) {
                const isJpeg = /\.jpe?g$/i.test(img.name) || /^data:image\/jpe?g/i.test(img.dataUrl);

                // Decode data URL directly to bytes. Using fetch(dataUrl) here
                // is fragile — Safari + some strict CSP configs reject it with
                // "Failed to fetch" and no stack trace.
                const bytes = dataUrlToBytes(img.dataUrl);

                let embedded;
                if (isJpeg) {
                    embedded = await pdf.embedJpg(bytes);
                } else {
                    // Re-encode via canvas to ensure we hand pdf-lib a PNG it
                    // can embed, even if the source was WebP/AVIF/etc.
                    const image = await loadImage(img.dataUrl);
                    const canvas = document.createElement("canvas");
                    canvas.width = image.naturalWidth;
                    canvas.height = image.naturalHeight;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) throw new Error("Browser canvas unavailable");
                    ctx.drawImage(image, 0, 0);
                    const pngDataUrl = canvas.toDataURL("image/png");
                    embedded = await pdf.embedPng(dataUrlToBytes(pngDataUrl));
                }

                let pw: number, ph: number;
                if (pageSize === "fit") {
                    pw = embedded.width;
                    ph = embedded.height;
                } else {
                    const ps = PAGE_SIZES[pageSize];
                    pw = orientation === "portrait" ? ps.w : ps.h;
                    ph = orientation === "portrait" ? ps.h : ps.w;
                }

                const page = pdf.addPage([pw, ph]);
                const availW = Math.max(1, pw - margin * 2);
                const availH = Math.max(1, ph - margin * 2);
                const scale = Math.min(availW / embedded.width, availH / embedded.height);
                const drawW = embedded.width * scale;
                const drawH = embedded.height * scale;
                const x = margin + (availW - drawW) / 2;
                const y = margin + (availH - drawH) / 2;
                page.drawImage(embedded, { x, y, width: drawW, height: drawH });
            }

            const pdfBytes = await pdf.save();
            const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
            downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = `images-to-pdf-${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (e) {
            setError(friendlyError(e, "Couldn't create the PDF. Try fewer images or smaller files."));
        } finally {
            // Revoke after a moment so the download has time to start
            if (downloadUrl) setTimeout(() => URL.revokeObjectURL(downloadUrl!), 30_000);
            setConverting(false);
        }
    };

    return (
        <div className="min-h-screen text-white bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900">
            <nav className="border-b border-emerald-900/50 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-emerald-400 hover:text-white transition-colors">← Back</Link>
                    <h1 className="text-xl font-bold text-white">🖼️→📄 Image to PDF</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6 space-y-6">
                {/* Upload */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-emerald-900/30">
                    <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" id="img-upload" />
                    <label htmlFor="img-upload" className="block p-10 border-2 border-dashed border-emerald-700/60 rounded-xl text-center cursor-pointer hover:bg-slate-700/30 transition-colors group">
                        <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🖼️</div>
                        <div className="text-white font-medium mb-1">Click to add images</div>
                        <div className="text-slate-400 text-sm">JPG, PNG, WebP supported — each image becomes one page</div>
                    </label>
                </div>

                {/* Image list */}
                {images.length > 0 && (
                    <>
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-emerald-900/30 space-y-2">
                            <h2 className="text-white font-semibold mb-3">{images.length} image{images.length !== 1 ? "s" : ""}</h2>
                            {images.map((img, i) => (
                                <div key={i} className="flex items-center gap-3 bg-slate-700/40 rounded-lg px-4 py-3">
                                    <img src={img.dataUrl} alt={img.name} className="w-10 h-10 object-cover rounded" />
                                    <span className="text-white flex-1 text-sm truncate">{img.name}</span>
                                    <span className="text-slate-400 text-xs">{img.width}×{img.height}</span>
                                    <button onClick={() => moveUp(i)} disabled={i === 0} className="text-slate-400 hover:text-white disabled:opacity-20 px-1">↑</button>
                                    <button onClick={() => moveDown(i)} disabled={i === images.length - 1} className="text-slate-400 hover:text-white disabled:opacity-20 px-1">↓</button>
                                    <button onClick={() => removeImage(i)} className="text-red-400 hover:text-red-300 px-1">✕</button>
                                </div>
                            ))}
                        </div>

                        {/* Settings */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-emerald-900/30 space-y-5">
                            <h2 className="text-white font-semibold">Page Settings</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-emerald-300 mb-2">Page Size</label>
                                    <select value={pageSize} onChange={e => setPageSize(e.target.value as PageSize)} className="w-full px-3 py-2.5 bg-slate-900 border border-emerald-700/50 rounded-lg text-white focus:outline-none">
                                        {(Object.entries(PAGE_SIZES) as [PageSize, { label: string }][]).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-emerald-300 mb-2">Orientation</label>
                                    <div className="flex gap-2">
                                        {(["portrait", "landscape"] as const).map(o => (
                                            <button key={o} onClick={() => setOrientation(o)} disabled={pageSize === "fit"} className={`flex-1 py-2.5 rounded-lg capitalize text-sm ${orientation === o && pageSize !== "fit" ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40"}`}>{o}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {pageSize !== "fit" && (
                                <div>
                                    <label className="block text-sm text-emerald-300 mb-2">Margin: {margin}pt</label>
                                    <input type="range" min="0" max="80" value={margin} onChange={e => setMargin(parseInt(e.target.value))} className="w-full" />
                                </div>
                            )}

                            {error && <p className="text-red-400 text-sm">{error}</p>}

                            <button onClick={convert} disabled={converting} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors">
                                {converting ? "Converting…" : `📄 Convert ${images.length} Image${images.length !== 1 ? "s" : ""} to PDF`}
                            </button>
                        </div>
                    </>
                )}

                <ToolFAQ faqs={[
                    { question: "What image formats are supported?", answer: "JPG/JPEG, PNG, and WebP images are supported. Non-JPEG images are automatically converted to PNG during processing." },
                    { question: "How are images fitted to the page?", answer: "Each image is scaled to fit within the page margins while maintaining its aspect ratio. The image is centered on the page. Use 'Fit to image size' to create a PDF where each page is exactly the image dimensions." },
                    { question: "Can I reorder images before converting?", answer: "Yes! Use the ↑ and ↓ arrows next to each image to reorder them. The PDF pages will be in the order shown." },
                    { question: "Is this tool private?", answer: "Yes. All PDF creation uses pdf-lib in your browser. No images are uploaded to any server." },
                ]} />

                <div className="my-6">
                    <AdBanner slot="4817652390" format="rectangle" />
                </div>
                <SupportBanner />
                <EmailCapture source="image-to-pdf" />
                <div className="mt-6 flex items-center justify-center">
                    <ShareButtons title="Image to PDF - VedaWell Tools" text="I just used the free Image to PDF converter on VedaWell! Check it out:" />
                </div>
                <JsonLd type="SoftwareApplication" data={{ name: "Image to PDF", description: "Convert images to a single PDF document in your browser.", applicationCategory: "UtilityApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }} />
            </main>
        </div>
    );
}
