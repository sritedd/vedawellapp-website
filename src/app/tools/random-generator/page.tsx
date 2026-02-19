"use client";

import { useState } from "react";
import Link from "next/link";

export default function RandomGenerator() {
    const [mode, setMode] = useState<"number" | "name" | "team" | "picker">("number");

    // Number generator
    const [min, setMin] = useState(1);
    const [max, setMax] = useState(100);
    const [randomNumber, setRandomNumber] = useState<number | null>(null);

    // Name picker
    const [names, setNames] = useState("Alice\nBob\nCharlie\nDiana\nEve");
    const [pickedName, setPickedName] = useState<string | null>(null);

    // Team generator
    const [teamCount, setTeamCount] = useState(2);
    const [teams, setTeams] = useState<string[][]>([]);

    // List picker
    const [items, setItems] = useState("Option 1\nOption 2\nOption 3");
    const [pickedItem, setPickedItem] = useState<string | null>(null);

    const generateNumber = () => setRandomNumber(Math.floor(Math.random() * (max - min + 1)) + min);

    const pickName = () => {
        const nameList = names.split("\n").filter(n => n.trim());
        if (nameList.length) setPickedName(nameList[Math.floor(Math.random() * nameList.length)]);
    };

    const generateTeams = () => {
        const nameList = names.split("\n").filter(n => n.trim());
        const shuffled = [...nameList].sort(() => Math.random() - 0.5);
        const result: string[][] = Array.from({ length: teamCount }, () => []);
        shuffled.forEach((name, i) => result[i % teamCount].push(name));
        setTeams(result);
    };

    const pickItem = () => {
        const itemList = items.split("\n").filter(n => n.trim());
        if (itemList.length) setPickedItem(itemList[Math.floor(Math.random() * itemList.length)]);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-slate-900">
            <nav className="border-b border-purple-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-md mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-purple-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">🎲 Random Generator</h1>
                </div>
            </nav>
            <main className="max-w-md mx-auto p-6">
                <div className="bg-slate-800/50 rounded-xl p-2 border border-purple-800/30 mb-6 flex">
                    {(["number", "name", "team", "picker"] as const).map(m => (
                        <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg text-sm capitalize ${mode === m ? "bg-purple-600 text-white" : "text-slate-400"}`}>{m === "picker" ? "List" : m}</button>
                    ))}
                </div>

                {mode === "number" && (
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-800/30 text-center">
                        <div className="text-6xl font-bold text-purple-400 mb-6">{randomNumber ?? "?"}</div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div><label className="block text-xs text-purple-300 mb-1">Min</label><input type="number" value={min} onChange={(e) => setMin(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-900 border border-purple-700 rounded text-white text-center" /></div>
                            <div><label className="block text-xs text-purple-300 mb-1">Max</label><input type="number" value={max} onChange={(e) => setMax(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-900 border border-purple-700 rounded text-white text-center" /></div>
                        </div>
                        <button onClick={generateNumber} className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium">Generate</button>
                    </div>
                )}

                {mode === "name" && (
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-800/30">
                        {pickedName && <div className="text-center text-4xl font-bold text-purple-400 mb-4 py-4">{pickedName}</div>}
                        <textarea value={names} onChange={(e) => setNames(e.target.value)} rows={6} placeholder="Enter names (one per line)" className="w-full px-4 py-2 bg-slate-900 border border-purple-700 rounded-lg text-white mb-4" />
                        <button onClick={pickName} className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium">Pick Random Name</button>
                    </div>
                )}

                {mode === "team" && (
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-800/30">
                        <textarea value={names} onChange={(e) => setNames(e.target.value)} rows={5} placeholder="Enter names (one per line)" className="w-full px-4 py-2 bg-slate-900 border border-purple-700 rounded-lg text-white mb-4" />
                        <div className="flex gap-2 mb-4">
                            <span className="text-purple-300 text-sm py-2">Teams:</span>
                            {[2, 3, 4, 5].map(n => (
                                <button key={n} onClick={() => setTeamCount(n)} className={`px-4 py-2 rounded-lg ${teamCount === n ? "bg-purple-600 text-white" : "bg-slate-700 text-slate-300"}`}>{n}</button>
                            ))}
                        </div>
                        <button onClick={generateTeams} className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium mb-4">Generate Teams</button>
                        {teams.length > 0 && (
                            <div className="grid grid-cols-2 gap-2">
                                {teams.map((team, i) => (
                                    <div key={i} className="bg-slate-900 p-3 rounded-lg">
                                        <div className="text-purple-400 text-sm font-medium mb-1">Team {i + 1}</div>
                                        {team.map((n, j) => <div key={j} className="text-white text-sm">{n}</div>)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {mode === "picker" && (
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-800/30">
                        {pickedItem && <div className="text-center text-3xl font-bold text-purple-400 mb-4 py-4">{pickedItem}</div>}
                        <textarea value={items} onChange={(e) => setItems(e.target.value)} rows={6} placeholder="Enter options (one per line)" className="w-full px-4 py-2 bg-slate-900 border border-purple-700 rounded-lg text-white mb-4" />
                        <button onClick={pickItem} className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium">Pick Random Item</button>
                    </div>
                )}
            </main>
        </div>
    );
}
