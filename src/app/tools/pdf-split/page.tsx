"use client";

import { useState } from "react";
import Link from "next/link";
import ToolFAQ from "@/components/tools/ToolFAQ";
import AdBanner from "@/components/AdBanner";
import SupportBanner from "@/components/SupportBanner";
import EmailCapture from "@/components/EmailCapture";
import ShareButtons from "@/components/social/ShareButtons";
import JsonLd from "@/components/seo/JsonLd";

export default function PDFSplit() {
    const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
    const [fileName, setFileName] = useState("");
    const [pageCount, setPageCount] = useState(0);
    const [pageRange, setPageRange] = useState("");
    const [splitting, setSplitting] = useState(false);
    const [error, setError] = useState("");

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || file.type !== "application/pdf") return;
        setFileName(file.name);
        const data = await file.arrayBuffer();
        setPdfData(data);
        setError("");
        // Get page count
        try {
            const { PDFDocument } = await import("pdf-lib");
            const pdf = await PDFDocument.load(data);
            setPageCount(pdf.getPageCount());
        } catch {
            setError("Could not read PDF — it may be encrypted or corrupted.");
        }
    };

    const parsePageRange = (input: string, max: number): number[] => {
        const pages: number[] = [];
        const parts = input.split(",").map(s => s.trim());
        for (const part of parts) {
            if (part.includes("-")) {
                const [start, end] = part.split("-").map(n => parseInt(n));
                if (!isNaN(start) && !isNaN(end)) {
                    for (let i = Math.max(1, start); i <= Math.min(max, end); i++) pages.push(i - 1);
                }
            } else {
                const n = parseInt(part);
                if (!isNaN(n) && n >= 1 && n <= max) pages.push(n - 1);
            }
        }
        return [...new Set(pages)].sort((a, b) => a - b);
    };

    const split = async () => {
        if (!pdfData) return;
        const indices = parsePageRange(pageRange, pageCount);
        if (indices.length === 0) { setError("Enter a valid page range, e.g. 1-3, 5, 7-10"); return; }
        setSplitting(true);
        setError("");
        try {
            const { PDFDocument } = await import("pdf-lib");
            const src = await PDFDocument.load(pdfData);
            const out = await PDFDocument.create();
            const copied = await out.copyPages(src, indices);
            copied.forEach(p => out.addPage(p));
            const bytes = await out.save();
            const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `split-pages-${pageRange.replace(/\s/g, "")}-${Date.now()}.pdf`;
            a.click();
        } catch {
            setError("Failed to split PDF.");
        }
        setSplitting(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-950 via-slate-900 to-slate-900">
            <nav className="border-b border-violet-900/50 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-violet-400 hover:text-white transition-colors">← Back</Link>
                    <h1 className="text-xl font-bold text-white">✂️ PDF Split</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6 space-y-6">
                {/* Upload */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-violet-900/30">
                    <input type="file" accept=".pdf" onChange={handleUpload} className="hidden" id="pdf-upload" />
                    <label htmlFor="pdf-upload" className="block p-10 border-2 border-dashed border-violet-700/60 rounded-xl text-center cursor-pointer hover:bg-slate-700/30 transition-colors group">
                        <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📄</div>
                        {pdfData ? (
                            <>
                                <div className="text-white font-medium mb-1">{fileName}</div>
                                <div className="text-violet-300 text-sm">{pageCount} pages — click to replace</div>
                            </>
                        ) : (
                            <>
                                <div className="text-white font-medium mb-1">Upload a PDF</div>
                                <div className="text-slate-400 text-sm">100% browser-based, no uploads</div>
                            </>
                        )}
                    </label>
                </div>

                {pdfData && pageCount > 0 && (
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-violet-900/30 space-y-5">
                        <div>
                            <label className="block text-sm text-violet-300 mb-2">
                                Pages to extract <span className="text-slate-500">(e.g. 1-3, 5, 7-10)</span>
                            </label>
                            <input
                                type="text"
                                value={pageRange}
                                onChange={e => { setPageRange(e.target.value); setError(""); }}
                                placeholder={`1-${Math.min(3, pageCount)}, ${Math.min(5, pageCount)}`}
                                className="w-full px-4 py-3 bg-slate-900 border border-violet-700/50 rounded-lg text-white focus:outline-none focus:border-violet-500"
                            />
                            <p className="text-slate-500 text-xs mt-1">This PDF has {pageCount} page{pageCount !== 1 ? "s" : ""}. Pages will be extracted in the order you specify.</p>
                        </div>

                        {/* Quick presets */}
                        <div className="flex flex-wrap gap-2">
                            {["1", `1-${Math.ceil(pageCount / 2)}`, `${Math.ceil(pageCount / 2) + 1}-${pageCount}`, `${pageCount}`].filter((v, i, a) => a.indexOf(v) === i).map(preset => (
                                <button key={preset} onClick={() => setPageRange(preset)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors">
                                    p. {preset}
                                </button>
                            ))}
                        </div>

                        {error && <p className="text-red-400 text-sm">{error}</p>}

                        <button
                            onClick={split}
                            disabled={splitting || !pageRange.trim()}
                            className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors"
                        >
                            {splitting ? "Splitting…" : "✂️ Extract Pages & Download"}
                        </button>
                    </div>
                )}

                <ToolFAQ faqs={[
                    { question: "How do I specify pages to extract?", answer: "Use page numbers and ranges separated by commas. Examples: '1-5' extracts pages 1 to 5, '1, 3, 7' extracts those specific pages, '1-3, 10-15' combines both ranges. Pages are extracted in the order specified." },
                    { question: "Can I split a PDF into multiple separate files?", answer: "Currently this tool extracts a selected range into one new PDF. For splitting into many files (one per page), run the tool multiple times with different page ranges." },
                    { question: "Is my PDF uploaded to a server?", answer: "No. Everything happens in your browser using pdf-lib. Your PDF is never sent over the internet — it's completely private." },
                    { question: "Why does page extraction fail?", answer: "Encrypted or password-protected PDFs cannot be processed. The PDF must be unlocked before splitting. Corrupted PDFs may also fail to load." },
                ]} />

                <div className="my-6">
                    <AdBanner slot="4817652390" format="rectangle" />
                </div>
                <SupportBanner />
                <EmailCapture source="pdf-split" />
                <div className="mt-6 flex items-center justify-center">
                    <ShareButtons title="PDF Split - VedaWell Tools" text="I just used the free PDF Split tool on VedaWell! Check it out:" />
                </div>
                <JsonLd type="SoftwareApplication" data={{ name: "PDF Split", description: "Extract specific pages from a PDF in your browser.", applicationCategory: "UtilityApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }} />
            </main>
        </div>
    );
}
