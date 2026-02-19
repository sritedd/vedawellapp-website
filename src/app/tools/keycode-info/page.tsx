"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function KeycodeInfo() {
    const [key, setKey] = useState<KeyboardEvent | null>(null);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { e.preventDefault(); setKey(e); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-900 via-slate-900 to-slate-900">
            <nav className="border-b border-cyan-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-cyan-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">⌨️ Keycode Info</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6 text-center">
                <div className="bg-slate-800/50 rounded-2xl p-12 border border-cyan-800/30 mb-6">
                    {key ? (
                        <>
                            <div className="text-8xl font-mono font-bold text-white mb-4">{key.key === " " ? "Space" : key.key}</div>
                            <div className="text-6xl font-mono text-cyan-400 mb-8">{key.keyCode}</div>
                            <div className="flex justify-center gap-4 flex-wrap">
                                {[["key", key.key], ["code", key.code], ["keyCode", key.keyCode], ["which", key.which], ["location", key.location]].map(([label, value]) => (
                                    <div key={label as string} className="bg-slate-900 px-4 py-2 rounded-lg">
                                        <div className="text-slate-400 text-xs">{label as string}</div>
                                        <div className="text-white font-mono">{String(value)}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-center gap-4 mt-6">
                                {key.ctrlKey && <span className="px-3 py-1 bg-cyan-600 rounded text-white text-sm">Ctrl</span>}
                                {key.altKey && <span className="px-3 py-1 bg-cyan-600 rounded text-white text-sm">Alt</span>}
                                {key.shiftKey && <span className="px-3 py-1 bg-cyan-600 rounded text-white text-sm">Shift</span>}
                                {key.metaKey && <span className="px-3 py-1 bg-cyan-600 rounded text-white text-sm">Meta</span>}
                            </div>
                        </>
                    ) : (
                        <div className="text-slate-400 text-2xl">Press any key...</div>
                    )}
                </div>
            </main>
        </div>
    );
}
