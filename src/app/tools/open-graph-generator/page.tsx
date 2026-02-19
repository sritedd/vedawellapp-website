"use client";

import { useState } from "react";
import Link from "next/link";

export default function OpenGraphGenerator() {
    const [og, setOg] = useState({
        title: "My Page Title",
        description: "A description of my webpage content.",
        url: "https://example.com/page",
        image: "https://example.com/image.jpg",
        siteName: "My Website",
        type: "website",
        locale: "en_US",
    });
    const [copied, setCopied] = useState(false);

    const generateTags = () => `<!-- Open Graph Meta Tags -->
<meta property="og:title" content="${og.title}" />
<meta property="og:description" content="${og.description}" />
<meta property="og:url" content="${og.url}" />
<meta property="og:image" content="${og.image}" />
<meta property="og:site_name" content="${og.siteName}" />
<meta property="og:type" content="${og.type}" />
<meta property="og:locale" content="${og.locale}" />`;

    const copy = () => { navigator.clipboard.writeText(generateTags()); setCopied(true); setTimeout(() => setCopied(false), 2000); };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-slate-900">
            <nav className="border-b border-blue-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/tools" className="text-blue-400 hover:text-white">← Back</Link>
                        <h1 className="text-xl font-bold text-white">📲 Open Graph Generator</h1>
                    </div>
                    <button onClick={copy} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">{copied ? "✓ Copied" : "Copy Tags"}</button>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6 grid md:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-800/30 space-y-4">
                    <div><label className="block text-sm text-blue-300 mb-1">Title</label><input type="text" value={og.title} onChange={(e) => setOg({ ...og, title: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-blue-700 rounded-lg text-white" /></div>
                    <div><label className="block text-sm text-blue-300 mb-1">Description</label><textarea value={og.description} onChange={(e) => setOg({ ...og, description: e.target.value })} rows={3} className="w-full px-4 py-2 bg-slate-900 border border-blue-700 rounded-lg text-white resize-none" /></div>
                    <div><label className="block text-sm text-blue-300 mb-1">URL</label><input type="text" value={og.url} onChange={(e) => setOg({ ...og, url: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-blue-700 rounded-lg text-white" /></div>
                    <div><label className="block text-sm text-blue-300 mb-1">Image URL</label><input type="text" value={og.image} onChange={(e) => setOg({ ...og, image: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-blue-700 rounded-lg text-white" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm text-blue-300 mb-1">Site Name</label><input type="text" value={og.siteName} onChange={(e) => setOg({ ...og, siteName: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-blue-700 rounded-lg text-white" /></div>
                        <div><label className="block text-sm text-blue-300 mb-1">Type</label><select value={og.type} onChange={(e) => setOg({ ...og, type: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-blue-700 rounded-lg text-white"><option value="website">website</option><option value="article">article</option><option value="product">product</option></select></div>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-800/30">
                        <h3 className="text-white font-medium mb-4">Facebook Preview</h3>
                        <div className="bg-white rounded-lg overflow-hidden">
                            <div className="h-32 bg-slate-200 flex items-center justify-center text-slate-400">📷 {og.image ? "Image" : "No Image"}</div>
                            <div className="p-3"><div className="text-xs text-gray-500 uppercase">{new URL(og.url || "https://example.com").hostname}</div><div className="font-medium text-gray-900">{og.title}</div><div className="text-sm text-gray-600 line-clamp-2">{og.description}</div></div>
                        </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-800/30">
                        <h3 className="text-white font-medium mb-4">Generated Tags</h3>
                        <pre className="p-4 bg-slate-900 rounded-lg text-green-400 font-mono text-xs overflow-auto">{generateTags()}</pre>
                    </div>
                </div>
            </main>
        </div>
    );
}
