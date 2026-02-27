"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import ToolFAQ from "@/components/tools/ToolFAQ";
import AdBanner from "@/components/AdBanner";
import SupportBanner from "@/components/SupportBanner";
import EmailCapture from "@/components/EmailCapture";
import ShareButtons from "@/components/social/ShareButtons";
import JsonLd from "@/components/seo/JsonLd";

type Mode = "images" | "text";
type Quality = "low" | "medium" | "high";

const QUALITY_SCALE: Record<Quality, number> = { low: 1.0, medium: 1.5, high: 2.0 };
const QUALITY_LABEL: Record<Quality, string> = {
    low: "Low — smaller file, faster",
    medium: "Medium — balanced (recommended)",
    high: "High — large file, best clarity",
};

/** Parse a page range string like "1-3, 5, 7-9" into a sorted Set of 1-based page numbers */
function parsePageRange(input: string, total: number): number[] | null {
    if (!input.trim()) return null;
    const pages = new Set<number>();
    for (const part of input.split(",")) {
        const m = part.trim().match(/^(\d+)(?:-(\d+))?$/);
        if (!m) return null;
        const from = parseInt(m[1]);
        const to = m[2] ? parseInt(m[2]) : from;
        if (from < 1 || to > total || from > to) return null;
        for (let p = from; p <= to; p++) pages.add(p);
    }
    return [...pages].sort((a, b) => a - b);
}

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
    const [quality, setQuality] = useState<Quality>("medium");
    const [pageRange, setPageRange] = useState("");
    const [pageRangeError, setPageRangeError] = useState("");
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const loadFile = useCallback(async (file: File) => {
        if (file.type !== "application/pdf") {
            setError("Please upload a PDF file.");
            return;
        }
        setFileName(file.name.replace(/\.pdf$/i, ""));
        const ab = await file.arrayBuffer();
        const uint8 = new Uint8Array(ab);
        setPdfData(uint8);
        setError("");
        setProgress(0);
        setDone(false);
        setPageRange("");
        setPageRangeError("");

        try {
            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
            const pdf = await pdfjsLib.getDocument({ data: uint8.slice() }).promise;
            setPageCount(pdf.numPages);
        } catch {
            setError("Could not read PDF — it may be encrypted or corrupted.");
        }
    }, []);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) loadFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) loadFile(file);
    };

    /** Render selected pages to JPEG Uint8Arrays */
    const renderPages = async (
        pdf: Awaited<ReturnType<typeof import("pdfjs-dist")["getDocument"]>["promise"]>,
        scale: number,
        pages: number[]
    ): Promise<{ jpeg: Uint8Array; widthPx: number; heightPx: number }[]> => {
        const result = [];
        for (let idx = 0; idx < pages.length; idx++) {
            const pageNum = pages[idx];
            setProgressLabel(`Rendering page ${pageNum} of ${pdf.numPages}…`);
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(viewport.width);
            canvas.height = Math.round(viewport.height);
            const ctx = canvas.getContext("2d")!;
            await page.render({ canvasContext: ctx, viewport, canvas }).promise;
            const dataUrl = canvas.toDataURL("image/jpeg", quality === "high" ? 0.92 : quality === "medium" ? 0.85 : 0.75);
            const base64 = dataUrl.split(",")[1];
            const binary = atob(base64);
            const jpeg = new Uint8Array(binary.length);
            for (let b = 0; b < binary.length; b++) jpeg[b] = binary.charCodeAt(b);
            result.push({ jpeg, widthPx: canvas.width, heightPx: canvas.height });
            setProgress(Math.round(((idx + 1) / pages.length) * 60));
        }
        return result;
    };

    /** Extract text lines per page */
    const extractText = async (
        pdf: Awaited<ReturnType<typeof import("pdfjs-dist")["getDocument"]>["promise"]>,
        pages: number[]
    ): Promise<{ pageNum: number; lines: string[] }[]> => {
        const allPages = [];
        for (let idx = 0; idx < pages.length; idx++) {
            const pageNum = pages[idx];
            setProgressLabel(`Extracting text from page ${pageNum}…`);
            const page = await pdf.getPage(pageNum);
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
            allPages.push({ pageNum, lines });
            setProgress(Math.round(((idx + 1) / pages.length) * 60));
        }
        return allPages;
    };

    const convert = async () => {
        if (!pdfData) return;

        // Validate page range
        let pagesToConvert: number[] | null = null;
        if (pageRange.trim()) {
            pagesToConvert = parsePageRange(pageRange, pageCount);
            if (!pagesToConvert) {
                setPageRangeError(`Invalid range. Use formats like "1-3, 5, 7" (max page: ${pageCount})`);
                return;
            }
            setPageRangeError("");
        }

        setConverting(true);
        setError("");
        setProgress(0);
        setDone(false);

        try {
            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
            const pdf = await pdfjsLib.getDocument({ data: pdfData.slice() }).promise;

            const pages = pagesToConvert ?? Array.from({ length: pdf.numPages }, (_, i) => i + 1);
            const { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType } = await import("docx");

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const children: any[] = [];
            const scale = QUALITY_SCALE[quality];

            if (mode === "images") {
                const renderedPages = await renderPages(pdf, scale, pages);
                setProgressLabel("Building Word document…");
                setProgress(70);

                const MAX_WIDTH_PX = 624;
                for (let i = 0; i < renderedPages.length; i++) {
                    const { jpeg, widthPx, heightPx } = renderedPages[i];
                    const s = Math.min(1, MAX_WIDTH_PX / widthPx);
                    children.push(
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { before: i === 0 ? 0 : 400, after: 200 },
                            children: [
                                new ImageRun({
                                    data: jpeg,
                                    transformation: { width: Math.round(widthPx * s), height: Math.round(heightPx * s) },
                                    type: "jpg",
                                }),
                            ],
                        })
                    );
                }
            } else {
                const pageTexts = await extractText(pdf, pages);
                setProgressLabel("Building Word document…");
                setProgress(70);

                pageTexts.forEach(({ pageNum, lines }, i) => {
                    if (pages.length > 1) {
                        children.push(
                            new Paragraph({
                                text: `Page ${pageNum}`,
                                heading: HeadingLevel.HEADING_2,
                                spacing: { before: i === 0 ? 0 : 400, after: 160 },
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
                        page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } },
                    },
                    children: children.length > 0
                        ? children
                        : [new Paragraph({ children: [new TextRun({ text: "No content could be extracted.", size: 24 })] })],
                }],
            });

            setProgress(90);
            setProgressLabel("Saving file…");

            const base64 = await Packer.toBase64String(doc);
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

            const blob = new Blob([bytes], {
                type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });
            setProgress(100);

            const suffix = pagesToConvert ? `-p${pagesToConvert[0]}-${pagesToConvert[pagesToConvert.length - 1]}` : "";
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `${fileName}${suffix}-converted.docx`;
            a.click();
            setDone(true);
        } catch (err) {
            setError(`Conversion failed: ${err instanceof Error ? err.message : String(err)}`);
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
                {/* Upload — drag and drop */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-900/30">
                    <input type="file" accept=".pdf" onChange={handleUpload} className="hidden" id="pdf-upload" ref={inputRef} />
                    <label
                        htmlFor="pdf-upload"
                        className={`block p-10 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors group ${dragging ? "border-blue-400 bg-blue-900/20" : "border-blue-700/60 hover:bg-slate-700/30"}`}
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                    >
                        <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📄</div>
                        {pdfData ? (
                            <>
                                <div className="text-white font-medium">{fileName}.pdf</div>
                                <div className="text-blue-300 text-sm mt-1">{pageCount} pages — click or drop to replace</div>
                            </>
                        ) : (
                            <>
                                <div className="text-white font-medium mb-1">Drop a PDF here, or click to upload</div>
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

                        {/* Quality selector — only for image mode */}
                        {mode === "images" && (
                            <div>
                                <label className="block text-sm font-medium text-blue-300 mb-2">Image Quality</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(["low", "medium", "high"] as Quality[]).map((q) => (
                                        <button
                                            key={q}
                                            onClick={() => setQuality(q)}
                                            className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${quality === q ? "border-blue-500 bg-blue-900/30 text-white" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}
                                        >
                                            {q.charAt(0).toUpperCase() + q.slice(1)}
                                            <div className="text-slate-500 font-normal mt-0.5 text-xs">{q === "low" ? "smaller file" : q === "medium" ? "recommended" : "best clarity"}</div>
                                        </button>
                                    ))}
                                </div>
                                <p className="text-slate-500 text-xs mt-1">{QUALITY_LABEL[quality]}</p>
                            </div>
                        )}

                        {/* Page range */}
                        {pageCount > 1 && (
                            <div>
                                <label className="block text-sm font-medium text-blue-300 mb-1">
                                    Page Range <span className="text-slate-500 font-normal">(optional — leave blank for all {pageCount} pages)</span>
                                </label>
                                <input
                                    type="text"
                                    value={pageRange}
                                    onChange={(e) => { setPageRange(e.target.value); setPageRangeError(""); }}
                                    placeholder={`e.g. 1-3, 5, 7-${pageCount}`}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                />
                                {pageRangeError && <p className="text-red-400 text-xs mt-1">{pageRangeError}</p>}
                            </div>
                        )}

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
                                &#10003; Done! Your .docx file has been downloaded.
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
                                : `📝 Convert${pageRange.trim() ? " Selected Pages" : ` ${pageCount} Page${pageCount !== 1 ? "s" : ""}`} to Word`}
                        </button>
                    </div>
                )}

                <ToolFAQ faqs={[
                    { question: "Which mode should I use?", answer: "'Layout Preserved' renders each page as an image inside Word — everything looks identical to the PDF including photos, charts, and formatting. 'Text Only' extracts text as editable paragraphs but images are not included." },
                    { question: "Can I edit the text in Layout Preserved mode?", answer: "No. In Layout Preserved mode each page is an image, so the text is not selectable or editable in Word. Use Text Only mode if you need to edit the content." },
                    { question: "How do I convert only some pages?", answer: "After uploading, enter a page range in the 'Page Range' field (e.g. '1-3, 5, 7'). Leave it blank to convert all pages. The downloaded file name will include the page range." },
                    { question: "Which image quality should I choose?", answer: "Medium (1.5x scale) is recommended for most documents. High gives crisper text on complex diagrams but produces a larger .docx file. Low is fastest and suits simple text-heavy PDFs." },
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
