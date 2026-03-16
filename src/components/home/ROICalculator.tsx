"use client";

import { useState } from "react";
import Link from "next/link";
import { Calculator, Shield, TrendingUp } from "lucide-react";

export default function ROICalculator() {
    const [buildValue, setBuildValue] = useState(500000);

    // Average defect cost is ~8-10% of build value for Australian homes
    const avgDefectCost = Math.round(buildValue * 0.085);
    const guardianCost = 14.99 * 12; // 12 months of Guardian Pro
    const roi = Math.round(avgDefectCost / guardianCost);
    const savings = avgDefectCost - guardianCost;

    const formatCurrency = (n: number) =>
        new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(n);

    return (
        <section className="py-20 px-6 bg-gradient-to-b from-slate-900 to-slate-800">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary-light text-sm font-medium mb-4">
                        <Calculator className="w-4 h-4" />
                        Defect Risk Calculator
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                        How much could a building defect cost you?
                    </h2>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Based on NSW Fair Trading data, 85% of new homes have defects averaging 8.5% of build value.
                    </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 sm:p-10">
                    {/* Slider */}
                    <div className="mb-10">
                        <label className="flex items-center justify-between mb-3">
                            <span className="text-slate-300 font-medium">Your build value</span>
                            <span className="text-3xl font-extrabold text-white">{formatCurrency(buildValue)}</span>
                        </label>
                        <input
                            type="range"
                            min={200000}
                            max={2000000}
                            step={50000}
                            value={buildValue}
                            onChange={(e) => setBuildValue(Number(e.target.value))}
                            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-700 accent-primary"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-2">
                            <span>$200K</span>
                            <span>$2M</span>
                        </div>
                    </div>

                    {/* Results grid */}
                    <div className="grid sm:grid-cols-3 gap-6 mb-8">
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 text-center">
                            <div className="text-sm text-red-400 font-medium mb-1">Average Defect Cost</div>
                            <div className="text-3xl font-extrabold text-red-400">{formatCurrency(avgDefectCost)}</div>
                            <div className="text-xs text-slate-500 mt-1">8.5% of build value</div>
                        </div>
                        <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 text-center">
                            <div className="text-sm text-primary-light font-medium mb-1">Guardian Pro (12 months)</div>
                            <div className="text-3xl font-extrabold text-primary-light">{formatCurrency(Math.round(guardianCost))}</div>
                            <div className="text-xs text-slate-500 mt-1">$14.99/month</div>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 text-center">
                            <div className="text-sm text-green-400 font-medium mb-1">Your Potential Savings</div>
                            <div className="text-3xl font-extrabold text-green-400">{formatCurrency(savings)}</div>
                            <div className="flex items-center justify-center gap-1 text-xs text-green-400 mt-1">
                                <TrendingUp className="w-3 h-3" />
                                {roi}x return on investment
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="text-center">
                        <Link
                            href="/guardian/login?view=sign-up"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-teal-500 text-white font-bold text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-[1.02] transition-all"
                        >
                            <Shield className="w-5 h-5" />
                            Start Free — Protect {formatCurrency(buildValue)}
                        </Link>
                        <p className="text-slate-500 text-sm mt-3">No credit card required. Free plan available.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
