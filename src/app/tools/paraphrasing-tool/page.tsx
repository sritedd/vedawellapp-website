"use client";

import { useState } from "react";
import Link from "next/link";

export default function ParaphrasingTool() {
    const [text, setText] = useState("");
    const [result, setResult] = useState("");
    const [mode, setMode] = useState<"standard" | "formal" | "simple" | "creative">("standard");
    const [copied, setCopied] = useState(false);

    const synonyms: Record<string, string[]> = {
        good: ["excellent", "great", "fine", "superb", "wonderful"],
        bad: ["poor", "terrible", "awful", "dreadful", "unpleasant"],
        big: ["large", "huge", "enormous", "massive", "substantial"],
        small: ["tiny", "little", "compact", "minute", "modest"],
        important: ["significant", "crucial", "vital", "essential", "key"],
        help: ["assist", "aid", "support", "facilitate", "enable"],
        make: ["create", "produce", "generate", "develop", "build"],
        use: ["utilize", "employ", "apply", "leverage", "implement"],
        show: ["demonstrate", "display", "reveal", "indicate", "present"],
        get: ["obtain", "acquire", "receive", "gain", "secure"],
        give: ["provide", "offer", "supply", "deliver", "present"],
        think: ["believe", "consider", "assume", "suppose", "reckon"],
        want: ["desire", "wish", "seek", "require", "need"],
        need: ["require", "demand", "necessitate", "call for", "want"],
        say: ["state", "mention", "declare", "express", "articulate"],
        many: ["numerous", "several", "multiple", "various", "countless"],
        very: ["extremely", "highly", "exceptionally", "remarkably", "greatly"],
        however: ["nevertheless", "nonetheless", "yet", "still", "though"],
        because: ["since", "as", "due to", "owing to", "given that"],
        also: ["additionally", "furthermore", "moreover", "besides", "too"],
    };

    const paraphrase = () => {
        if (!text.trim()) return;
        let output = text;

        // Replace synonyms
        Object.entries(synonyms).forEach(([word, replacements]) => {
            const regex = new RegExp(`\\b${word}\\b`, "gi");
            output = output.replace(regex, () => {
                const idx = mode === "creative" ? Math.floor(Math.random() * replacements.length) : 0;
                return replacements[idx];
            });
        });

        // Mode-specific transformations
        if (mode === "formal") {
            output = output.replace(/\bcan't\b/gi, "cannot");
            output = output.replace(/\bwon't\b/gi, "will not");
            output = output.replace(/\bdon't\b/gi, "do not");
            output = output.replace(/\bdoesn't\b/gi, "does not");
            output = output.replace(/\bi'm\b/gi, "I am");
            output = output.replace(/\bit's\b/gi, "it is");
            output = output.replace(/\bthat's\b/gi, "that is");
            output = output.replace(/\bkind of\b/gi, "somewhat");
            output = output.replace(/\ba lot of\b/gi, "numerous");
        } else if (mode === "simple") {
            output = output.replace(/\butilize\b/gi, "use");
            output = output.replace(/\bfacilitate\b/gi, "help");
            output = output.replace(/\bsubsequently\b/gi, "then");
            output = output.replace(/\bnevertheless\b/gi, "but");
            output = output.replace(/\bfurthermore\b/gi, "also");
        }

        setResult(output);
    };

    const copy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-900 via-slate-900 to-slate-900">
            <nav className="border-b border-teal-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-teal-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">🔄 Paraphrasing Tool</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-teal-800/30 mb-6 flex gap-2 flex-wrap">
                    {(["standard", "formal", "simple", "creative"] as const).map(m => (
                        <button key={m} onClick={() => setMode(m)} className={`px-4 py-2 rounded-lg capitalize ${mode === m ? "bg-teal-600 text-white" : "bg-slate-700 text-slate-300"}`}>{m}</button>
                    ))}
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-teal-800/30">
                        <label className="block text-sm text-teal-300 mb-2">Original Text</label>
                        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} placeholder="Enter text to paraphrase..." className="w-full px-4 py-3 bg-slate-900 border border-teal-700 rounded-lg text-white resize-none focus:outline-none" />
                        <button onClick={paraphrase} disabled={!text.trim()} className="w-full mt-4 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50">Paraphrase</button>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-teal-800/30">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm text-teal-300">Paraphrased Text</label>
                            <button onClick={copy} disabled={!result} className="text-xs text-teal-400 hover:text-white disabled:opacity-50">{copied ? "✓ Copied" : "Copy"}</button>
                        </div>
                        <div className="p-4 bg-slate-900 border border-teal-700 rounded-lg min-h-[300px] text-white whitespace-pre-wrap">{result || "Paraphrased text will appear here..."}</div>
                    </div>
                </div>
                <div className="mt-6 bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center text-slate-400 text-sm">
                    💡 This tool uses synonym replacement and style transformations. For AI-powered paraphrasing, consider using ChatGPT or similar services.
                </div>
            </main>
        </div>
    );
}
