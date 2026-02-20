"use client";

import { useState, useEffect } from "react";
import ToolLayout from "@/components/tools/ToolLayout";

export default function AgeCalculator() {
    const [birthDate, setBirthDate] = useState("");
    const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
    const [result, setResult] = useState<{
        years: number;
        months: number;
        days: number;
        totalDays: number;
        totalWeeks: number;
        totalMonths: number;
        nextBirthday: number;
        zodiac: string;
        dayOfWeek: string;
    } | null>(null);

    const getZodiac = (month: number, day: number): string => {
        const signs = [
            { sign: "Capricorn", symbol: "♑", end: [1, 19] },
            { sign: "Aquarius", symbol: "♒", end: [2, 18] },
            { sign: "Pisces", symbol: "♓", end: [3, 20] },
            { sign: "Aries", symbol: "♈", end: [4, 19] },
            { sign: "Taurus", symbol: "♉", end: [5, 20] },
            { sign: "Gemini", symbol: "♊", end: [6, 20] },
            { sign: "Cancer", symbol: "♋", end: [7, 22] },
            { sign: "Leo", symbol: "♌", end: [8, 22] },
            { sign: "Virgo", symbol: "♍", end: [9, 22] },
            { sign: "Libra", symbol: "♎", end: [10, 22] },
            { sign: "Scorpio", symbol: "♏", end: [11, 21] },
            { sign: "Sagittarius", symbol: "♐", end: [12, 21] },
            { sign: "Capricorn", symbol: "♑", end: [12, 31] },
        ];

        for (const { sign, symbol, end } of signs) {
            if (month < end[0] || (month === end[0] && day <= end[1])) {
                return `${symbol} ${sign}`;
            }
        }
        return "♑ Capricorn";
    };

    const calculate = () => {
        if (!birthDate) return;

        const birth = new Date(birthDate);
        const to = new Date(toDate);

        if (birth > to) {
            setResult(null);
            return;
        }

        // Calculate age
        let years = to.getFullYear() - birth.getFullYear();
        let months = to.getMonth() - birth.getMonth();
        let days = to.getDate() - birth.getDate();

        if (days < 0) {
            months--;
            const prevMonth = new Date(to.getFullYear(), to.getMonth(), 0);
            days += prevMonth.getDate();
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        // Total calculations
        const diffTime = Math.abs(to.getTime() - birth.getTime());
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const totalWeeks = Math.floor(totalDays / 7);
        const totalMonths = years * 12 + months;

        // Next birthday
        let nextBirthday = new Date(to.getFullYear(), birth.getMonth(), birth.getDate());
        if (nextBirthday <= to) {
            nextBirthday = new Date(to.getFullYear() + 1, birth.getMonth(), birth.getDate());
        }
        const daysToNext = Math.ceil((nextBirthday.getTime() - to.getTime()) / (1000 * 60 * 60 * 24));

        // Day of week born
        const days_of_week = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayOfWeek = days_of_week[birth.getDay()];

        // Zodiac
        const zodiac = getZodiac(birth.getMonth() + 1, birth.getDate());

        setResult({
            years,
            months,
            days,
            totalDays,
            totalWeeks,
            totalMonths,
            nextBirthday: daysToNext,
            zodiac,
            dayOfWeek,
        });
    };

    useEffect(() => {
        if (birthDate) calculate();
    }, [birthDate, toDate]);

    return (
        <ToolLayout
            title="Age Calculator"
            description="Calculate your exact age in years, months, and days. Discover your next birthday, zodiac sign, and time lived."
        >
            <div className="space-y-8">
                {/* Input */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Date of Birth
                        </label>
                        <input
                            type="date"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            max={toDate}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Calculate Age As Of
                        </label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Results */}
                {result && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Main Age */}
                        <div className="bg-gradient-to-r from-primary to-primary-light rounded-2xl p-8 text-white text-center shadow-lg">
                            <div className="text-lg opacity-90 mb-2 font-medium">Your Exact Age</div>
                            <div className="text-4xl md:text-5xl font-extrabold tracking-tight">
                                {result.years} years, {result.months} months, {result.days} days
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-card border border-border rounded-xl p-4 text-center">
                                <div className="text-sm text-muted">Total Days</div>
                                <div className="text-2xl font-bold text-foreground mt-1">
                                    {result.totalDays.toLocaleString()}
                                </div>
                            </div>
                            <div className="bg-card border border-border rounded-xl p-4 text-center">
                                <div className="text-sm text-muted">Total Weeks</div>
                                <div className="text-2xl font-bold text-foreground mt-1">
                                    {result.totalWeeks.toLocaleString()}
                                </div>
                            </div>
                            <div className="bg-card border border-border rounded-xl p-4 text-center">
                                <div className="text-sm text-muted">Total Months</div>
                                <div className="text-2xl font-bold text-foreground mt-1">
                                    {result.totalMonths.toLocaleString()}
                                </div>
                            </div>
                            <div className="bg-card border border-border rounded-xl p-4 text-center">
                                <div className="text-sm text-muted">Next Birthday</div>
                                <div className="text-2xl font-bold text-primary mt-1">
                                    In {result.nextBirthday} days
                                </div>
                            </div>
                        </div>

                        {/* Fun Facts */}
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <span>✨</span> Fun Facts
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-border">
                                    <span className="text-muted">Day of Week Born</span>
                                    <span className="font-semibold text-foreground">{result.dayOfWeek}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-border">
                                    <span className="text-muted">Zodiac Sign</span>
                                    <span className="font-semibold text-foreground">{result.zodiac}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-border">
                                    <span className="text-muted">Total Hours Lived</span>
                                    <span className="font-semibold text-foreground">
                                        {(result.totalDays * 24).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
