"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PanchangData {
    tithi: string;
    nakshatra: string;
    yoga: string;
    karana: string;
    sunrise: string;
    sunset: string;
    moonrise: string;
    moonset: string;
    rahukaal: string;
    yamaganda: string;
    gulika: string;
    auspiciousTime: string;
    inauspiciousTime: string;
}

import ShareButtons from "@/components/social/ShareButtons";

export default function PanchangPage() {
    const [date, setDate] = useState(new Date());
    const [location, setLocation] = useState("Sydney, Australia");

    // Generate panchang data based on date (simplified calculation)
    const getPanchangData = (d: Date): PanchangData => {
        const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
        const moonPhase = (dayOfYear % 30) + 1;

        const tithis = [
            "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami",
            "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
            "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima/Amavasya"
        ];

        const nakshatras = [
            "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira",
            "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha",
            "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati",
            "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha",
            "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada",
            "Uttara Bhadrapada", "Revati"
        ];

        const yogas = [
            "Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana",
            "Atiganda", "Sukarma", "Dhriti", "Shoola", "Ganda",
            "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra",
            "Siddhi", "Vyatipata", "Variyan", "Parigha", "Shiva",
            "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma",
            "Indra", "Vaidhriti"
        ];

        const karanas = [
            "Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti",
            "Shakuni", "Chatushpada", "Naga", "Kimstughna"
        ];

        // Calculate times based on date
        const baseHour = 6;
        const sunriseHour = baseHour + (d.getMonth() >= 4 && d.getMonth() <= 8 ? -1 : 0);
        const sunsetHour = 18 + (d.getMonth() >= 4 && d.getMonth() <= 8 ? 1 : 0);

        return {
            tithi: tithis[moonPhase % 15],
            nakshatra: nakshatras[dayOfYear % 27],
            yoga: yogas[dayOfYear % 27],
            karana: karanas[dayOfYear % 11],
            sunrise: `${sunriseHour.toString().padStart(2, "0")}:${(d.getDate() % 30 + 10).toString().padStart(2, "0")} AM`,
            sunset: `${(sunsetHour % 12).toString().padStart(2, "0")}:${(d.getDate() % 30 + 20).toString().padStart(2, "0")} PM`,
            moonrise: `${(7 + moonPhase % 12).toString().padStart(2, "0")}:${(moonPhase * 2).toString().padStart(2, "0")} PM`,
            moonset: `${(5 + moonPhase % 6).toString().padStart(2, "0")}:${(moonPhase * 3 % 60).toString().padStart(2, "0")} AM`,
            rahukaal: `${9 + d.getDay()}:00 - ${10 + d.getDay()}:30`,
            yamaganda: `${7 + d.getDay()}:00 - ${8 + d.getDay()}:30`,
            gulika: `${6 + d.getDay()}:00 - ${7 + d.getDay()}:30`,
            auspiciousTime: "06:00 - 07:30, 10:30 - 12:00, 15:00 - 16:30",
            inauspiciousTime: `${9 + d.getDay()}:00 - ${10 + d.getDay()}:30 (Rahukaal)`,
        };
    };

    const panchang = getPanchangData(date);

    const changeDate = (days: number) => {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + days);
        setDate(newDate);
    };

    const formatDate = (d: Date) => {
        return d.toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // Get moon phase icon
    const getMoonPhase = () => {
        const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
        const phase = (dayOfYear % 30);
        if (phase < 4) return "🌑";
        if (phase < 8) return "🌒";
        if (phase < 12) return "🌓";
        if (phase < 16) return "🌔";
        if (phase < 20) return "🌕";
        if (phase < 24) return "🌖";
        if (phase < 28) return "🌗";
        return "🌘";
    };

    return (
        <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
            <main className="py-8 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Date Navigation */}
                    <div className="flex justify-between items-center mb-8">
                        <button
                            onClick={() => changeDate(-1)}
                            className="p-3 bg-white rounded-xl shadow hover:shadow-md transition-shadow"
                        >
                            ← Previous
                        </button>
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-orange-800">{formatDate(date)}</h1>
                            <p className="text-orange-600">{location}</p>
                        </div>
                        <button
                            onClick={() => changeDate(1)}
                            className="p-3 bg-white rounded-xl shadow hover:shadow-md transition-shadow"
                        >
                            Next →
                        </button>
                    </div>

                    {/* Today Button */}
                    <div className="text-center mb-8">
                        <button
                            onClick={() => setDate(new Date())}
                            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                        >
                            Today
                        </button>
                    </div>

                    {/* Main Panchang Card */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
                        {/* Moon Phase Header */}
                        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6 text-center">
                            <div className="text-6xl mb-2">{getMoonPhase()}</div>
                            <div className="text-xl font-bold">{panchang.tithi}</div>
                            <div className="text-orange-100">{panchang.nakshatra} Nakshatra</div>
                        </div>

                        {/* Panchang Details */}
                        <div className="p-6 grid md:grid-cols-2 gap-6">
                            {/* Panchang Elements */}
                            <div>
                                <h3 className="font-bold text-lg text-orange-800 mb-4 border-b border-orange-200 pb-2">
                                    पंचांग Elements
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tithi (तिथि)</span>
                                        <span className="font-medium">{panchang.tithi}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Nakshatra (नक्षत्र)</span>
                                        <span className="font-medium">{panchang.nakshatra}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Yoga (योग)</span>
                                        <span className="font-medium">{panchang.yoga}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Karana (करण)</span>
                                        <span className="font-medium">{panchang.karana}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Sun & Moon */}
                            <div>
                                <h3 className="font-bold text-lg text-orange-800 mb-4 border-b border-orange-200 pb-2">
                                    ☀️ Sun & 🌙 Moon
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">🌅 Sunrise</span>
                                        <span className="font-medium">{panchang.sunrise}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">🌇 Sunset</span>
                                        <span className="font-medium">{panchang.sunset}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">🌙 Moonrise</span>
                                        <span className="font-medium">{panchang.moonrise}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">🌑 Moonset</span>
                                        <span className="font-medium">{panchang.moonset}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Inauspicious Times */}
                    <div className="grid md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                            <div className="text-2xl mb-1">⚠️</div>
                            <div className="font-bold text-red-800">Rahukaal</div>
                            <div className="text-red-600">{panchang.rahukaal}</div>
                        </div>
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
                            <div className="text-2xl mb-1">⏰</div>
                            <div className="font-bold text-orange-800">Yamaganda</div>
                            <div className="text-orange-600">{panchang.yamaganda}</div>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                            <div className="text-2xl mb-1">🕐</div>
                            <div className="font-bold text-amber-800">Gulika</div>
                            <div className="text-amber-600">{panchang.gulika}</div>
                        </div>
                    </div>

                    {/* Auspicious Times */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
                        <h3 className="font-bold text-lg text-green-800 mb-2 flex items-center gap-2">
                            ✨ Auspicious Times (Shubh Muhurat)
                        </h3>
                        <p className="text-green-700">{panchang.auspiciousTime}</p>
                    </div>

                    {/* Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-sm text-blue-800">
                        <p className="font-medium mb-2">ℹ️ About Panchang</p>
                        <p>
                            Panchang is a Hindu calendar that provides five key elements: Tithi (lunar day),
                            Nakshatra (star), Yoga (auspicious combination), Karana (half-tithi), and Vara (weekday).
                            It helps determine auspicious times for important activities.
                        </p>
                    </div>
                </div>

                <ShareButtons
                    title={`Panchang for ${date.toLocaleDateString()}`}
                    text={`Today's Panchang: ${panchang.tithi}, Nakshatra: ${panchang.nakshatra}. See full details on VedaWell.`}
                />
            </main>
        </div>
    );
}
