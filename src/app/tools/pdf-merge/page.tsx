"use client";

import { useState } from "react";
import Link from "next/link";
import ToolFAQ from "@/components/tools/ToolFAQ";
import AdBanner from "@/components/AdBanner";
import SupportBanner from "@/components/SupportBanner";
import EmailCapture from "@/components/EmailCapture";
import ShareButtons from "@/components/social/ShareButtons";
import JsonLd from "@/components/seo/JsonLd";

interface PDFFile {
    name: string;
    data: ArrayBuffer;
    size: number;
}

export default function PDFMerge() {
    const [files, setFiles] = useState<PDFFile[]>([]);
    const [merging, setMerging] = useState(false);
    const [merged, setMerged] = useState<Uint8Array | null>(null);
    const [error, setError] = useState("");

    const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || []).filter(f => f.type === "application/pdf");
        const loaded: PDFFile[] = [];
        for (const file of selected) {
            const data = await file.arrayBuffer();
            loaded.push({ name: file.name, data, size: file.size });
        }
        setFiles(prev => [...prev, ...loaded]);
        setMerged(null);
        setError("");
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        setMerged(null);
    };

    const moveUp = (index: number) => {
        if (index === 0) return;
        setFiles(prev => {
            const arr = [...prev];
            [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
            return arr;
        });
    };

    const moveDown = (index: number) => {
        if (index === files.length - 1) return;
        setFiles(prev => {
            const arr = [...prev];
            [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
            return arr;
        });
    };

    const merge = async () => {
        if (files.length < 2) { setError("Please add at least 2 PDF files."); return; }
        setMerging(true);
        setError("");
        try {
            const { PDFDocument } = await import("pdf-lib");
            const merged = await PDFDocument.create();
            for (const file of files) {
                const pdf = await PDFDocument.load(file.data);
                const pages = await merged.copyPages(pdf, pdf.getPageIndices());
                pages.forEach(p => merged.addPage(p));
            }
            const bytes = await merged.save();
            setMerged(bytes);
        } catch {
            setError("Failed to merge PDFs. Ensure all files are valid, non-encrypted PDFs.");
        }
        setMerging(false);
    };

    const download = () => {
        if (!merged) return;
        const blob = new Blob([new Uint8Array(merged)], { type: "application/pdf" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `merged-${Date.now()}.pdf`;
        a.click();
    };

    const formatSize = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;
    const totalSize = files.reduce((s, f) => s + f.size, 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-950 via-slate-900 to-slate-900">
            <nav className="border-b border-rose-900/50 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-rose-400 hover:text-white transition-colors">← Back</Link>
                    <h1 className="text-xl font-bold text-white">📄 PDF Merge</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6 space-y-6">
                {/* Upload */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-rose-900/30">
                    <input type="file" accept=".pdf" multiple onChange={handleFiles} className="hidden" id="pdf-upload" />
                    <label htmlFor="pdf-upload" className="block p-10 border-2 border-dashed border-rose-700/60 rounded-xl text-center cursor-pointer hover:bg-slate-700/30 transition-colors group">
                        <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📄</div>
                        <div className="text-white font-medium mb-1">Click to add PDF files</div>
                        <div className="text-slate-400 text-sm">Supports multiple files — all processed in your browser</div>
                    </label>
                </div>

                {/* File list */}
                {files.length > 0 && (
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-rose-900/30">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-white font-semibold">{files.length} file{files.length !== 1 ? "s" : ""} · {formatSize(totalSize)} total</h2>
                        </div>
                        <div className="space-y-2 mb-6">
                            {files.map((f, i) => (
                                <div key={i} className="flex items-center gap-3 bg-slate-700/40 rounded-lg px-4 py-3">
                                    <span className="text-rose-300 text-sm font-medium w-6 text-center">{i + 1}</span>
                                    <span className="text-white flex-1 text-sm truncate">{f.name}</span>
                                    <span className="text-slate-400 text-xs">{formatSize(f.size)}</span>
                                    <button onClick={() => moveUp(i)} disabled={i === 0} className="text-slate-400 hover:text-white disabled:opacity-20 px-1">↑</button>
                                    <button onClick={() => moveDown(i)} disabled={i === files.length - 1} className="text-slate-400 hover:text-white disabled:opacity-20 px-1">↓</button>
                                    <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-300 px-1">✕</button>
                                </div>
                            ))}
                        </div>
                        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                        <div className="flex gap-3">
                            <button onClick={merge} disabled={merging || files.length < 2} className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors">
                                {merging ? "Merging…" : `🔗 Merge ${files.length} PDFs`}
                            </button>
                            {merged && (
                                <button onClick={download} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors">
                                    ⬇️ Download Merged PDF ({formatSize(merged.length)})
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <ToolFAQ faqs={[
                    { question: "Is my data uploaded anywhere?", answer: "No. All PDF merging happens 100% in your browser using the pdf-lib library. Your files never leave your device and are not uploaded to any server." },
                    { question: "How many PDFs can I merge?", answer: "You can merge as many PDFs as your device's memory allows. Most devices handle 20–50 PDFs without issues. Use the arrows to reorder files before merging." },
                    { question: "Why did my merge fail?", answer: "Encrypted or password-protected PDFs cannot be merged without the password. Ensure your PDFs are not encrypted. If the issue persists, the PDF may be corrupted." },
                    { question: "Does merging affect image or text quality?", answer: "No. pdf-lib copies pages at their original resolution without re-encoding content, so merged PDFs retain full original quality." },
                ]} />

                <div className="my-6">
                    <AdBanner slot="4817652390" format="rectangle" />
                </div>
                <SupportBanner />
                <EmailCapture source="pdf-merge" />
                <div className="mt-6 flex items-center justify-center">
                    <ShareButtons title="PDF Merge - VedaWell Tools" text="I just used the free PDF Merge tool on VedaWell! Check it out:" />
                </div>

                <JsonLd type="SoftwareApplication" data={{ name: "PDF Merge", description: "Merge multiple PDF files into one in your browser.", applicationCategory: "UtilityApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }} />
            </main>
        </div>
    );
}
