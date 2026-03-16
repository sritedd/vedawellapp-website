"use client";

import { useState } from "react";
import {
    calculateWarrantyExpiry,
    isWarrantyExpired,
    daysUntilWarrantyExpiry,
    getStateWarrantyPeriods,
    type WarrantyPeriod,
} from "@/lib/guardian/calculations";

interface WarrantyCalculatorProps {
    handoverDate?: string;
    stateCode?: string;
}

function getWarrantyPeriods(stateCode: string) {
    const periods = getStateWarrantyPeriods(stateCode);

    return [
        {
            type: "Defect Liability Period",
            duration: 90,
            unit: "days" as const,
            description: "Builder must fix defects reported within this period",
            critical: true,
        },
        {
            type: "Minor Defects (Non-Structural)",
            duration: periods.nonStructural,
            unit: "years" as const,
            description: "Paint, finishes, plumbing leaks, cracked tiles, etc.",
            critical: false,
        },
        {
            type: "Major/Structural Defects",
            duration: periods.structural,
            unit: "years" as const,
            description: "Foundation, framing, roof, load-bearing elements",
            critical: true,
        },
        {
            type: "Waterproofing (Wet Areas)",
            duration: periods.structural,
            unit: "years" as const,
            description: "Bathroom, laundry, and external waterproofing",
            critical: true,
        },
    ];
}

const STATE_WARRANTY_INFO: Record<string, { title: string; items: string[] }> = {
    NSW: {
        title: "NSW Statutory Warranties",
        items: [
            "These warranties apply automatically under the Home Building Act 1989",
            "Claims can be made through NSW Fair Trading or NCAT",
            "Document all defects with photos and dates",
            "Notify builder in writing before warranty expires",
            "Builder has reasonable time to rectify",
            "If builder fails, claim through HBCF insurance",
        ],
    },
    VIC: {
        title: "VIC Statutory Warranties",
        items: [
            "Warranties apply under the Domestic Building Contracts Act 1995",
            "Claims via DBDRV (Domestic Building Dispute Resolution Victoria)",
            "DBI insurance covers you if builder cannot complete work",
            "Document all defects with photos and dates",
            "Notify builder in writing before warranty expires",
        ],
    },
    QLD: {
        title: "QLD Statutory Warranties",
        items: [
            "6.5 years structural, 6 months non-structural from completion",
            "Claims via QBCC dispute resolution process",
            "QBCC Home Warranty Insurance covers builder insolvency",
            "Maximum claim $200,000 (standard) or $300,000 (optional)",
            "Document all defects with photos and dates",
            "Notify builder in writing before warranty expires",
        ],
    },
    WA: {
        title: "WA Statutory Warranties",
        items: [
            "Warranties apply under the Home Building Contracts Act 1991",
            "Home Indemnity Insurance mandatory for work >$20,000",
            "Lodge complaints via DMIRS Building Commission",
            "Document all defects with photos and dates",
            "Notify builder in writing before warranty expires",
        ],
    },
    SA: {
        title: "SA Statutory Warranties",
        items: [
            "5 years structural, 1 year non-structural warranty",
            "Builder's Indemnity Insurance required for work >$12,000",
            "Lodge complaints via Consumer and Business Services",
            "Document all defects with photos and dates",
        ],
    },
    TAS: {
        title: "TAS Statutory Warranties",
        items: [
            "6 years structural, 12 months non-structural under Building Act 2016",
            "Building Practitioner Accreditation required; insurance voluntary below $20,000",
            "Lodge complaints via CBOS Building Dispute Resolution",
            "Document all defects with photos and dates",
            "Notify builder in writing before warranty expires",
        ],
    },
    ACT: {
        title: "ACT Statutory Warranties",
        items: [
            "6 years structural, 2 years non-structural under Building Act 2004",
            "Fidelity Fund Certificate required for residential work >$12,000",
            "Lodge complaints via Access Canberra Construction Complaints",
            "Document all defects with photos and dates",
            "Notify builder in writing before warranty expires",
        ],
    },
    NT: {
        title: "NT Statutory Warranties",
        items: [
            "6 years structural, 1 year non-structural under Building Act 1993",
            "HBCF insurance required for residential work >$12,000",
            "Lodge complaints via NT Building Advisory Services",
            "Document all defects with photos and dates",
            "Notify builder in writing before warranty expires",
        ],
    },
};

