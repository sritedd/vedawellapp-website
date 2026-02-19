"use client";

import { useState } from "react";
import Link from "next/link";

export default function CompoundInterestCalculator() {
    const [principal, setPrincipal] = useState(10000);
    const [rate, setRate] = useState(7);
    const [years, setYears] = useState(10);
    const [compound, setCompound] = useState(12); // times per year
    const [monthlyContrib, setMonthlyContrib] = useState(100);

    // A = P(1 + r/n)^(nt) + PMT * (((1 + r/n)^(nt) - 1) / (r/n))
    const r = rate / 100;
    const n = compound;
    const t = years;

    const compoundFactor = Math.pow(1 + r / n, n * t);
    const principalFuture = principal * compoundFactor;
    const contributionFuture = monthlyContrib * 12 / n * ((compoundFactor - 1) / (r / n));
    const totalFuture = principalFuture + (r > 0 ? contributionFuture : monthlyContrib * 12 * t);
    const totalContributions = principal + monthlyContrib * 12 * t;
    const totalInterest = totalFuture - totalContributions;

    const formatCurrency = (n: number) => "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Generate chart data
    const chartData = Array.from({ length: years + 1 }, (_, year) => {
        const cf = Math.pow(1 + r / n, n * year);
        const pf = principal * cf;
        const contribF = monthlyContrib * 12 / n * ((cf - 1) / (r / n));
        return { year, value: pf + (r > 0 ? contribF : monthlyContrib * 12 * year) };
    });
    const maxValue = Math.max(...chartData.map(d => d.value));

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-900">
            <nav className="border-b border-emerald-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-emerald-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">📈 Compound Interest Calculator</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-emerald-800/30 space-y-4">
                        <div>
                            <label className="block text-sm text-emerald-300 mb-2">Initial Investment</label>
                            <input type="number" value={principal} onChange={(e) => setPrincipal(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 bg-slate-900 border border-emerald-700 rounded-lg text-white text-lg" />
                        </div>
                        <div>
                            <label className="block text-sm text-emerald-300 mb-2">Monthly Contribution</label>
                            <input type="number" value={monthlyContrib} onChange={(e) => setMonthlyContrib(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 bg-slate-900 border border-emerald-700 rounded-lg text-white text-lg" />
                        </div>
                        <div>
                            <label className="block text-sm text-emerald-300 mb-2">Annual Interest Rate: {rate}%</label>
                            <input type="range" value={rate} onChange={(e) => setRate(parseFloat(e.target.value))} min="0" max="20" step="0.1" className="w-full" />
                        </div>
                        <div>
                            <label className="block text-sm text-emerald-300 mb-2">Years: {years}</label>
                            <input type="range" value={years} onChange={(e) => setYears(parseInt(e.target.value))} min="1" max="50" className="w-full" />
                        </div>
                        <div>
                            <label className="block text-sm text-emerald-300 mb-2">Compound Frequency</label>
                            <select value={compound} onChange={(e) => setCompound(parseInt(e.target.value))} className="w-full px-4 py-2 bg-slate-900 border border-emerald-700 rounded-lg text-white">
                                <option value="1">Annually</option>
                                <option value="4">Quarterly</option>
                                <option value="12">Monthly</option>
                                <option value="365">Daily</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-emerald-800/30 text-center">
                            <div className="text-sm text-slate-400 mb-1">Future Value</div>
                            <div className="text-4xl font-bold text-emerald-400">{formatCurrency(totalFuture)}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
                                <div className="text-xs text-slate-400">Total Contributions</div>
                                <div className="text-xl font-bold text-white">{formatCurrency(totalContributions)}</div>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-green-800/30 text-center">
                                <div className="text-xs text-slate-400">Interest Earned</div>
                                <div className="text-xl font-bold text-green-400">{formatCurrency(totalInterest)}</div>
                            </div>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                            <div className="text-sm text-slate-400 mb-2">Growth Over Time</div>
                            <div className="flex items-end gap-1 h-32">
                                {chartData.map((d, i) => (
                                    <div key={i} className="flex-1 bg-emerald-600 rounded-t" style={{ height: `${(d.value / maxValue) * 100}%` }} title={`Year ${d.year}: ${formatCurrency(d.value)}`} />
                                ))}
                            </div>
                            <div className="flex justify-between text-xs text-slate-500 mt-1">
                                <span>Year 0</span>
                                <span>Year {years}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
