"use client";

import { useState } from "react";
import Link from "next/link";

export default function TaxCalculator() {
    const [income, setIncome] = useState("");
    const [country, setCountry] = useState("AU");

    const TAX_BRACKETS = {
        AU: [
            { min: 0, max: 18200, rate: 0, base: 0 },
            { min: 18201, max: 45000, rate: 0.19, base: 0 },
            { min: 45001, max: 120000, rate: 0.325, base: 5092 },
            { min: 120001, max: 180000, rate: 0.37, base: 29467 },
            { min: 180001, max: Infinity, rate: 0.45, base: 51667 },
        ],
        US: [
            { min: 0, max: 11600, rate: 0.10, base: 0 },
            { min: 11601, max: 47150, rate: 0.12, base: 1160 },
            { min: 47151, max: 100525, rate: 0.22, base: 5426 },
            { min: 100526, max: 191950, rate: 0.24, base: 17168 },
            { min: 191951, max: 243725, rate: 0.32, base: 39110 },
            { min: 243726, max: Infinity, rate: 0.35, base: 55678 },
        ],
    };

    const calculateTax = () => {
        const inc = parseFloat(income) || 0;
        const brackets = TAX_BRACKETS[country as keyof typeof TAX_BRACKETS];
        const bracket = brackets.find(b => inc >= b.min && inc <= b.max) || brackets[brackets.length - 1];
        const tax = bracket.base + (inc - bracket.min + 1) * bracket.rate;
        return { tax: Math.max(0, tax), effective: inc > 0 ? (tax / inc) * 100 : 0, net: inc - tax };
    };

    const result = calculateTax();

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-900 via-slate-900 to-slate-900">
            <nav className="border-b border-green-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-green-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">💰 Tax Calculator</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-green-800/30 mb-6">
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm text-green-300 mb-2">Annual Income</label>
                            <input type="number" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="Enter income" className="w-full px-4 py-3 bg-slate-900 border border-green-700 rounded-lg text-white text-xl focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm text-green-300 mb-2">Country</label>
                            <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-4 py-3 bg-slate-900 border border-green-700 rounded-lg text-white text-xl">
                                <option value="AU">🇦🇺 Australia</option>
                                <option value="US">🇺🇸 United States</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-red-800/30 text-center">
                        <div className="text-sm text-red-300 mb-2">Tax Payable</div>
                        <div className="text-3xl font-bold text-red-400">${result.tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-amber-800/30 text-center">
                        <div className="text-sm text-amber-300 mb-2">Effective Rate</div>
                        <div className="text-3xl font-bold text-amber-400">{result.effective.toFixed(1)}%</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-green-800/30 text-center">
                        <div className="text-sm text-green-300 mb-2">Net Income</div>
                        <div className="text-3xl font-bold text-green-400">${result.net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                </div>
                <div className="mt-6 text-center text-slate-500 text-sm">⚠️ This is a simplified estimate. Consult a tax professional for actual calculations.</div>
            </main>
        </div>
    );
}
