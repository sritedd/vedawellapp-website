"use client";

import { useState } from "react";
import Link from "next/link";
import ToolFAQ from "@/components/tools/ToolFAQ";
import AdBanner from "@/components/AdBanner";
import SupportBanner from "@/components/SupportBanner";
import EmailCapture from "@/components/EmailCapture";
import ShareButtons from "@/components/social/ShareButtons";
import JsonLd from "@/components/seo/JsonLd";

type Quality = "high" | "medium" | "low";

const QUALITY_SETTINGS: Record<Quality, { dpi: number; jpegQ: number; label: string; desc: string }> = {
    high: { dpi: 1.5, jpegQ: 0.85, label: "High Quality", desc: "~20-40% smaller · minimal visual change" },
    medium: { dpi: 1.2, jpegQ: 0.72, label: "Medium Quality", desc: "~40-65% smaller · slight quality trade-off" },
    low: { dpi: 1.0, jpegQ: 0.55, label: "Small File", desc: "~60-80% smaller · noticeable compression" },
};

export default function PDFCompress() {
    const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
    const [fileName, setFileName] = useState("");
    const [originalSize, setOriginalSize] = useState(0);
    const [pageCount, setPageCount] = useState(0);
    const [quality, setQuality] = useState<Quality>("medium");
    const [compressing, setCompressing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ bytes: Uint8Array; size: number } | null>(null);
    const [error, setError] = useState("");

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || file.type !== "application/pdf") return;
        setFileName(file.name.replace(".pdf", ""));
        setOriginalSize(file.size);
        const ab = await file.arrayBuffer();
        const uint8 = new Uint8Array(ab);
        setPdfData(uint8);
        setResult(null);
        setError("");
        setProgress(0);

        // Get page count
        try {
            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
            const pdf = await pdfjsLib.getDocument({ data: uint8 }).promise;
            setPageCount(pdf.numPages);
        } catch {
            setError("Could not read PDF — it may be encrypted or corrupted.");
        }
    };

    const compress = async () => {
        if (!pdfData) return;
        setCompressing(true);
        setError("");
        setProgress(0);

        try {
            const { dpi, jpegQ } = QUALITY_SETTINGS[quality];

            // Step 1: load with pdfjs and rasterize each page to JPEG
            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
            const srcPdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

            // Step 2: rebuild PDF using pdf-lib with jpeg-compressed pages
            const { PDFDocument } = await import("pdf-lib");
            const outDoc = await PDFDocument.create();

            for (let i = 1; i <= srcPdf.numPages; i++) {
                const page = await srcPdf.getPage(i);
                const viewport = page.getViewport({ scale: dpi });

                const canvas = document.createElement("canvas");
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext("2d")!;
                await page.render({ canvasContext: ctx, viewport, canvas }).promise;

                // Convert to JPEG blob for maximum compression
                const jpegDataUrl = canvas.toDataURL("image/jpeg", jpegQ);
                const base64 = jpegDataUrl.split(",")[1];
                const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

                const embeddedImage = await outDoc.embedJpg(bytes);
                const newPage = outDoc.addPage([viewport.width, viewport.height]);
                newPage.drawImage(embeddedImage, { x: 0, y: 0, width: viewport.width, height: viewport.height });

                setProgress(Math.round((i / srcPdf.numPages) * 100));
            }

            const compressedBytes = await outDoc.save();
            const uint8Out = new Uint8Array(compressedBytes);
            setResult({ bytes: uint8Out, size: uint8Out.length });
        } catch (err) {
            setError(`Compression failed: ${err instanceof Error ? err.message : "Unknown error"}. The PDF may be encrypted or corrupted.`);
        }
        setCompressing(false);
    };

    const download = () => {
        if (!result) return;
        const blob = new Blob([new Uint8Array(result.bytes)], { type: "application/pdf" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `compressed-${fileName}-${Date.now()}.pdf`;
        a.click();
    };

    const formatSize = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(2)} MB`;
    const savings = result ? Math.round((1 - result.size / originalSize) * 100) : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-950 via-slate-900 to-slate-900">
            <nav className="border-b border-amber-900/50 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-amber-400 hover:text-white transition-colors">← Back</Link>
                    <h1 className="text-xl font-bold text-white">🗜️ PDF Compress</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6 space-y-6">
                {/* Upload */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-amber-900/30">
                    <input type="file" accept=".pdf" onChange={handleUpload} className="hidden" id="pdf-upload" />
                    <label htmlFor="pdf-upload" className="block p-10 border-2 border-dashed border-amber-700/60 rounded-xl text-center cursor-pointer hover:bg-slate-700/30 transition-colors group">
                        <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📄</div>
                        {pdfData ? (
                            <>
                                <div className="text-white font-medium">{fileName}.pdf</div>
                                <div className="text-amber-300 text-sm mt-1">{pageCount} pages · {formatSize(originalSize)} — click to replace</div>
                            </>
                        ) : (
                            <>
                                <div className="text-white font-medium mb-1">Upload a PDF to compress</div>
                                <div className="text-slate-400 text-sm">All processing happens in your browser</div>
                            </>
                        )}
                    </label>
                </div>

                {pdfData && (
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-amber-900/30 space-y-5">
                        {/* Quality selector */}
                        <div>
                            <label className="block text-sm font-medium text-amber-300 mb-3">Compression Level</label>
                            <div className="grid grid-cols-3 gap-3">
                                {(Object.entries(QUALITY_SETTINGS) as [Quality, typeof QUALITY_SETTINGS[Quality]][]).map(([key, s]) => (
                                    <button
                                        key={key}
                                        onClick={() => setQuality(key)}
                                        className={`p-3 rounded-xl border text-left transition-all ${quality === key ? "border-amber-500 bg-amber-900/30" : "border-slate-700 hover:border-slate-500"}`}
                                    >
                                        <div className="text-white text-sm font-medium">{s.label}</div>
                                        <div className="text-slate-400 text-xs mt-1">{s.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-700/40 rounded-lg text-sm text-slate-300 leading-relaxed">
                            ℹ️ This compressor re-renders each page as a compressed JPEG image then assembles a new PDF — achieving significant size reduction on all document types.
                        </div>

                        {compressing && (
                            <div>
                                <div className="flex justify-between text-sm text-slate-400 mb-1">
                                    <span>Compressing pages…</span><span>{progress}%</span>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full">
                                    <div className="h-2 bg-amber-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )}

                        {error && <p className="text-red-400 text-sm">{error}</p>}

                        {result && (
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="bg-slate-700/40 rounded-lg py-4">
                                    <div className="text-slate-400 text-xs mb-1">Original</div>
                                    <div className="text-white font-bold">{formatSize(originalSize)}</div>
                                </div>
                                <div className="bg-slate-700/40 rounded-lg py-4 flex flex-col items-center justify-center">
                                    <div className={`text-2xl font-bold ${savings > 0 ? "text-green-400" : "text-slate-400"}`}>
                                        {savings > 0 ? `↓${savings}%` : "~0%"}
                                    </div>
                                    <div className="text-slate-500 text-xs">reduction</div>
                                </div>
                                <div className="bg-slate-700/40 rounded-lg py-4">
                                    <div className="text-slate-400 text-xs mb-1">Compressed</div>
                                    <div className="text-green-400 font-bold">{formatSize(result.size)}</div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button onClick={compress} disabled={compressing} className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors">
                                {compressing ? `Compressing… ${progress}%` : `🗜️ Compress ${pageCount} Page${pageCount !== 1 ? "s" : ""}`}
                            </button>
                            {result && (
                                <button onClick={download} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors">
                                    ⬇️ Download ({formatSize(result.size)})
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <ToolFAQ faqs={[
                    { question: "How does the compression work?", answer: "Each PDF page is rendered to a canvas using Mozilla PDF.js, then saved as a compressed JPEG image. A new PDF is assembled from these compressed images using pdf-lib. This achieves real file size reduction on all PDF types." },
                    { question: "Will I lose text selectability?", answer: "Yes — because each page is converted to an image, text will no longer be selectable or searchable in the output PDF. This is the trade-off for achieving significant compression. Choose 'High Quality' to minimise visual quality loss." },
                    { question: "How much smaller will my PDF be?", answer: "Typically 20–80% smaller depending on the compression level you choose and the original PDF content. PDFs with large embedded photos benefit most." },
                    { question: "Is this tool private?", answer: "Yes. All rendering and compression happens entirely in your browser. Your PDF is never uploaded to any server." },
                ]} />

                <div className="my-6">
                    <AdBanner slot="4817652390" format="rectangle" />
                </div>
                <SupportBanner />
                <EmailCapture source="pdf-compress" />
                <div className="mt-6 flex items-center justify-center">
                    <ShareButtons title="PDF Compress - VedaWell Tools" text="I just used the free PDF Compress tool on VedaWell! Check it out:" />
                </div>
                <JsonLd type="SoftwareApplication" data={{ name: "PDF Compress", description: "Reduce PDF file size in your browser.", applicationCategory: "UtilityApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }} />
            </main>
        </div>
    );
}
