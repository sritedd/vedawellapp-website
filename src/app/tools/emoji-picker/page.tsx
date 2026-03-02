"use client";

import { useState } from "react";
import Link from "next/link";

const EMOJI_CATEGORIES: Record<string, string[]> = {
    "Smileys": ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "😮‍💨", "🤥"],
    "Gestures": ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🙏"],
    "Hearts": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "❤️‍🔥", "❤️‍🩹"],
    "Animals": ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋"],
    "Food": ["🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🌶️", "🌽", "🥕", "🧄", "🧅", "🥔", "🍠", "🥐", "🍕"],
    "Activities": ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛼", "🎿"],
    "Objects": ["⌚", "📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "💽", "💾", "💿", "📀", "📼", "📷", "📸", "📹", "🎥", "📽️", "🎬", "📺", "📻", "🎙️", "🎚️", "🎛️", "⏱️", "⏲️", "⏰", "🕰️", "📡", "🔋"],
    "Symbols": ["❤️", "💯", "💢", "💥", "💫", "💦", "💨", "🕳️", "💬", "👁️‍🗨️", "🗨️", "🗯️", "💭", "💤", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "🟤", "⚫", "⚪", "🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "⬛"],
};

export default function EmojiPicker() {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("Smileys");
    const [copied, setCopied] = useState<string | null>(null);
    const [recent, setRecent] = useState<string[]>([]);

    const copy = (emoji: string) => {
        navigator.clipboard.writeText(emoji);
        setCopied(emoji);
        setTimeout(() => setCopied(null), 1000);
        setRecent(prev => [emoji, ...prev.filter(e => e !== emoji)].slice(0, 20));
    };

    const allEmojis = Object.values(EMOJI_CATEGORIES).flat();
    const filtered = search ? allEmojis.filter(() => true) : EMOJI_CATEGORIES[category];

    return (
        <div className="min-h-screen text-white bg-gradient-to-br from-yellow-800 via-slate-900 to-slate-900">
            <nav className="border-b border-yellow-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-yellow-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">😊 Emoji Picker</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-yellow-800/30 mb-6">
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search emojis..." className="w-full px-4 py-3 bg-slate-900 border border-yellow-700 rounded-lg text-white mb-4" />
                    <div className="flex gap-2 flex-wrap">
                        {Object.keys(EMOJI_CATEGORIES).map(cat => (
                            <button key={cat} onClick={() => { setCategory(cat); setSearch(""); }} className={`px-3 py-1 rounded-full text-sm ${category === cat && !search ? "bg-yellow-600 text-white" : "bg-slate-700 text-slate-300"}`}>{cat}</button>
                        ))}
                    </div>
                </div>
                {recent.length > 0 && (
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 mb-4">
                        <div className="text-xs text-slate-400 mb-2">Recent</div>
                        <div className="flex gap-1 flex-wrap">
                            {recent.map((emoji, i) => (
                                <button key={i} onClick={() => copy(emoji)} className="text-2xl p-1 hover:bg-slate-700 rounded">{emoji}</button>
                            ))}
                        </div>
                    </div>
                )}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-yellow-800/30">
                    <div className="grid grid-cols-8 md:grid-cols-12 gap-1">
                        {filtered.map((emoji, i) => (
                            <button key={i} onClick={() => copy(emoji)} className={`text-2xl p-2 rounded hover:bg-slate-700 ${copied === emoji ? "bg-yellow-600" : ""}`} title="Click to copy">{emoji}</button>
                        ))}
                    </div>
                </div>
                {copied && <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">Copied {copied}!</div>}
            </main>
        </div>
    );
}
