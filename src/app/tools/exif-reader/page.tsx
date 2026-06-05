"use client";

import { useState } from "react";
import Link from "next/link";
import { readAsDataURL, readAsArrayBuffer, loadImage, validateImageFile, friendlyError } from "@/lib/tools/safety";

interface ExifData {
    [key: string]: string | number | undefined;
}

export default function EXIFReader() {
    const [image, setImage] = useState<string | null>(null);
    const [exif, setExif] = useState<ExifData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError("");
        try {
            validateImageFile(file);
            const [dataUrl, buffer] = await Promise.all([
                readAsDataURL(file),
                readAsArrayBuffer(file),
            ]);
            setImage(dataUrl);

            // Synchronously parse known file metadata + EXIF marker hint
            const data = parseBasicExif(buffer, file);

            // Then read image dimensions via the safe loader. loadImage rejects
            // on bad images, so dimensions only land when we have a real picture.
            try {
                const img = await loadImage(dataUrl);
                data["Width"] = `${img.naturalWidth}px`;
                data["Height"] = `${img.naturalHeight}px`;
                if (img.naturalHeight > 0) {
                    data["Aspect Ratio"] = `${(img.naturalWidth / img.naturalHeight).toFixed(2)}`;
                }
            } catch {
                // Dimensions are best-effort — leave them out if the image can't render
            }

            setExif(data);
        } catch (err) {
            setError(friendlyError(err, "Could not read that image."));
            setExif(null);
            setImage(null);
        } finally {
            setLoading(false);
        }
        e.target.value = "";
    };

    const parseBasicExif = (buffer: ArrayBuffer, file: File): ExifData => {
        // Basic file info when EXIF not available
        const data: ExifData = {
            "File Name": file.name,
            "File Size": `${(file.size / 1024).toFixed(2)} KB`,
            "File Type": file.type || "unknown",
            "Last Modified": new Date(file.lastModified).toLocaleString(),
        };

        // Try to find EXIF markers in JPEG
        if (buffer.byteLength >= 4) {
            const view = new DataView(buffer);
            if (view.getUint16(0) === 0xFFD8) { // JPEG
                let offset = 2;
                while (offset < view.byteLength - 2) {
                    const marker = view.getUint16(offset);
                    if (marker === 0xFFE1) { // EXIF marker
                        data["EXIF Data"] = "Present";
                        break;
                    }
                    if ((marker & 0xFF00) !== 0xFF00) break;
                    offset += 2 + view.getUint16(offset + 2);
                }
            }
        }

        return data;
    };

    return (
        <div className="min-h-screen text-white bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-900">
            <nav className="border-b border-emerald-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-emerald-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">📷 EXIF Reader</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-emerald-800/30 mb-6">
                    <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id="upload" />
                    <label htmlFor="upload" className="block p-8 border-2 border-dashed border-emerald-700 rounded-lg text-center cursor-pointer hover:bg-slate-700/30">
                        <div className="text-4xl mb-2">📷</div>
                        <div className="text-white">Click to upload an image</div>
                        <div className="text-slate-400 text-sm mt-1">JPEG, PNG, HEIC, etc.</div>
                    </label>
                    {error && (
                        <p role="alert" className="mt-3 text-sm text-red-300 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2">{error}</p>
                    )}
                </div>
                {loading && <div className="text-center text-slate-400">Loading...</div>}
                {image && exif && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-emerald-800/30">
                            <img src={image} alt="Uploaded" className="w-full rounded-lg" />
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-emerald-800/30">
                            <h3 className="text-white font-medium mb-4">Image Information</h3>
                            <div className="space-y-2">
                                {Object.entries(exif).map(([key, value]) => (
                                    <div key={key} className="flex justify-between p-2 bg-slate-900 rounded">
                                        <span className="text-slate-400">{key}</span>
                                        <span className="text-white">{String(value)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 p-3 bg-amber-900/30 rounded-lg text-amber-300 text-sm">
                                ⚠️ Note: Full EXIF data (camera settings, GPS, etc.) requires a dedicated EXIF parsing library. This tool shows basic file metadata.
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
