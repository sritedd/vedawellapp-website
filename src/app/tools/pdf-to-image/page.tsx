"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import ToolFAQ from "@/components/tools/ToolFAQ";
import AdBanner from "@/components/AdBanner";
import SupportBanner from "@/components/SupportBanner";
import EmailCapture from "@/components/EmailCapture";
import ShareButtons from "@/components/social/ShareButtons";
import JsonLd from "@/components/seo/JsonLd";

interface PageImage {
    page: number;
    dataUrl: string;
}

export default function PDFToImage() {
    const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
    const [fileName, setFileName] = useState("");
    const [pageCount, setPageCount] = useState(0);
    const [converting, setConverting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [images, setImages] = useState<PageImage[]>([]);
    const [format, setFormat] = useState<"png" | "jpeg">("png");
    const [scale, setScale] = useState(2);
    const [error, setError] = useState("");
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || file.type !== "application/pdf") return;
        setFileName(file.name.replace(".pdf", ""));
        const ab = await file.arrayBuffer();
        const uint8 = new Uint8Array(ab);
        setPdfData(uint8);
        setImages([]);
        setError("");
        setProgress(0);

        try {
            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
            const pdf = await pdfjsLib.getDocument({ data: uint8 }).promise;
            setPageCount(pdf.numPages);
        } catch {
            setError("Could not read PDF — it may be encrypted or corrupted.");
        }
    };

    const convert = async () => {
        if (!pdfData) return;
        setConverting(true);
        setImages([]);
        setError("");
        setProgress(0);
        try {
            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
            const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
            const results: PageImage[] = [];

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale });
                const canvas = document.createElement("canvas");
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext("2d")!;
                await page.render({ canvasContext: ctx, viewport, canvas }).promise;
                const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
                results.push({ page: i, dataUrl: canvas.toDataURL(mimeType, 0.9) });
                setProgress(Math.round((i / pdf.numPages) * 100));
            }
            setImages(results);
        } catch {
            setError("Conversion failed. The PDF may be encrypted or contain unsupported features.");
        }
        setConverting(false);
    };

    const downloadAll = () => {
        images.forEach(img => {
            const a = document.createElement("a");
            a.href = img.dataUrl;
            a.download = `${fileName}-page-${img.page}.${format}`;
            a.click();
        });
    };

    const downloadOne = (img: PageImage) => {
        const a = document.createElement("a");
        a.href = img.dataUrl;
        a.download = `${fileName}-page-${img.page}.${format}`;
        a.click();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-950 via-slate-900 to-slate-900">
            <nav className="border-b border-cyan-900/50 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-cyan-400 hover:text-white transition-colors">← Back</Link>
                    <h1 className="text-xl font-bold text-white">🖼️ PDF to Image</h1>
                </div>
            </nav>
            <main className="max-w-5xl mx-auto p-6 space-y-6">
                <canvas ref={canvasRef} className="hidden" />

                {/* Upload */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-cyan-900/30">
                    <input type="file" accept=".pdf" onChange={handleUpload} className="hidden" id="pdf-upload" />
                    <label htmlFor="pdf-upload" className="block p-10 border-2 border-dashed border-cyan-700/60 rounded-xl text-center cursor-pointer hover:bg-slate-700/30 transition-colors group">
                        <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📄</div>
                        {pdfData ? (
                            <>
                                <div className="text-white font-medium">{fileName}.pdf</div>
                                <div className="text-cyan-300 text-sm mt-1">{pageCount} pages — click to replace</div>
                            </>
                        ) : (
                            <>
                                <div className="text-white font-medium mb-1">Upload a PDF to convert</div>
                                <div className="text-slate-400 text-sm">Each page becomes a separate image</div>
                            </>
                        )}
                    </label>
                </div>

                {pdfData && (
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-cyan-900/30 space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-cyan-300 mb-2">Output Format</label>
                                <div className="flex gap-2">
                                    {(["png", "jpeg"] as const).map(f => (
                                        <button key={f} onClick={() => setFormat(f)} className={`flex-1 py-2 rounded-lg font-medium uppercase text-sm ${format === f ? "bg-cyan-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>{f}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-cyan-300 mb-2">Quality: {scale === 1 ? "72 DPI" : scale === 2 ? "144 DPI ✓" : "216 DPI"}</label>
                                <div className="flex gap-2">
                                    {([{ v: 1, l: "Low" }, { v: 2, l: "High" }, { v: 3, l: "Ultra" }]).map(({ v, l }) => (
                                        <button key={v} onClick={() => setScale(v)} className={`flex-1 py-2 rounded-lg text-sm ${scale === v ? "bg-cyan-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>{l}</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {error && <p className="text-red-400 text-sm">{error}</p>}

                        {converting && (
                            <div>
                                <div className="flex justify-between text-sm text-slate-400 mb-1">
                                    <span>Converting pages…</span><span>{progress}%</span>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full">
                                    <div className="h-2 bg-cyan-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button onClick={convert} disabled={converting} className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors">
                                {converting ? "Converting…" : `🖼️ Convert ${pageCount} Page${pageCount !== 1 ? "s" : ""}`}
                            </button>
                            {images.length > 0 && (
                                <button onClick={downloadAll} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors">
                                    ⬇️ Download All ({images.length})
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Preview grid */}
                {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {images.map(img => (
                            <div key={img.page} className="bg-slate-800/50 rounded-xl overflow-hidden border border-cyan-900/30 group">
                                <img src={img.dataUrl} alt={`Page ${img.page}`} className="w-full" />
                                <div className="p-3 flex items-center justify-between">
                                    <span className="text-slate-400 text-sm">Page {img.page}</span>
                                    <button onClick={() => downloadOne(img)} className="text-xs px-3 py-1.5 bg-cyan-700/60 hover:bg-cyan-600 text-white rounded-lg transition-colors">⬇️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <ToolFAQ faqs={[
                    { question: "What image format should I choose?", answer: "PNG is lossless and ideal for documents with text and sharp graphics. JPEG is smaller and better for PDFs with photos. Use High (144 DPI) for most uses, or Ultra (216 DPI) for printing." },
                    { question: "Is there a page limit?", answer: "No limit — all pages are converted. However, very large PDFs with hundreds of pages may take some time since processing is done in your browser." },
                    { question: "Why are some pages blank or missing content?", answer: "This can happen with encrypted PDFs, PDFs using non-standard fonts, or those with DRM protection. Try a different PDF or remove encryption first." },
                    { question: "Is this tool private?", answer: "Yes. PDF rendering uses Mozilla's PDF.js library entirely in your browser — no data is sent to any server." },
                ]} />

                <div className="my-6">
                    <AdBanner slot="4817652390" format="rectangle" />
                </div>
                <SupportBanner />
                <EmailCapture source="pdf-to-image" />
                <div className="mt-6 flex items-center justify-center">
                    <ShareButtons title="PDF to Image - VedaWell Tools" text="I just used the free PDF to Image converter on VedaWell! Check it out:" />
                </div>
                <JsonLd type="SoftwareApplication" data={{ name: "PDF to Image", description: "Convert PDF pages to PNG or JPEG images in your browser.", applicationCategory: "UtilityApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }} />
            </main>
        </div>
    );
}
