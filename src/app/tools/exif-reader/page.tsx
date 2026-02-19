"use client";

import { useState } from "react";
import Link from "next/link";

interface ExifData {
    [key: string]: string | number | undefined;
}

export default function EXIFReader() {
    const [image, setImage] = useState<string | null>(null);
    const [exif, setExif] = useState<ExifData | null>(null);
    const [loading, setLoading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const reader = new FileReader();
        reader.onload = async (ev) => {
            setImage(ev.target?.result as string);
            // Basic EXIF parsing from ArrayBuffer
            const buffer = await file.arrayBuffer();
            const parsed = parseBasicExif(buffer, file);
            setExif(parsed);
            setLoading(false);
        };
        reader.readAsDataURL(file);
    };

    const parseBasicExif = (buffer: ArrayBuffer, file: File): ExifData => {
        // Basic file info when EXIF not available
        const data: ExifData = {
            "File Name": file.name,
            "File Size": `${(file.size / 1024).toFixed(2)} KB`,
            "File Type": file.type,
            "Last Modified": new Date(file.lastModified).toLocaleString(),
        };

        // Try to find EXIF markers in JPEG
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

        // Create image to get dimensions
        const img = new window.Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            data["Width"] = `${img.width}px`;
            data["Height"] = `${img.height}px`;
            data["Aspect Ratio"] = `${(img.width / img.height).toFixed(2)}`;
        };

        return data;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-900">
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
