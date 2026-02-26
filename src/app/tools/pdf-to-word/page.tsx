"use client";

import { useState } from "react";
import Link from "next/link";
import ToolFAQ from "@/components/tools/ToolFAQ";
import AdBanner from "@/components/AdBanner";
import SupportBanner from "@/components/SupportBanner";
import EmailCapture from "@/components/EmailCapture";
import ShareButtons from "@/components/social/ShareButtons";
import JsonLd from "@/components/seo/JsonLd";

export default function PDFToWord() {
    const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
    const [fileName, setFileName] = useState("");
    const [pageCount, setPageCount] = useState(0);
    const [converting, setConverting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState("");

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || file.type !== "application/pdf") return;
        setFileName(file.name.replace(".pdf", ""));
        const ab = await file.arrayBuffer();
        const uint8 = new Uint8Array(ab);
        setPdfData(uint8);
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
        setError("");
        setProgress(0);

        try {
            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
            const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

            // Extract text from each page
            const pageTexts: string[] = [];
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                    .map((item) => ("str" in item ? item.str : ""))
                    .join(" ")
                    .replace(/ +/g, " ")
                    .trim();
                pageTexts.push(pageText);
                setProgress(Math.round((i / pdf.numPages) * 50)); // first half: extraction
            }

            // Build Word document using docx library
            const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
            setProgress(60);

            const children = pageTexts.flatMap((text, i) => {
                const paragraphs = [];
                if (pdf.numPages > 1) {
                    paragraphs.push(
                        new Paragraph({
                            text: `Page ${i + 1}`,
                            heading: HeadingLevel.HEADING_2,
                            spacing: { before: 400, after: 200 },
                        })
                    );
                }
                // Split text into paragraphs by double-spacing heuristic
                const parts = text.split(/\s{3,}|\n{2,}/).filter(Boolean);
                for (const part of parts) {
                    paragraphs.push(
                        new Paragraph({
                            children: [new TextRun({ text: part.trim(), size: 24 })],
                            spacing: { after: 200 },
                        })
                    );
                }
                if (parts.length === 0 && text.trim()) {
                    paragraphs.push(
                        new Paragraph({
                            children: [new TextRun({ text: text.trim(), size: 24 })],
                            spacing: { after: 200 },
                        })
                    );
                }
                return paragraphs;
            });

            setProgress(80);

            const doc = new Document({
                sections: [{
                    properties: {},
                    children: children.length > 0 ? children : [
                        new Paragraph({ children: [new TextRun({ text: "No text content could be extracted from this PDF.", size: 24 })] })
                    ],
                }],
            });

            setProgress(90);
            const blob = await Packer.toBlob(doc);
            setProgress(100);

            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `${fileName}-converted.docx`;
            a.click();
        } catch (err) {
            setError(`Conversion failed: ${err instanceof Error ? err.message : "Unknown error"}. The PDF may be encrypted or have no extractable text.`);
        }
        setConverting(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-slate-900">
            <nav className="border-b border-blue-900/50 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-blue-400 hover:text-white transition-colors">← Back</Link>
                    <h1 className="text-xl font-bold text-white">📝 PDF to Word</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6 space-y-6">
                {/* Upload */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-900/30">
                    <input type="file" accept=".pdf" onChange={handleUpload} className="hidden" id="pdf-upload" />
                    <label htmlFor="pdf-upload" className="block p-10 border-2 border-dashed border-blue-700/60 rounded-xl text-center cursor-pointer hover:bg-slate-700/30 transition-colors group">
                        <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📄</div>
                        {pdfData ? (
                            <>
                                <div className="text-white font-medium">{fileName}.pdf</div>
                                <div className="text-blue-300 text-sm mt-1">{pageCount} pages — click to replace</div>
                            </>
                        ) : (
                            <>
                                <div className="text-white font-medium mb-1">Upload a PDF to convert</div>
                                <div className="text-slate-400 text-sm">Text is extracted and saved as a .docx file</div>
                            </>
                        )}
                    </label>
                </div>

                {pdfData && (
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-900/30 space-y-5">
                        <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg space-y-2">
                            <p className="text-blue-300 text-sm font-medium">ℹ️ What to expect</p>
                            <ul className="text-slate-400 text-sm space-y-1 list-disc list-inside">
                                <li>Text content is extracted and placed into a Word document (.docx)</li>
                                <li>Original PDF layout, images, and fonts are not preserved</li>
                                <li>Best for text-heavy PDFs (reports, articles, contracts)</li>
                                <li>Scanned/image-based PDFs will produce an empty document</li>
                            </ul>
                        </div>

                        {converting && (
                            <div>
                                <div className="flex justify-between text-sm text-slate-400 mb-1">
                                    <span>{progress < 50 ? "Extracting text…" : progress < 90 ? "Building Word document…" : "Finalising…"}</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full">
                                    <div className="h-2 bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )}

                        {error && <p className="text-red-400 text-sm">{error}</p>}

                        <button
                            onClick={convert}
                            disabled={converting}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors"
                        >
                            {converting ? `Converting… ${progress}%` : `📝 Convert to Word (.docx)`}
                        </button>
                    </div>
                )}

                <ToolFAQ faqs={[
                    { question: "Does this preserve the PDF layout?", answer: "No. This tool extracts text content from the PDF and places it into a Word document. The original layout, images, columns, and fonts are not reproduced. For layout-accurate conversion, you would need a server-based tool like Adobe Acrobat." },
                    { question: "My converted document is empty. Why?", answer: "The PDF is likely a scanned document or image-based PDF that doesn't contain selectable text. Text extraction only works on PDFs with actual text layers. Scanned PDFs require OCR (optical character recognition) which is not available in this client-side tool." },
                    { question: "What types of PDFs work best?", answer: "Text-heavy PDFs like reports, articles, contracts, and papers. These typically have embedded text layers that can be extracted accurately." },
                    { question: "Is this tool private?", answer: "Yes. All processing uses Mozilla PDF.js and the docx library in your browser. Your PDF is never sent to any server." },
                ]} />

                <div className="my-6">
                    <AdBanner slot="4817652390" format="rectangle" />
                </div>
                <SupportBanner />
                <EmailCapture source="pdf-to-word" />
                <div className="mt-6 flex items-center justify-center">
                    <ShareButtons title="PDF to Word - VedaWell Tools" text="I just used the free PDF to Word converter on VedaWell! Check it out:" />
                </div>
                <JsonLd type="SoftwareApplication" data={{ name: "PDF to Word", description: "Convert PDF text content to a Word document in your browser.", applicationCategory: "UtilityApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }} />
            </main>
        </div>
    );
}
