"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
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
                <div className="max-w-lg mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h1 className="text-3xl font-bold mb-2 text-center">🎂 Age Calculator</h1>
                        <p className="text-gray-500 text-center mb-8">
                            Calculate your exact age and fun facts
                        </p>

                        {/* Input */}
                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date of Birth
                                </label>
                                <input
                                    type="date"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    max={toDate}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Calculate Age As Of
                                </label>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-lg"
                                />
                            </div>
                        </div>

                        {/* Results */}
                        {result && (
                            <div className="space-y-6">
                                {/* Main Age */}
                                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white text-center">
                                    <div className="text-lg opacity-80 mb-2">Your Age</div>
                                    <div className="text-4xl font-bold">
                                        {result.years} years, {result.months} months, {result.days} days
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-purple-50 rounded-xl p-4 text-center">
                                        <div className="text-sm text-purple-600">Total Days</div>
                                        <div className="text-2xl font-bold text-purple-900">
                                            {result.totalDays.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="bg-pink-50 rounded-xl p-4 text-center">
                                        <div className="text-sm text-pink-600">Total Weeks</div>
                                        <div className="text-2xl font-bold text-pink-900">
                                            {result.totalWeeks.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                                        <div className="text-sm text-blue-600">Total Months</div>
                                        <div className="text-2xl font-bold text-blue-900">
                                            {result.totalMonths.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="bg-green-50 rounded-xl p-4 text-center">
                                        <div className="text-sm text-green-600">Next Birthday</div>
                                        <div className="text-2xl font-bold text-green-900">
                                            {result.nextBirthday} days
                                        </div>
                                    </div>
                                </div>

                                {/* Fun Facts */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h3 className="font-medium text-gray-700 mb-3">Fun Facts</h3>
                                    <div className="space-y-2 text-gray-600">
                                        <div className="flex justify-between">
                                            <span>Born on a</span>
                                            <span className="font-medium">{result.dayOfWeek}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Zodiac Sign</span>
                                            <span className="font-medium">{result.zodiac}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Total Hours Lived</span>
                                            <span className="font-medium">
                                                {(result.totalDays * 24).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
