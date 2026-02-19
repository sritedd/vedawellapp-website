"use client";

import { useState } from "react";
import Link from "next/link";

export default function SERPPreview() {
    const [title, setTitle] = useState("Your Page Title - Brand Name");
    const [url, setUrl] = useState("https://example.com/your-page-url");
    const [description, setDescription] = useState("This is your meta description. It should be between 150-160 characters to display fully in search results. Write compelling copy to increase click-through rates.");
    const [date, setDate] = useState("");

    const titleLength = title.length;
    const descLength = description.length;
    const isTitleOk = titleLength >= 30 && titleLength <= 60;
    const isDescOk = descLength >= 120 && descLength <= 160;

    const truncate = (text: string, max: number) => text.length > max ? text.slice(0, max) + "..." : text;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-slate-900">
            <nav className="border-b border-blue-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-blue-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">🔍 SERP Preview Tool</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-800/30">
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm text-blue-300">Title Tag</label>
                                    <span className={`text-xs ${isTitleOk ? "text-green-400" : "text-amber-400"}`}>{titleLength}/60</span>
                                </div>
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={70} className="w-full px-4 py-2 bg-slate-900 border border-blue-700 rounded-lg text-white" />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm text-blue-300 mb-2">URL</label>
                                <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full px-4 py-2 bg-slate-900 border border-blue-700 rounded-lg text-white" />
                            </div>
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm text-blue-300">Meta Description</label>
                                    <span className={`text-xs ${isDescOk ? "text-green-400" : "text-amber-400"}`}>{descLength}/160</span>
                                </div>
                                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={170} className="w-full px-4 py-2 bg-slate-900 border border-blue-700 rounded-lg text-white resize-none" />
                            </div>
                            <div>
                                <label className="block text-sm text-blue-300 mb-2">Published Date (optional)</label>
                                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-2 bg-slate-900 border border-blue-700 rounded-lg text-white" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-white rounded-xl p-6">
                            <div className="text-sm text-gray-600 mb-4">Google Search Preview</div>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm text-green-700 mb-1">{url.replace(/^https?:\/\//, "")}</div>
                                    <div className="text-xl text-blue-800 hover:underline cursor-pointer mb-1">{truncate(title, 60)}</div>
                                    <div className="text-sm text-gray-600">
                                        {date && <span className="text-gray-500">{new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} — </span>}
                                        {truncate(description, 160)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                            <div className="text-sm font-medium text-white mb-2">SEO Tips</div>
                            <ul className="text-sm text-slate-400 space-y-1">
                                <li className={isTitleOk ? "text-green-400" : ""}>✓ Title: 30-60 characters</li>
                                <li className={isDescOk ? "text-green-400" : ""}>✓ Description: 120-160 characters</li>
                                <li>✓ Include primary keyword in title</li>
                                <li>✓ Write compelling, action-oriented copy</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
