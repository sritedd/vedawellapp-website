"use client";

import { useState } from "react";
import Link from "next/link";

export default function MetaTagGenerator() {
    const [meta, setMeta] = useState({
        title: "My Website",
        description: "A great website description under 160 characters.",
        keywords: "website, keywords",
        author: "",
        themeColor: "#3b82f6",
        ogImage: "",
        ogUrl: "",
        twitterSite: "",
    });
    const [copied, setCopied] = useState(false);

    const updateMeta = (key: string, value: string) => {
        setMeta({ ...meta, [key]: value });
    };

    const generateCode = (): string => {
        return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${meta.title}</title>
<meta name="description" content="${meta.description}">
${meta.keywords ? `<meta name="keywords" content="${meta.keywords}">` : ""}
${meta.author ? `<meta name="author" content="${meta.author}">` : ""}
<meta name="theme-color" content="${meta.themeColor}">

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:title" content="${meta.title}">
<meta property="og:description" content="${meta.description}">
${meta.ogUrl ? `<meta property="og:url" content="${meta.ogUrl}">` : ""}
${meta.ogImage ? `<meta property="og:image" content="${meta.ogImage}">` : ""}

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${meta.title}">
<meta name="twitter:description" content="${meta.description}">
${meta.ogImage ? `<meta name="twitter:image" content="${meta.ogImage}">` : ""}
${meta.twitterSite ? `<meta name="twitter:site" content="${meta.twitterSite}">` : ""}`;
    };

    const copyCode = () => {
        navigator.clipboard.writeText(generateCode());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-900 via-slate-900 to-slate-900">
            <nav className="border-b border-teal-800/50 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/tools" className="text-teal-400 hover:text-white">← Back</Link>
                        <h1 className="text-xl font-bold text-white">🏷️ Meta Tag Generator</h1>
                    </div>
                    <button onClick={copyCode} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700">
                        {copied ? "✓ Copied!" : "Copy Code"}
                    </button>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto p-6 grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-teal-800/30">
                        <h2 className="text-lg font-medium text-white mb-4">Basic SEO</h2>
                        <div className="space-y-3">
                            <input type="text" value={meta.title} onChange={(e) => updateMeta("title", e.target.value)} placeholder="Page Title" className="w-full px-4 py-2 bg-slate-900 border border-teal-700 rounded-lg text-white" />
                            <textarea value={meta.description} onChange={(e) => updateMeta("description", e.target.value)} placeholder="Description" rows={3} className="w-full px-4 py-2 bg-slate-900 border border-teal-700 rounded-lg text-white resize-none" />
                            <input type="text" value={meta.keywords} onChange={(e) => updateMeta("keywords", e.target.value)} placeholder="Keywords" className="w-full px-4 py-2 bg-slate-900 border border-teal-700 rounded-lg text-white" />
                            <input type="text" value={meta.author} onChange={(e) => updateMeta("author", e.target.value)} placeholder="Author" className="w-full px-4 py-2 bg-slate-900 border border-teal-700 rounded-lg text-white" />
                            <input type="text" value={meta.ogImage} onChange={(e) => updateMeta("ogImage", e.target.value)} placeholder="OG Image URL" className="w-full px-4 py-2 bg-slate-900 border border-teal-700 rounded-lg text-white" />
                            <input type="text" value={meta.ogUrl} onChange={(e) => updateMeta("ogUrl", e.target.value)} placeholder="Page URL" className="w-full px-4 py-2 bg-slate-900 border border-teal-700 rounded-lg text-white" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-teal-800/30">
                        <h2 className="text-lg font-medium text-white mb-4">Preview</h2>
                        <div className="bg-white p-4 rounded-lg">
                            <div className="text-blue-800 text-lg">{meta.title}</div>
                            <div className="text-green-700 text-sm">{meta.ogUrl || "https://example.com"}</div>
                            <div className="text-slate-600 text-sm">{meta.description}</div>
                        </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-teal-800/30">
                        <h2 className="text-lg font-medium text-white mb-4">Generated HTML</h2>
                        <pre className="bg-slate-900 p-4 rounded-lg text-xs font-mono text-green-400 overflow-x-auto max-h-80 overflow-y-auto">{generateCode()}</pre>
                    </div>
                </div>
            </main>
        </div>
    );
}
