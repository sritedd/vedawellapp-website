"use client";

import { useState } from "react";
import Link from "next/link";

export default function RobotsTxtGenerator() {
    const [userAgent, setUserAgent] = useState("*");
    const [rules, setRules] = useState<{ type: "allow" | "disallow"; path: string }[]>([{ type: "allow", path: "/" }]);
    const [sitemap, setSitemap] = useState("");
    const [crawlDelay, setCrawlDelay] = useState("");
    const [copied, setCopied] = useState(false);

    const addRule = () => setRules([...rules, { type: "disallow", path: "/" }]);
    const removeRule = (i: number) => setRules(rules.filter((_, idx) => idx !== i));
    const updateRule = (i: number, field: "type" | "path", value: string) => { const updated = [...rules]; updated[i] = { ...updated[i], [field]: value }; setRules(updated); };

    const generate = () => {
        let txt = `User-agent: ${userAgent}\n`;
        rules.forEach(r => { txt += `${r.type === "allow" ? "Allow" : "Disallow"}: ${r.path}\n`; });
        if (crawlDelay) txt += `Crawl-delay: ${crawlDelay}\n`;
        if (sitemap) txt += `\nSitemap: ${sitemap}`;
        return txt;
    };

    const copy = () => { navigator.clipboard.writeText(generate()); setCopied(true); setTimeout(() => setCopied(false), 2000); };

    const presets = {
        allowAll: () => { setRules([{ type: "allow", path: "/" }]); },
        blockAll: () => { setRules([{ type: "disallow", path: "/" }]); },
        blockAdmin: () => { setRules([{ type: "allow", path: "/" }, { type: "disallow", path: "/admin/" }, { type: "disallow", path: "/api/" }]); },
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-slate-900">
            <nav className="border-b border-gray-700 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/tools" className="text-gray-400 hover:text-white">← Back</Link>
                        <h1 className="text-xl font-bold text-white">🤖 Robots.txt Generator</h1>
                    </div>
                    <button onClick={copy} className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm">{copied ? "✓ Copied" : "Copy"}</button>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6 grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <button onClick={presets.allowAll} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Allow All</button>
                        <button onClick={presets.blockAll} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Block All</button>
                        <button onClick={presets.blockAdmin} className="px-3 py-1 bg-amber-600 text-white rounded text-sm">Block Admin</button>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-gray-700">
                        <div className="mb-4"><label className="block text-sm text-gray-400 mb-1">User-Agent</label><input type="text" value={userAgent} onChange={(e) => setUserAgent(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-gray-600 rounded text-white" /></div>
                        <div className="mb-4"><label className="block text-sm text-gray-400 mb-2">Rules</label>
                            {rules.map((rule, i) => (
                                <div key={i} className="flex gap-2 mb-2">
                                    <select value={rule.type} onChange={(e) => updateRule(i, "type", e.target.value)} className="px-3 py-2 bg-slate-900 border border-gray-600 rounded text-white text-sm"><option value="allow">Allow</option><option value="disallow">Disallow</option></select>
                                    <input type="text" value={rule.path} onChange={(e) => updateRule(i, "path", e.target.value)} placeholder="/path" className="flex-1 px-3 py-2 bg-slate-900 border border-gray-600 rounded text-white text-sm" />
                                    <button onClick={() => removeRule(i)} className="text-red-400 hover:text-red-300">✕</button>
                                </div>
                            ))}
                            <button onClick={addRule} className="text-sm text-gray-400 hover:text-white">+ Add Rule</button>
                        </div>
                        <div className="mb-4"><label className="block text-sm text-gray-400 mb-1">Crawl Delay (optional)</label><input type="number" value={crawlDelay} onChange={(e) => setCrawlDelay(e.target.value)} placeholder="10" className="w-full px-3 py-2 bg-slate-900 border border-gray-600 rounded text-white" /></div>
                        <div><label className="block text-sm text-gray-400 mb-1">Sitemap URL (optional)</label><input type="text" value={sitemap} onChange={(e) => setSitemap(e.target.value)} placeholder="https://example.com/sitemap.xml" className="w-full px-3 py-2 bg-slate-900 border border-gray-600 rounded text-white" /></div>
                    </div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-white font-medium mb-4">Generated robots.txt</h3>
                    <pre className="bg-slate-900 p-4 rounded-lg text-green-400 font-mono text-sm whitespace-pre-wrap">{generate()}</pre>
                </div>
            </main>
        </div>
    );
}
