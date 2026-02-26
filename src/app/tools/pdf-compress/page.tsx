"use client";

import { useState } from "react";
import Link from "next/link";
import ToolFAQ from "@/components/tools/ToolFAQ";
import AdBanner from "@/components/AdBanner";
import SupportBanner from "@/components/SupportBanner";
import EmailCapture from "@/components/EmailCapture";
import ShareButtons from "@/components/social/ShareButtons";
import JsonLd from "@/components/seo/JsonLd";

export default function PDFCompress() {
    const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
    const [fileName, setFileName] = useState("");
    const [originalSize, setOriginalSize] = useState(0);
    const [compressing, setCompressing] = useState(false);
    const [result, setResult] = useState<{ bytes: Uint8Array; size: number } | null>(null);
    const [error, setError] = useState("");

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || file.type !== "application/pdf") return;
        setFileName(file.name.replace(".pdf", ""));
        setOriginalSize(file.size);
        const data = await file.arrayBuffer();
        setPdfData(data);
        setResult(null);
        setError("");
    };

    const compress = async () => {
        if (!pdfData) return;
        setCompressing(true);
        setError("");
        try {
            const { PDFDocument } = await import("pdf-lib");
            const pdf = await PDFDocument.load(pdfData, { ignoreEncryption: false });

            // Strip metadata to reduce size
            pdf.setTitle("");
            pdf.setAuthor("");
            pdf.setSubject("");
            pdf.setKeywords([]);
            pdf.setProducer("");
            pdf.setCreator("");

            const bytes = await pdf.save({ useObjectStreams: true, addDefaultPage: false });
            setResult({ bytes, size: bytes.length });
        } catch {
            setError("Could not compress — the PDF may be encrypted or corrupted.");
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
                                <div className="text-amber-300 text-sm mt-1">{formatSize(originalSize)} — click to replace</div>
                            </>
                        ) : (
                            <>
                                <div className="text-white font-medium mb-1">Upload a PDF to compress</div>
                                <div className="text-slate-400 text-sm">Processed entirely in your browser</div>
                            </>
                        )}
                    </label>
                </div>

                {pdfData && (
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-amber-900/30 space-y-5">
                        <div className="p-4 bg-slate-700/40 rounded-lg">
                            <p className="text-slate-300 text-sm leading-relaxed">
                                This tool removes hidden metadata, strips unused document properties, and repackages the PDF using efficient object streams — reducing file size without affecting visible content.
                            </p>
                        </div>

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
                                {compressing ? "Compressing…" : "🗜️ Compress PDF"}
                            </button>
                            {result && (
                                <button onClick={download} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors">
                                    ⬇️ Download
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <ToolFAQ faqs={[
                    { question: "How much will my PDF shrink?", answer: "Compression results vary by PDF. PDFs with lots of redundant metadata and unused objects can shrink significantly. PDFs that are already optimized may see minimal reduction. Images embedded in PDFs are not re-encoded by this tool." },
                    { question: "Will the content look different after compression?", answer: "No. This tool only removes hidden metadata and repackages internal PDF structures. All text, images, and layouts remain exactly the same." },
                    { question: "Can I compress password-protected PDFs?", answer: "No. Encrypted PDFs cannot be loaded or modified without the password. Remove the password protection first (in Adobe Reader or similar) before compressing." },
                    { question: "Is this tool private?", answer: "Yes, completely. Your PDF is processed in your browser using pdf-lib and is never uploaded to any server." },
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
