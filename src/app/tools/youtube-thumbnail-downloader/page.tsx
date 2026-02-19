"use client";

import { useState } from "react";
import Link from "next/link";

export default function YouTubeThumbnailDownloader() {
    const [url, setUrl] = useState("");
    const [videoId, setVideoId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const extractVideoId = (input: string): string | null => {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&?\s]+)/,
            /^([a-zA-Z0-9_-]{11})$/
        ];
        for (const pattern of patterns) {
            const match = input.match(pattern);
            if (match) return match[1];
        }
        return null;
    };

    const handleSubmit = () => {
        const id = extractVideoId(url);
        if (id) {
            setVideoId(id);
            setError(null);
        } else {
            setError("Invalid YouTube URL. Please enter a valid YouTube video URL.");
            setVideoId(null);
        }
    };

    const thumbnails = videoId ? [
        { name: "Max Resolution", url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`, size: "1280x720" },
        { name: "High Quality", url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, size: "480x360" },
        { name: "Medium Quality", url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`, size: "320x180" },
        { name: "Standard", url: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`, size: "640x480" },
        { name: "Default", url: `https://img.youtube.com/vi/${videoId}/default.jpg`, size: "120x90" },
    ] : [];

    const download = (imageUrl: string, name: string) => {
        window.open(imageUrl, "_blank");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-slate-900 to-slate-900">
            <nav className="border-b border-red-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-red-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">📺 YouTube Thumbnail Downloader</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-red-800/30 mb-6">
                    <label className="block text-sm text-red-300 mb-2">YouTube Video URL</label>
                    <div className="flex gap-2">
                        <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="flex-1 px-4 py-3 bg-slate-900 border border-red-700 rounded-lg text-white focus:outline-none" onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
                        <button onClick={handleSubmit} className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Get Thumbnails</button>
                    </div>
                    {error && <div className="mt-2 text-red-400 text-sm">{error}</div>}
                </div>
                {videoId && (
                    <div className="space-y-4">
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-red-800/30">
                            <div className="text-sm text-red-300 mb-2">Max Resolution Preview</div>
                            <img src={thumbnails[0].url} alt="Thumbnail" className="w-full rounded-lg" onError={(e) => (e.target as HTMLImageElement).src = thumbnails[1].url} />
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {thumbnails.map((thumb, i) => (
                                <div key={i} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                                    <img src={thumb.url} alt={thumb.name} className="w-full rounded-lg mb-2" />
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="text-white text-sm font-medium">{thumb.name}</div>
                                            <div className="text-slate-400 text-xs">{thumb.size}</div>
                                        </div>
                                        <button onClick={() => download(thumb.url, thumb.name)} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Download</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
