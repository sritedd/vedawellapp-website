"use client";

import { useState } from "react";
import Link from "next/link";

export default function DateCalculator() {
    const [date1, setDate1] = useState(new Date().toISOString().split("T")[0]);
    const [date2, setDate2] = useState(new Date().toISOString().split("T")[0]);
    const [addDays, setAddDays] = useState(0);
    const [addMonths, setAddMonths] = useState(0);
    const [addYears, setAddYears] = useState(0);

    const calculateDiff = () => {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffMs = Math.abs(d2.getTime() - d1.getTime());
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30.44);
        const years = Math.floor(days / 365.25);
        return { days, weeks, months, years };
    };

    const calculateAdd = () => {
        const d = new Date(date1);
        d.setFullYear(d.getFullYear() + addYears);
        d.setMonth(d.getMonth() + addMonths);
        d.setDate(d.getDate() + addDays);
        return d.toLocaleDateString("en-AU", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    };

    const diff = calculateDiff();

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-900 via-slate-900 to-slate-900">
            <nav className="border-b border-amber-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-amber-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">📅 Date Calculator</h1>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto p-6 grid md:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-amber-800/30">
                    <h2 className="text-lg font-medium text-white mb-4">Date Difference</h2>
                    <div className="space-y-4">
                        <div><label className="block text-sm text-amber-300 mb-1">From</label><input type="date" value={date1} onChange={(e) => setDate1(e.target.value)} className="w-full px-4 py-2 bg-slate-900 border border-amber-700 rounded-lg text-white" /></div>
                        <div><label className="block text-sm text-amber-300 mb-1">To</label><input type="date" value={date2} onChange={(e) => setDate2(e.target.value)} className="w-full px-4 py-2 bg-slate-900 border border-amber-700 rounded-lg text-white" /></div>
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-4">
                        <div className="bg-slate-900 p-4 rounded-lg text-center"><div className="text-2xl font-bold text-amber-400">{diff.days}</div><div className="text-sm text-slate-400">Days</div></div>
                        <div className="bg-slate-900 p-4 rounded-lg text-center"><div className="text-2xl font-bold text-amber-400">{diff.weeks}</div><div className="text-sm text-slate-400">Weeks</div></div>
                        <div className="bg-slate-900 p-4 rounded-lg text-center"><div className="text-2xl font-bold text-amber-400">{diff.months}</div><div className="text-sm text-slate-400">Months</div></div>
                        <div className="bg-slate-900 p-4 rounded-lg text-center"><div className="text-2xl font-bold text-amber-400">{diff.years}</div><div className="text-sm text-slate-400">Years</div></div>
                    </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6 border border-amber-800/30">
                    <h2 className="text-lg font-medium text-white mb-4">Add/Subtract</h2>
                    <div className="space-y-4">
                        <div><label className="block text-sm text-amber-300 mb-1">Days</label><input type="number" value={addDays} onChange={(e) => setAddDays(parseInt(e.target.value) || 0)} className="w-full px-4 py-2 bg-slate-900 border border-amber-700 rounded-lg text-white" /></div>
                        <div><label className="block text-sm text-amber-300 mb-1">Months</label><input type="number" value={addMonths} onChange={(e) => setAddMonths(parseInt(e.target.value) || 0)} className="w-full px-4 py-2 bg-slate-900 border border-amber-700 rounded-lg text-white" /></div>
                        <div><label className="block text-sm text-amber-300 mb-1">Years</label><input type="number" value={addYears} onChange={(e) => setAddYears(parseInt(e.target.value) || 0)} className="w-full px-4 py-2 bg-slate-900 border border-amber-700 rounded-lg text-white" /></div>
                    </div>
                    <div className="mt-6 bg-slate-900 p-4 rounded-lg text-center">
                        <div className="text-sm text-slate-400 mb-2">Result Date</div>
                        <div className="text-lg font-bold text-amber-400">{calculateAdd()}</div>
                    </div>
                </div>
            </main>
        </div>
    );
}
