"use client";

import { useState } from "react";
import Link from "next/link";

export default function FlexboxGenerator() {
    const [container, setContainer] = useState({
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "stretch",
        flexWrap: "nowrap",
        gap: "10px",
    });
    const [itemCount, setItemCount] = useState(4);
    const [copied, setCopied] = useState(false);

    const generateCSS = () => `.container {
  display: flex;
  flex-direction: ${container.flexDirection};
  justify-content: ${container.justifyContent};
  align-items: ${container.alignItems};
  flex-wrap: ${container.flexWrap};
  gap: ${container.gap};
}`;

    const copy = () => { navigator.clipboard.writeText(generateCSS()); setCopied(true); setTimeout(() => setCopied(false), 2000); };

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-900 via-slate-900 to-slate-900">
            <nav className="border-b border-cyan-800/50 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/tools" className="text-cyan-400 hover:text-white">← Back</Link>
                        <h1 className="text-xl font-bold text-white">📐 Flexbox Generator</h1>
                    </div>
                    <button onClick={copy} className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm">{copied ? "✓ Copied" : "Copy CSS"}</button>
                </div>
            </nav>
            <main className="max-w-6xl mx-auto p-6 grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-cyan-800/30 grid grid-cols-2 gap-4">
                        <div><label className="block text-xs text-cyan-300 mb-1">Direction</label><select value={container.flexDirection} onChange={(e) => setContainer({ ...container, flexDirection: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-cyan-700 rounded text-white text-sm"><option value="row">row</option><option value="row-reverse">row-reverse</option><option value="column">column</option><option value="column-reverse">column-reverse</option></select></div>
                        <div><label className="block text-xs text-cyan-300 mb-1">Justify Content</label><select value={container.justifyContent} onChange={(e) => setContainer({ ...container, justifyContent: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-cyan-700 rounded text-white text-sm"><option value="flex-start">flex-start</option><option value="flex-end">flex-end</option><option value="center">center</option><option value="space-between">space-between</option><option value="space-around">space-around</option><option value="space-evenly">space-evenly</option></select></div>
                        <div><label className="block text-xs text-cyan-300 mb-1">Align Items</label><select value={container.alignItems} onChange={(e) => setContainer({ ...container, alignItems: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-cyan-700 rounded text-white text-sm"><option value="stretch">stretch</option><option value="flex-start">flex-start</option><option value="flex-end">flex-end</option><option value="center">center</option><option value="baseline">baseline</option></select></div>
                        <div><label className="block text-xs text-cyan-300 mb-1">Wrap</label><select value={container.flexWrap} onChange={(e) => setContainer({ ...container, flexWrap: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-cyan-700 rounded text-white text-sm"><option value="nowrap">nowrap</option><option value="wrap">wrap</option><option value="wrap-reverse">wrap-reverse</option></select></div>
                        <div><label className="block text-xs text-cyan-300 mb-1">Gap</label><input type="text" value={container.gap} onChange={(e) => setContainer({ ...container, gap: e.target.value })} className="w-full px-3 py-2 bg-slate-900 border border-cyan-700 rounded text-white text-sm" /></div>
                        <div><label className="block text-xs text-cyan-300 mb-1">Items</label><input type="number" value={itemCount} onChange={(e) => setItemCount(Math.max(1, parseInt(e.target.value) || 1))} min="1" max="12" className="w-full px-3 py-2 bg-slate-900 border border-cyan-700 rounded text-white text-sm" /></div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-cyan-800/30">
                        <pre className="text-green-400 font-mono text-sm">{generateCSS()}</pre>
                    </div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6 border border-cyan-800/30">
                    <h3 className="text-white font-medium mb-4">Preview</h3>
                    <div className="bg-slate-900 p-4 rounded-lg min-h-[300px]" style={{ display: "flex", flexDirection: container.flexDirection as React.CSSProperties["flexDirection"], justifyContent: container.justifyContent, alignItems: container.alignItems, flexWrap: container.flexWrap as React.CSSProperties["flexWrap"], gap: container.gap }}>
                        {Array.from({ length: itemCount }).map((_, i) => (
                            <div key={i} className="bg-cyan-600 text-white rounded-lg p-4 min-w-[60px] text-center font-medium">{i + 1}</div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
