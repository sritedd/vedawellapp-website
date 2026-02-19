"use client";

import { useState } from "react";
import {
    calculateWarrantyExpiry,
    isWarrantyExpired,
    daysUntilWarrantyExpiry,
    getWarrantyUrgencyLevel,
    WarrantyPeriod,
} from "@/lib/guardian/calculations";

interface WarrantyCalculatorProps {
    handoverDate?: string;
}

const WARRANTY_PERIODS = [
    {
        type: "Defect Liability Period",
        duration: 90, // days
        unit: "days",
        description: "Builder must fix defects reported within this period",
        critical: true,
    },
    {
        type: "Minor Defects (Non-Structural)",
        duration: 2,
        unit: "years",
        description: "Paint, finishes, plumbing leaks, cracked tiles, etc.",
        critical: false,
    },
    {
        type: "Major/Structural Defects",
        duration: 6,
        unit: "years",
        description: "Foundation, framing, roof, load-bearing elements",
        critical: true,
    },
    {
        type: "Waterproofing (Wet Areas)",
        duration: 6,
        unit: "years",
        description: "Bathroom, laundry, and external waterproofing",
        critical: true,
    },
];

const REMINDER_PERIODS = [
    { months: 11, label: "11-Month Deep Inspection", warning: "Do a thorough inspection before 12-month warranty ends" },
    { months: 23, label: "23-Month Check", warning: "Final chance to claim minor defects under 2-year warranty" },
    { months: 69, label: "5 Year 9 Month Check", warning: "Last chance for structural warranty claims" },
];

export default function WarrantyCalculator({ handoverDate: initialDate }: WarrantyCalculatorProps) {
    const [handoverDate, setHandoverDate] = useState(initialDate || "");

    // Use tested utility functions for calculations
    const calculateExpiry = (type: typeof WARRANTY_PERIODS[0]) => {
        if (!handoverDate) return null;
        return calculateWarrantyExpiry(handoverDate, type as WarrantyPeriod);
    };

    const isExpired = (expiryDate: Date | null) => {
        return isWarrantyExpired(expiryDate);
    };

    const daysRemaining = (expiryDate: Date | null) => {
        return daysUntilWarrantyExpiry(expiryDate);
    };

    const getUpcomingReminders = () => {
        if (!handoverDate) return [];
        const reminders = [];
        for (const reminder of REMINDER_PERIODS) {
            const date = new Date(handoverDate);
            date.setMonth(date.getMonth() + reminder.months);
            const daysAway = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            if (daysAway > 0 && daysAway < 60) {
                reminders.push({ ...reminder, date, daysAway });
            }
        }
        return reminders;
    };

    const upcomingReminders = getUpcomingReminders();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">📅 Warranty Calculator</h2>
                <p className="text-muted-foreground">
                    Track your warranty periods and never miss a deadline.
                </p>
            </div>

            {/* Handover Date Input */}
            <div className="p-6 bg-card border border-border rounded-xl">
                <label className="block font-medium mb-2">Handover Date</label>
                <input
                    type="date"
                    value={handoverDate}
                    onChange={(e) => setHandoverDate(e.target.value)}
                    className="w-full md:w-auto px-4 py-3 border border-border rounded-lg bg-background"
                />
                <p className="text-sm text-muted-foreground mt-2">
                    Enter the date you took possession/received your Occupation Certificate
                </p>
            </div>

            {/* Upcoming Reminders */}
            {upcomingReminders.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <h3 className="font-bold text-amber-800 mb-2">⏰ Upcoming Warranty Milestones</h3>
                    {upcomingReminders.map((reminder, idx) => (
                        <div key={idx} className="mb-2 last:mb-0">
                            <div className="font-medium text-amber-800">
                                {reminder.label} - {reminder.daysAway} days away
                            </div>
                            <p className="text-sm text-amber-700">{reminder.warning}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Warranty Periods */}
            <div className="space-y-4">
                {WARRANTY_PERIODS.map((warranty, idx) => {
                    const expiry = calculateExpiry(warranty);
                    const expired = isExpired(expiry);
                    const days = daysRemaining(expiry);

                    return (
                        <div
                            key={idx}
                            className={`p-4 rounded-xl border ${expired
                                ? "bg-red-50 border-red-200"
                                : days && days < 90
                                    ? "bg-amber-50 border-amber-200"
                                    : "bg-card border-border"
                                }`}
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold">{warranty.type}</h4>
                                        {warranty.critical && (
                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded font-bold">
                                                CRITICAL
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {warranty.description}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <div className="font-medium">
                                        {warranty.duration} {warranty.unit}
                                    </div>
                                    {expiry && (
                                        <div
                                            className={`text-sm ${expired
                                                ? "text-red-600 font-bold"
                                                : days && days < 90
                                                    ? "text-amber-600"
                                                    : "text-muted-foreground"
                                                }`}
                                        >
                                            {expired ? (
                                                <>❌ Expired {expiry.toLocaleDateString()}</>
                                            ) : (
                                                <>
                                                    Expires: {expiry.toLocaleDateString()}
                                                    {days && days < 90 && ` (${days} days left)`}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* NSW Warranty Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-bold text-blue-800 mb-2">📋 NSW Statutory Warranties</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• These warranties apply automatically under the Home Building Act 1989</li>
                    <li>• Claims can be made through NSW Fair Trading or NCAT</li>
                    <li>• Document all defects with photos and dates</li>
                    <li>• Notify builder in writing before warranty expires</li>
                    <li>• Builder has reasonable time to rectify</li>
                    <li>• If builder fails, claim through HBCF insurance</li>
                </ul>
            </div>

            {/* 11-Month Reminder */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <h4 className="font-bold text-green-800 mb-2">💡 Pro Tip: 11-Month Inspection</h4>
                <p className="text-sm text-green-700">
                    Schedule a comprehensive inspection at the 11-month mark. This gives you time
                    to identify and report any defects before the 12-month minor defects "peak"
                    claim period. Many issues appear in the first year as the house settles.
                </p>
            </div>
        </div>
    );
}
