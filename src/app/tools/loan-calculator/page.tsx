"use client";

import { useState, useEffect } from "react";
import ToolLayout from "@/components/tools/ToolLayout";

export default function LoanCalculator() {
    const [amount, setAmount] = useState(250000);
    const [rate, setRate] = useState(6.5);
    const [years, setYears] = useState(30);

    const [monthlyPayment, setMonthlyPayment] = useState(0);
    const [totalPayment, setTotalPayment] = useState(0);
    const [totalInterest, setTotalInterest] = useState(0);
    const [principalPercent, setPrincipalPercent] = useState(0);

    const calculate = () => {
        const P = Number(amount) || 0;
        const r = (Number(rate) || 0) / 100 / 12;
        const n = (Number(years) || 1) * 12;

        let M = 0;
        if (r === 0) {
            M = P / n;
        } else {
            M = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        }

        const total = M * n;
        const interest = total - P;

        setMonthlyPayment(M);
        setTotalPayment(total);
        setTotalInterest(interest);
        setPrincipalPercent((P / total) * 100);
    };

    useEffect(() => {
        calculate();
    }, [amount, rate, years]);

    const formatMoney = (val: number) => {
        return '$' + val.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const formatMonthly = (val: number) => {
        return '$' + val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    return (
        <ToolLayout
            title="Loan Calculator"
            description="Calculate monthly payments, interest, and amortization schedules for loans."
        >
            <div className="grid lg:grid-cols-2 gap-12 items-start">
                {/* Input Section */}
                <div className="bg-muted/5 p-6 rounded-xl border border-border space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">Loan Amount ($)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            placeholder="e.g. 250000"
                            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">Interest Rate (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={rate}
                                onChange={(e) => setRate(Number(e.target.value))}
                                placeholder="e.g. 6.5"
                                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">Loan Term (Years)</label>
                            <input
                                type="number"
                                value={years}
                                onChange={(e) => setYears(Number(e.target.value))}
                                placeholder="e.g. 30"
                                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
                    <div className="space-y-6">
                        <div className="flex justify-between items-center pb-4 border-b border-border">
                            <span className="text-muted-foreground font-medium">Monthly Payment</span>
                            <span className="text-4xl font-extrabold text-primary">{formatMonthly(monthlyPayment)}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Total Payment</span>
                            <span className="font-bold text-xl">{formatMoney(totalPayment)}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Total Interest</span>
                            <span className="font-bold text-xl text-red-500">{formatMoney(totalInterest)}</span>
                        </div>

                        {/* Chart */}
                        <div className="pt-4">
                            <div className="h-4 w-full rounded-full flex overflow-hidden">
                                <div
                                    className="bg-primary h-full transition-all duration-500"
                                    style={{ width: `${principalPercent}%` }}
                                />
                                <div
                                    className="bg-red-500 h-full transition-all duration-500"
                                    style={{ width: `${100 - principalPercent}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-2 text-xs font-medium uppercase tracking-wider">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-sm bg-primary block"></span>
                                    Principal
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-sm bg-red-500 block"></span>
                                    Interest
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
