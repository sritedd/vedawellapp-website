"use client";

import { useState } from "react";
import Link from "next/link";
import ToolFAQ from "@/components/tools/ToolFAQ";
import AdBanner from "@/components/AdBanner";
import SupportBanner from "@/components/SupportBanner";
import EmailCapture from "@/components/EmailCapture";
import ShareButtons from "@/components/social/ShareButtons";
import JsonLd from "@/components/seo/JsonLd";

type Mode = "images" | "text";

export default function PDFToWord() {
    const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
    const [fileName, setFileName] = useState("");
    const [pageCount, setPageCount] = useState(0);
    const [converting, setConverting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressLabel, setProgressLabel] = useState("");
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);
    const [mode, setMode] = useState<Mode>("images");

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || file.type !== "application/pdf") return;
        setFileName(file.name.replace(/\.pdf$/i, ""));
        const ab = await file.arrayBuffer();
        const uint8 = new Uint8Array(ab);
        setPdfData(uint8);
        setError("");
        setProgress(0);
        setDone(false);

        try {
            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
            const pdf = await pdfjsLib.getDocument({ data: uint8.slice() }).promise;
            setPageCount(pdf.numPages);
        } catch {
            setError("Could not read PDF — it may be encrypted or corrupted.");
        }
    };

    /** Render all pages to JPEG Uint8Arrays using pdfjs + canvas */
    const renderPages = async (
        pdf: Awaited<ReturnType<typeof import("pdfjs-dist")["getDocument"]>["promise"]>,
        scale: number
    ): Promise<{ jpeg: Uint8Array; widthPx: number; heightPx: number }[]> => {
        const pages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
            setProgressLabel(`Rendering page ${i} of ${pdf.numPages}…`);
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(viewport.width);
            canvas.height = Math.round(viewport.height);
            const ctx = canvas.getContext("2d")!;
            await page.render({ canvasContext: ctx, viewport, canvas }).promise;
            const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
            const base64 = dataUrl.split(",")[1];
            const binary = atob(base64);
            const jpeg = new Uint8Array(binary.length);
            for (let b = 0; b < binary.length; b++) jpeg[b] = binary.charCodeAt(b);
            pages.push({ jpeg, widthPx: canvas.width, heightPx: canvas.height });
            setProgress(Math.round((i / pdf.numPages) * 60));
        }
        return pages;
    };

    /** Extract plain text lines per page */
    const extractText = async (
        pdf: Awaited<ReturnType<typeof import("pdfjs-dist")["getDocument"]>["promise"]>
    ): Promise<string[][]> => {
        const allPages: string[][] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
            setProgressLabel(`Extracting text from page ${i}…`);
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const lineMap = new Map<number, string[]>();
            for (const item of textContent.items) {
                if (!("str" in item) || !item.str.trim()) continue;
                const y = Math.round(
                    ("transform" in item
                        ? (item as { transform: number[] }).transform[5]
                        : 0) / 2
                ) * 2;
                if (!lineMap.has(y)) lineMap.set(y, []);
                lineMap.get(y)!.push(item.str);
            }
            const lines = [...lineMap.entries()]
                .sort((a, b) => b[0] - a[0])
                .map(([, strs]) => strs.join(" ").replace(/ {2,}/g, " ").trim())
                .filter(Boolean);
            allPages.push(lines);
            setProgress(Math.round((i / pdf.numPages) * 60));
        }
        return allPages;
    };

    const convert = async () => {
        if (!pdfData) return;
        setConverting(true);
        setError("");
        setProgress(0);
        setDone(false);

        try {
            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
            const pdf = await pdfjsLib.getDocument({ data: pdfData.slice() }).promise;

            const { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType } = await import("docx");

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const children: any[] = [];

            if (mode === "images") {
                // --- Page-as-image mode: faithfully captures text + images + layout ---
                const pages = await renderPages(pdf, 1.5);
                setProgressLabel("Building Word document…");
                setProgress(70);

                // Word page width = 9360 EMU pixels (6.5" content width at 96dpi = 624px)
                // We'll fit each page to 624px wide and scale height proportionally
                const MAX_WIDTH_PX = 624;

                for (let i = 0; i < pages.length; i++) {
                    const { jpeg, widthPx, heightPx } = pages[i];
                    const scale = Math.min(1, MAX_WIDTH_PX / widthPx);
                    const displayW = Math.round(widthPx * scale);
                    const displayH = Math.round(heightPx * scale);

                    children.push(
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { before: i === 0 ? 0 : 400, after: 200 },
                            children: [
                                new ImageRun({
                                    data: jpeg,
                                    transformation: { width: displayW, height: displayH },
                                    type: "jpg",
                                }),
                            ],
                        })
                    );
                }
            } else {
                // --- Text-only mode ---
                const pageTexts = await extractText(pdf);
                setProgressLabel("Building Word document…");
                setProgress(70);

                pageTexts.forEach((lines, i) => {
                    if (pdf.numPages > 1) {
                        children.push(
                            new Paragraph({
                                text: `Page ${i + 1}`,
                                heading: HeadingLevel.HEADING_2,
                                spacing: { before: 400, after: 160 },
                            })
                        );
                    }
                    if (lines.length === 0) {
                        children.push(
                            new Paragraph({
                                children: [new TextRun({ text: "(no selectable text on this page)", italics: true, color: "999999" })],
                            })
                        );
                    } else {
                        for (const line of lines) {
                            children.push(
                                new Paragraph({
                                    children: [new TextRun({ text: line, size: 24 })],
                                    spacing: { after: 120 },
                                })
                            );
                        }
                    }
                });
            }

            setProgress(85);

            const doc = new Document({
                creator: "VedaWell Tools",
                sections: [{
                    properties: {
                        page: {
                            margin: { top: 720, right: 720, bottom: 720, left: 720 }, // 0.5" margins
                        },
                    },
                    children: children.length > 0
                        ? children
                        : [new Paragraph({ children: [new TextRun({ text: "No content could be extracted.", size: 24 })] })],
                }],
            });

            setProgress(90);
            setProgressLabel("Saving file…");

            // toBase64String is the officially documented browser-safe export method
            const base64 = await Packer.toBase64String(doc);
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

            const blob = new Blob([bytes], {
                type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });

            setProgress(100);

            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `${fileName}-converted.docx`;
            a.click();
            setDone(true);
        } catch (err) {
            setError(
                `Conversion failed: ${err instanceof Error ? err.message : String(err)}`
            );
        }
        setConverting(false);
        setProgressLabel("");
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
                                <div className="text-slate-400 text-sm">Converts to an editable Word (.docx) document</div>
                            </>
                        )}
                    </label>
                </div>

                {pdfData && (
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-900/30 space-y-5">
                        {/* Mode selector */}
                        <div>
                            <label className="block text-sm font-medium text-blue-300 mb-3">Conversion Mode</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setMode("images")}
                                    className={`p-4 rounded-xl border text-left transition-all ${mode === "images" ? "border-blue-500 bg-blue-900/30" : "border-slate-700 hover:border-slate-500"}`}
                                >
                                    <div className="text-white font-medium text-sm mb-1">🖼️ Layout Preserved</div>
                                    <div className="text-slate-400 text-xs">Each page rendered as an image — preserves all text, images, charts and layout exactly</div>
                                </button>
                                <button
                                    onClick={() => setMode("text")}
                                    className={`p-4 rounded-xl border text-left transition-all ${mode === "text" ? "border-blue-500 bg-blue-900/30" : "border-slate-700 hover:border-slate-500"}`}
                                >
                                    <div className="text-white font-medium text-sm mb-1">📄 Text Only</div>
                                    <div className="text-slate-400 text-xs">Extracts selectable text — fully editable but images are not included</div>
                                </button>
                            </div>
                        </div>

                        {converting && (
                            <div>
                                <div className="flex justify-between text-sm text-slate-400 mb-1">
                                    <span>{progressLabel}</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full">
                                    <div className="h-2 bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )}

                        {done && (
                            <div className="p-3 bg-green-900/30 border border-green-700/30 rounded-lg text-green-400 text-sm">
                                ✅ Done! Your .docx file has been downloaded.
                            </div>
                        )}

                        {error && <p className="text-red-400 text-sm">{error}</p>}

                        <button
                            onClick={convert}
                            disabled={converting}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors"
                        >
                            {converting
                                ? `Converting… ${progress}%`
                                : `📝 Convert ${pageCount} Page${pageCount !== 1 ? "s" : ""} to Word`}
                        </button>
                    </div>
                )}

                <ToolFAQ faqs={[
                    { question: "Which mode should I use?", answer: "'Layout Preserved' renders each page as an image inside Word — everything looks identical to the PDF including photos, charts, and formatting. 'Text Only' extracts text as editable paragraphs but images are not included." },
                    { question: "Can I edit the text in Layout Preserved mode?", answer: "No. In Layout Preserved mode each page is an image, so the text is not selectable or editable in Word. Use Text Only mode if you need to edit the content." },
                    { question: "Why is the Text Only output empty?", answer: "The PDF is likely scanned or image-based with no selectable text layer. Use Layout Preserved mode to get a visual copy, or use OCR software to extract text from scanned documents." },
                    { question: "Is this tool private?", answer: "Yes. All rendering and conversion happens in your browser using Mozilla PDF.js. Nothing is uploaded to any server." },
                ]} />

                <div className="my-6">
                    <AdBanner slot="4817652390" format="rectangle" />
                </div>
                <SupportBanner />
                <EmailCapture source="pdf-to-word" />
                <div className="mt-6 flex items-center justify-center">
                    <ShareButtons title="PDF to Word - VedaWell Tools" text="I just used the free PDF to Word converter on VedaWell! Check it out:" />
                </div>
                <JsonLd type="SoftwareApplication" data={{ name: "PDF to Word", description: "Convert PDF to Word document with images and layout preserved.", applicationCategory: "UtilityApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }} />
            </main>
        </div>
    );
}
