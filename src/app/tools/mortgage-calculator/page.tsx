"use client";

import { useState } from "react";
import Link from "next/link";

export default function MortgageCalculator() {
    const [homePrice, setHomePrice] = useState(400000);
    const [downPayment, setDownPayment] = useState(80000);
    const [interestRate, setInterestRate] = useState(6.5);
    const [loanTerm, setLoanTerm] = useState(30);
    const [propertyTax, setPropertyTax] = useState(3000);
    const [insurance, setInsurance] = useState(1200);

    const principal = homePrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const payments = loanTerm * 12;

    const monthlyPrincipal = principal * (monthlyRate * Math.pow(1 + monthlyRate, payments)) / (Math.pow(1 + monthlyRate, payments) - 1);
    const monthlyTax = propertyTax / 12;
    const monthlyInsurance = insurance / 12;
    const totalMonthly = monthlyPrincipal + monthlyTax + monthlyInsurance;

    const totalPayments = monthlyPrincipal * payments;
    const totalInterest = totalPayments - principal;

    const formatCurrency = (n: number) => "$" + n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const downPaymentPercent = homePrice > 0 ? (downPayment / homePrice) * 100 : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-slate-900">
            <nav className="border-b border-blue-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-blue-400 hover:text-white">← Back</Link>
                    <h1 className="text-xl font-bold text-white">🏠 Mortgage Calculator</h1>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto p-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-800/30 space-y-4">
                        <div>
                            <label className="block text-sm text-blue-300 mb-2">Home Price</label>
                            <input type="number" value={homePrice} onChange={(e) => setHomePrice(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 bg-slate-900 border border-blue-700 rounded-lg text-white text-lg" />
                        </div>
                        <div>
                            <div className="flex justify-between text-sm text-blue-300 mb-2">
                                <span>Down Payment</span>
                                <span>{downPaymentPercent.toFixed(1)}%</span>
                            </div>
                            <input type="number" value={downPayment} onChange={(e) => setDownPayment(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 bg-slate-900 border border-blue-700 rounded-lg text-white text-lg" />
                        </div>
                        <div>
                            <label className="block text-sm text-blue-300 mb-2">Interest Rate: {interestRate}%</label>
                            <input type="range" value={interestRate} onChange={(e) => setInterestRate(parseFloat(e.target.value))} min="1" max="15" step="0.1" className="w-full" />
                        </div>
                        <div>
                            <label className="block text-sm text-blue-300 mb-2">Loan Term</label>
                            <div className="flex gap-2">
                                {[15, 20, 30].map(term => (
                                    <button key={term} onClick={() => setLoanTerm(term)} className={`flex-1 py-2 rounded-lg ${loanTerm === term ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300"}`}>{term} years</button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-blue-300 mb-2">Property Tax/yr</label>
                                <input type="number" value={propertyTax} onChange={(e) => setPropertyTax(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-900 border border-blue-700 rounded text-white" />
                            </div>
                            <div>
                                <label className="block text-sm text-blue-300 mb-2">Insurance/yr</label>
                                <input type="number" value={insurance} onChange={(e) => setInsurance(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-900 border border-blue-700 rounded text-white" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-800/30 text-center">
                            <div className="text-sm text-slate-400 mb-1">Monthly Payment</div>
                            <div className="text-5xl font-bold text-blue-400">{formatCurrency(totalMonthly)}</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                            <div className="space-y-2">
                                <div className="flex justify-between"><span className="text-slate-400">Principal & Interest</span><span className="text-white">{formatCurrency(monthlyPrincipal)}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400">Property Tax</span><span className="text-white">{formatCurrency(monthlyTax)}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400">Insurance</span><span className="text-white">{formatCurrency(monthlyInsurance)}</span></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
                                <div className="text-xs text-slate-400">Loan Amount</div>
                                <div className="text-xl font-bold text-white">{formatCurrency(principal)}</div>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-red-800/30 text-center">
                                <div className="text-xs text-slate-400">Total Interest</div>
                                <div className="text-xl font-bold text-red-400">{formatCurrency(totalInterest)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
