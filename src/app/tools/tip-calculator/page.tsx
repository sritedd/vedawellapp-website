"use client";

import { useState } from "react";
import Link from "next/link";

export default function TipCalculator() {
    const [billAmount, setBillAmount] = useState("");
    const [tipPercent, setTipPercent] = useState(15);
    const [numPeople, setNumPeople] = useState(1);
    const [customTip, setCustomTip] = useState("");

    const bill = parseFloat(billAmount) || 0;
    const tip = customTip ? parseFloat(customTip) : tipPercent;
    const tipAmount = bill * (tip / 100);
    const total = bill + tipAmount;
    const perPerson = total / numPeople;
    const tipPerPerson = tipAmount / numPeople;

    const presetTips = [10, 15, 18, 20, 25];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-AU", {
            style: "currency",
            currency: "AUD",
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
            {/* Header */}
            <nav className="border-b border-border bg-white/80 backdrop-blur">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold">
                        <span>🛠️</span>
                        <span>VedaWell Tools</span>
                    </Link>
                    <Link href="/tools" className="text-gray-600 hover:text-gray-900">
                        ← All Tools
                    </Link>
                </div>
            </nav>

            <main className="py-12 px-6">
                <div className="max-w-md mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h1 className="text-3xl font-bold mb-2 text-center">💰 Tip Calculator</h1>
                        <p className="text-gray-500 text-center mb-8">
                            Calculate tips and split bills easily
                        </p>

                        {/* Bill Amount */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Bill Amount
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                <input
                                    type="number"
                                    value={billAmount}
                                    onChange={(e) => setBillAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none text-lg"
                                />
                            </div>
                        </div>

                        {/* Tip Percentage */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tip Percentage
                            </label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {presetTips.map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => {
                                            setTipPercent(t);
                                            setCustomTip("");
                                        }}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${tipPercent === t && !customTip
                                                ? "bg-green-500 text-white"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                    >
                                        {t}%
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">Custom:</span>
                                <input
                                    type="number"
                                    value={customTip}
                                    onChange={(e) => setCustomTip(e.target.value)}
                                    placeholder="0"
                                    className="w-20 px-3 py-2 rounded-lg border border-gray-200 focus:border-green-500 outline-none"
                                />
                                <span className="text-gray-500">%</span>
                            </div>
                        </div>

                        {/* Number of People */}
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Number of People
                            </label>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setNumPeople(Math.max(1, numPeople - 1))}
                                    className="w-12 h-12 rounded-full bg-gray-100 text-xl font-bold hover:bg-gray-200"
                                >
                                    −
                                </button>
                                <span className="text-2xl font-bold w-12 text-center">{numPeople}</span>
                                <button
                                    onClick={() => setNumPeople(numPeople + 1)}
                                    className="w-12 h-12 rounded-full bg-gray-100 text-xl font-bold hover:bg-gray-200"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Results */}
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <div className="text-sm opacity-80">Tip Amount</div>
                                    <div className="text-2xl font-bold">{formatCurrency(tipAmount)}</div>
                                </div>
                                <div>
                                    <div className="text-sm opacity-80">Total</div>
                                    <div className="text-2xl font-bold">{formatCurrency(total)}</div>
                                </div>
                            </div>

                            {numPeople > 1 && (
                                <div className="pt-4 border-t border-white/20">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm opacity-80">Tip per Person</div>
                                            <div className="text-xl font-bold">{formatCurrency(tipPerPerson)}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm opacity-80">Total per Person</div>
                                            <div className="text-xl font-bold">{formatCurrency(perPerson)}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Reset */}
                        <button
                            onClick={() => {
                                setBillAmount("");
                                setTipPercent(15);
                                setNumPeople(1);
                                setCustomTip("");
                            }}
                            className="w-full mt-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