export default function WarrantyCalculator({ handoverDate: initialDate, stateCode = "NSW" }: WarrantyCalculatorProps) {
    const [handoverDate, setHandoverDate] = useState(initialDate || "");

    const warrantyPeriods = getWarrantyPeriods(stateCode);
    const stateInfo = STATE_WARRANTY_INFO[stateCode] || STATE_WARRANTY_INFO["NSW"];
    const periods = getStateWarrantyPeriods(stateCode);

    const REMINDER_PERIODS = [
        { months: 2, label: "2-Month Post-Handover Check", warning: "Inspect for early settlement cracks and minor issues while in defect liability period" },
        ...(periods.nonStructural <= 1
            ? [{ months: 4, label: `${Math.round(periods.nonStructural * 12) - 1} Month Check`, warning: `Last chance to claim minor defects under ${periods.nonStructural}-year non-structural warranty` }]
            : [
                { months: 11, label: "11-Month Deep Inspection", warning: "Do a thorough inspection before 12-month warranty checkpoint" },
                { months: 23, label: "23-Month Check", warning: `Final chance to claim minor defects under ${periods.nonStructural}-year warranty` },
            ]
        ),
        { months: Math.round(periods.structural * 12) - 3, label: `${periods.structural}-Year Warranty Ending`, warning: "Last chance for structural warranty claims — get a professional inspection" },
    ];

    const calculateExpiry = (type: typeof warrantyPeriods[0]) => {
        if (!handoverDate) return null;
        return calculateWarrantyExpiry(handoverDate, type as WarrantyPeriod);
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
                <h2 className="text-2xl font-bold">Warranty Calculator</h2>
                <p className="text-muted-foreground">
                    Track your {stateCode} warranty periods and never miss a deadline.
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
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <h3 className="font-bold mb-2">Upcoming Warranty Milestones</h3>
                    {upcomingReminders.map((reminder, idx) => (
                        <div key={idx} className="mb-2 last:mb-0">
                            <div className="font-medium">
                                {reminder.label} — {reminder.daysAway} days away
                            </div>
                            <p className="text-sm text-muted-foreground">{reminder.warning}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Warranty Periods */}
            <div className="space-y-4">
                {warrantyPeriods.map((warranty, idx) => {
                    const expiry = calculateExpiry(warranty);
                    const expired = isWarrantyExpired(expiry);
                    const days = daysUntilWarrantyExpiry(expiry);

                    return (
                        <div
                            key={idx}
                            className={`p-4 rounded-xl border ${expired
                                ? "bg-red-500/10 border-red-500/30"
                                : days !== null && days < 90
                                    ? "bg-amber-500/10 border-amber-500/30"
                                    : "bg-card border-border"
                                }`}
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold">{warranty.type}</h4>
                                        {warranty.critical && (
                                            <span className="px-2 py-0.5 bg-red-500/10 text-red-600 text-xs rounded font-bold">
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
                                                : days !== null && days < 90
                                                    ? "text-amber-600"
                                                    : "text-muted-foreground"
                                                }`}
                                        >
                                            {expired ? (
                                                <>Expired {expiry.toLocaleDateString()}</>
                                            ) : (
                                                <>
                                                    Expires: {expiry.toLocaleDateString()}
                                                    {days !== null && days < 90 && ` (${days} days left)`}
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

            {/* State-Specific Warranty Info */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <h4 className="font-bold mb-2">{stateInfo.title}</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                    {stateInfo.items.map((item, idx) => (
                        <li key={idx}>- {item}</li>
                    ))}
                </ul>
            </div>

            {/* Pro Tip */}
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <h4 className="font-bold mb-2">Pro Tip: Regular Inspections</h4>
                <p className="text-sm text-muted-foreground">
                    Schedule inspections before each warranty milestone. Many issues appear in the first year
                    as the house settles. A professional building inspector can identify problems you might miss,
                    especially structural issues hidden behind walls.
                </p>
            </div>
        </div>
    );
}
