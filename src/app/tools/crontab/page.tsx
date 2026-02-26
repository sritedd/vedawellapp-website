"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import ToolFAQ from "@/components/tools/ToolFAQ";
import AdBanner from "@/components/AdBanner";
import SupportBanner from "@/components/SupportBanner";
import EmailCapture from "@/components/EmailCapture";
import ShareButtons from "@/components/social/ShareButtons";
import JsonLd from "@/components/seo/JsonLd";

// ─── Cron Parser Core ────────────────────────────────────────────────────────

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const PRESETS = [
    { label: "Every minute", value: "* * * * *" },
    { label: "Every 5 minutes", value: "*/5 * * * *" },
    { label: "Every 15 minutes", value: "*/15 * * * *" },
    { label: "Every 30 minutes", value: "*/30 * * * *" },
    { label: "Every hour", value: "0 * * * *" },
    { label: "Every 2 hours", value: "0 */2 * * *" },
    { label: "Every day at noon", value: "0 12 * * *" },
    { label: "Every day midnight", value: "0 0 * * *" },
    { label: "Every Monday 9am", value: "0 9 * * 1" },
    { label: "Weekdays 8am", value: "0 8 * * 1-5" },
    { label: "Weekends midnight", value: "0 0 * * 6,0" },
    { label: "1st of month", value: "0 0 1 * *" },
    { label: "Every quarter", value: "0 0 1 */3 *" },
    { label: "Yearly (Jan 1)", value: "0 0 1 1 *" },
];

const ALIASES: Record<string, string> = {
    "@yearly": "0 0 1 1 *",
    "@annually": "0 0 1 1 *",
    "@monthly": "0 0 1 * *",
    "@weekly": "0 0 * * 0",
    "@daily": "0 0 * * *",
    "@midnight": "0 0 * * *",
    "@hourly": "0 * * * *",
    "@reboot": "@reboot",
};

function expandAlias(expr: string): string {
    const trimmed = expr.trim().toLowerCase();
    return ALIASES[trimmed] ?? expr;
}

function parseField(field: string, min: number, max: number): number[] | null {
    if (field === "*") {
        return Array.from({ length: max - min + 1 }, (_, i) => i + min);
    }
    const result = new Set<number>();
    for (const part of field.split(",")) {
        if (part.includes("/")) {
            const [range, stepStr] = part.split("/");
            const step = parseInt(stepStr);
            if (isNaN(step) || step <= 0) return null;
            let start = min, end = max;
            if (range !== "*") {
                const bounds = range.split("-").map(Number);
                [start, end] = bounds.length === 2 ? bounds : [bounds[0], bounds[0]];
                if (isNaN(start) || isNaN(end)) return null;
            }
            for (let i = start; i <= end; i += step) result.add(i);
        } else if (part.includes("-")) {
            const [s, e] = part.split("-").map(Number);
            if (isNaN(s) || isNaN(e) || s > e) return null;
            for (let i = s; i <= e; i++) result.add(i);
        } else {
            const n = parseInt(part);
            if (isNaN(n)) return null;
            result.add(n);
        }
    }
    const arr = [...result].filter(n => n >= min && n <= max).sort((a, b) => a - b);
    return arr.length > 0 ? arr : null;
}

interface ParsedCron {
    minutes: number[];
    hours: number[];
    doms: number[];
    months: number[];
    dows: number[];  // 0-6 only, 7→0
}

function parseCron(expr: string): ParsedCron | null {
    const expanded = expandAlias(expr.trim());
    if (expanded === "@reboot") return null; // can't calculate next run
    const parts = expanded.trim().split(/\s+/);
    if (parts.length !== 5) return null;
    const [minsF, hoursF, domF, monthF, dowF] = parts;

    // Handle month names
    const monthField = monthF
        .replace(/jan/gi, "1").replace(/feb/gi, "2").replace(/mar/gi, "3")
        .replace(/apr/gi, "4").replace(/may/gi, "5").replace(/jun/gi, "6")
        .replace(/jul/gi, "7").replace(/aug/gi, "8").replace(/sep/gi, "9")
        .replace(/oct/gi, "10").replace(/nov/gi, "11").replace(/dec/gi, "12");

    // Handle day names
    const dowField = dowF
        .replace(/sun/gi, "0").replace(/mon/gi, "1").replace(/tue/gi, "2")
        .replace(/wed/gi, "3").replace(/thu/gi, "4").replace(/fri/gi, "5")
        .replace(/sat/gi, "6");

    const minutes = parseField(minsF, 0, 59);
    const hours = parseField(hoursF, 0, 23);
    const doms = parseField(domF, 1, 31);
    const months = parseField(monthField, 1, 12);
    const dowsRaw = parseField(dowField, 0, 7);
    if (!minutes || !hours || !doms || !months || !dowsRaw) return null;

    // Map 7 (also Sunday) → 0
    const dows = [...new Set(dowsRaw.map(d => d % 7))].sort((a, b) => a - b);

    return { minutes, hours, doms, months, dows };
}

function getNextRuns(parsed: ParsedCron, count: number): Date[] {
    const { minutes, hours, doms, months, dows } = parsed;
    const results: Date[] = [];
    const current = new Date();
    current.setSeconds(0);
    current.setMilliseconds(0);
    current.setMinutes(current.getMinutes() + 1);

    const domIsWild = doms.length === 31;
    const dowIsWild = dows.length === 7;

    for (let iter = 0; iter < 527040 && results.length < count; iter++) {
        const m = current.getMinutes();
        const h = current.getHours();
        const dom = current.getDate();
        const mo = current.getMonth() + 1;
        const dow = current.getDay();

        const domMatch = domIsWild ? true : doms.includes(dom);
        const dowMatch = dowIsWild ? true : dows.includes(dow);

        // When both dom and dow are restricted, Unix cron uses OR semantics
        const dayMatch = (domIsWild || dowIsWild)
            ? (domMatch && dowMatch)
            : (domMatch || dowMatch);

        if (
            minutes.includes(m) &&
            hours.includes(h) &&
            months.includes(mo) &&
            dayMatch
        ) {
            results.push(new Date(current));
        }
        current.setMinutes(current.getMinutes() + 1);
    }
    return results;
}

// ─── Human-readable description ──────────────────────────────────────────────

function describeField(vals: number[], all: number[], unit: string, names?: string[]): string {
    if (vals.length === all.length) return `every ${unit}`;
    if (vals.length === 1) return names ? names[vals[0]] : `${unit} ${vals[0]}`;

    // Detect steps
    const diffs = vals.slice(1).map((v, i) => v - vals[i]);
    const step = diffs[0];
    if (diffs.every(d => d === step) && step > 1) {
        const start = vals[0];
        return start === all[0]
            ? `every ${step} ${unit}s`
            : `every ${step} ${unit}s starting at ${start}`;
    }

    const labeled = vals.map(v => names ? names[v] : String(v));
    if (labeled.length <= 4) return `${unit}s ${labeled.slice(0, -1).join(", ")} and ${labeled.at(-1)}`;
    return `${labeled.length} ${unit}s`;
}

function humanReadable(expr: string, parsed: ParsedCron | null): string {
    const trimmed = expr.trim().toLowerCase();
    if (trimmed === "@reboot") return "At reboot (runs once when the system starts)";
    if (!parsed) return "Invalid cron expression";

    const { minutes, hours, doms, months, dows } = parsed;
    const allMins = Array.from({ length: 60 }, (_, i) => i);
    const allHours = Array.from({ length: 24 }, (_, i) => i);
    const allDoms = Array.from({ length: 31 }, (_, i) => i + 1);
    const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
    const allDows = [0, 1, 2, 3, 4, 5, 6];

    const parts: string[] = [];

    // Minutes
    const minDesc = describeField(minutes, allMins, "minute");
    // Hours
    const hourDesc = describeField(hours, allHours, "hour");
    // Day
    const domWild = doms.length === 31;
    const dowWild = dows.length === 7;
    let dayDesc = "";
    if (!domWild) dayDesc = `on day-of-month ${doms.slice(0, 5).join(", ")}${doms.length > 5 ? "…" : ""}`;
    if (!dowWild) {
        const dowLabels = dows.map(d => DAYS[d]);
        const d = dowLabels.length <= 3
            ? `on ${dowLabels.slice(0, -1).join(", ")}${dowLabels.length > 1 ? " and " : ""}${dowLabels.at(-1)}`
            : `on ${dowLabels.length} days of the week`;
        dayDesc = dayDesc ? `${dayDesc} and ${d}` : d;
    }
    // Month
    const monthWild = months.length === 12;
    const monthDesc = monthWild
        ? ""
        : `in ${months.map(m => MONTHS[m - 1]).slice(0, 4).join(", ")}${months.length > 4 ? "…" : ""}`;

    parts.push(`At ${minDesc} past ${hourDesc}`);
    if (dayDesc) parts.push(dayDesc);
    if (monthDesc) parts.push(monthDesc);

    return parts.join(", ");
}

// ─── Component ───────────────────────────────────────────────────────────────

const FIELD_LABELS = [
    { label: "Minute", hint: "0-59", example: "0, */5, 15-30" },
    { label: "Hour", hint: "0-23", example: "0, */2, 8-18" },
    { label: "Day of month", hint: "1-31", example: "1, 15, */7" },
    { label: "Month", hint: "1-12", example: "1, 6-12, */3" },
    { label: "Day of week", hint: "0-7", example: "0=Sun, 1=Mon…7=Sun" },
];

export default function CrontabTool() {
    const [expr, setExpr] = useState("*/5 * * * *");

    const parsed = useMemo(() => parseCron(expr), [expr]);
    const description = useMemo(() => humanReadable(expr, parsed), [expr, parsed]);
    const nextRuns = useMemo(() => parsed ? getNextRuns(parsed, 8) : [], [parsed]);
    const isValid = expr.trim().toLowerCase() === "@reboot" || parsed !== null;

    const fields = expr.trim().toLowerCase() === "@reboot" ? [] : expr.trim().split(/\s+/);

    const setField = (i: number, val: string) => {
        const f = expr.trim().split(/\s+/);
        while (f.length < 5) f.push("*");
        f[i] = val || "*";
        setExpr(f.join(" "));
    };

    const fmt = (d: Date) => d.toLocaleString(undefined, {
        weekday: "short", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900">
            <nav className="border-b border-emerald-900/50 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/tools" className="text-emerald-400 hover:text-white transition-colors">← Back</Link>
                    <h1 className="text-xl font-bold text-white">⏲️ Crontab Expression Editor</h1>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto p-6 space-y-6">

                {/* Main input */}
                <div className="bg-slate-800/60 rounded-2xl p-6 border border-emerald-900/40 space-y-4">
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={expr}
                            onChange={e => setExpr(e.target.value)}
                            spellCheck={false}
                            className={`flex-1 font-mono text-2xl px-5 py-4 rounded-xl border bg-slate-900 text-white focus:outline-none transition-colors ${isValid ? "border-emerald-600 focus:border-emerald-400" : "border-red-600"
                                }`}
                            placeholder="* * * * *"
                        />
                        {isValid
                            ? <span className="text-emerald-400 text-sm font-medium px-3 py-1 bg-emerald-900/40 rounded-full border border-emerald-700/50">✓ valid</span>
                            : <span className="text-red-400 text-sm font-medium px-3 py-1 bg-red-900/40 rounded-full border border-red-700/50">✗ invalid</span>
                        }
                    </div>

                    {/* Field labels */}
                    {fields.length === 5 && (
                        <div className="grid grid-cols-5 gap-1 px-1">
                            {fields.map((f, i) => (
                                <div key={i} className="text-center">
                                    <div className="font-mono text-emerald-300 text-sm font-bold">{f}</div>
                                    <div className="text-slate-500 text-xs mt-0.5">{FIELD_LABELS[i].label}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Human-readable */}
                    <div className={`px-4 py-3 rounded-xl text-lg font-medium ${isValid ? "bg-emerald-900/20 text-emerald-200 border border-emerald-800/40" : "bg-red-900/20 text-red-300 border border-red-800/40"}`}>
                        {description}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Next run times */}
                    <div className="bg-slate-800/50 rounded-2xl p-5 border border-emerald-900/30">
                        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                            🕒 Next {nextRuns.length} Scheduled Runs
                        </h2>
                        {nextRuns.length === 0 ? (
                            <p className="text-slate-500 text-sm">Enter a valid cron expression to see upcoming runs.</p>
                        ) : (
                            <ol className="space-y-2">
                                {nextRuns.map((d, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${i === 0 ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-400"}`}>{i + 1}</span>
                                        <span className={`font-mono text-sm ${i === 0 ? "text-emerald-300" : "text-slate-300"}`}>{fmt(d)}</span>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>

                    {/* Field editor */}
                    <div className="bg-slate-800/50 rounded-2xl p-5 border border-emerald-900/30">
                        <h2 className="text-white font-semibold mb-4">🛠️ Field Editor</h2>
                        <div className="space-y-3">
                            {FIELD_LABELS.map((fl, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-28 shrink-0">
                                        <div className="text-slate-300 text-xs font-medium">{fl.label}</div>
                                        <div className="text-slate-600 text-xs">{fl.hint}</div>
                                    </div>
                                    <input
                                        type="text"
                                        value={fields[i] ?? "*"}
                                        onChange={e => setField(i, e.target.value)}
                                        placeholder="*"
                                        spellCheck={false}
                                        className="flex-1 font-mono text-sm px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-emerald-300 focus:border-emerald-500 focus:outline-none"
                                    />
                                    <div className="text-slate-600 text-xs w-24 hidden lg:block">{fl.example}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Presets */}
                <div className="bg-slate-800/50 rounded-2xl p-5 border border-emerald-900/30">
                    <h2 className="text-white font-semibold mb-4">⚡ Common Presets</h2>
                    <div className="flex flex-wrap gap-2">
                        {PRESETS.map(p => (
                            <button
                                key={p.value}
                                onClick={() => setExpr(p.value)}
                                className={`px-3 py-2 rounded-lg text-sm transition-colors border ${expr === p.value
                                        ? "border-emerald-500 bg-emerald-900/40 text-emerald-300"
                                        : "border-slate-700 bg-slate-700/40 text-slate-300 hover:border-emerald-700 hover:text-white"
                                    }`}
                            >
                                <span className="font-mono text-xs text-slate-500 mr-1.5">{p.value}</span>
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Aliases */}
                    <div className="mt-4 pt-4 border-t border-slate-700">
                        <p className="text-slate-500 text-xs mb-2">Special aliases:</p>
                        <div className="flex flex-wrap gap-2">
                            {["@yearly", "@monthly", "@weekly", "@daily", "@hourly", "@reboot"].map(a => (
                                <button
                                    key={a}
                                    onClick={() => setExpr(a)}
                                    className={`font-mono px-3 py-1.5 rounded-lg text-xs border transition-colors ${expr === a
                                            ? "border-emerald-500 bg-emerald-900/40 text-emerald-300"
                                            : "border-slate-700 bg-slate-800 text-slate-400 hover:border-emerald-700 hover:text-white"
                                        }`}
                                >
                                    {a}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Reference table */}
                <div className="bg-slate-800/50 rounded-2xl p-5 border border-emerald-900/30">
                    <h2 className="text-white font-semibold mb-4">📖 Quick Reference</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-emerald-400 text-sm font-medium mb-2">Field positions</h3>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-slate-500 text-xs">
                                        <th className="text-left py-1">Position</th>
                                        <th className="text-left py-1">Field</th>
                                        <th className="text-left py-1">Allowed</th>
                                    </tr>
                                </thead>
                                <tbody className="font-mono">
                                    {[
                                        ["1st", "Minute", "0–59"],
                                        ["2nd", "Hour", "0–23"],
                                        ["3rd", "Day of month", "1–31"],
                                        ["4th", "Month", "1–12"],
                                        ["5th", "Day of week", "0–7 (0,7=Sun)"],
                                    ].map(([pos, field, allowed]) => (
                                        <tr key={pos} className="border-t border-slate-800">
                                            <td className="py-1.5 text-slate-500 text-xs">{pos}</td>
                                            <td className="py-1.5 text-slate-300 text-xs">{field}</td>
                                            <td className="py-1.5 text-emerald-400 text-xs">{allowed}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div>
                            <h3 className="text-emerald-400 text-sm font-medium mb-2">Special characters</h3>
                            <table className="w-full text-sm">
                                <tbody className="font-mono">
                                    {[
                                        ["*", "Any value"],
                                        [",", "List e.g. 1,3,5"],
                                        ["-", "Range e.g. 1-5"],
                                        ["/", "Step e.g. */5"],
                                    ].map(([char, desc]) => (
                                        <tr key={char} className="border-t border-slate-800">
                                            <td className="py-1.5 w-12 text-emerald-400 text-lg font-bold">{char}</td>
                                            <td className="py-1.5 text-slate-300 text-xs">{desc}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <ToolFAQ faqs={[
                    { question: "What is a cron expression?", answer: "A cron expression is a string of 5 fields (minute, hour, day-of-month, month, day-of-week) that defines when a scheduled task (cron job) should run on Unix/Linux systems. The cron daemon reads these expressions and runs the associated command at the specified times." },
                    { question: "What does */ mean?", answer: "The / character defines a step. */5 in the minute field means 'every 5 minutes' (0, 5, 10, 15…). */2 in the hour field means 'every 2 hours'. You can also use ranges: 10-30/5 means every 5 minutes between minute 10 and 30." },
                    { question: "How do I run a job on weekdays only?", answer: "Put 1-5 in the day-of-week field. For example: '0 9 * * 1-5' runs at 9:00 AM every weekday (Monday through Friday). The day-of-week field uses 0=Sunday, 1=Monday … 6=Saturday, 7=Sunday." },
                    { question: "What are the @yearly, @monthly, etc. shortcuts?", answer: "@yearly (same as 0 0 1 1 *) runs once a year on Jan 1. @monthly runs on the 1st of each month. @weekly runs every Sunday midnight. @daily runs every midnight. @hourly runs at the start of every hour. @reboot runs once at system startup." },
                ]} />

                <div className="my-6">
                    <AdBanner slot="4817652390" format="rectangle" />
                </div>
                <SupportBanner />
                <EmailCapture source="crontab" />
                <div className="mt-6 flex items-center justify-center">
                    <ShareButtons title="Crontab Expression Editor - VedaWell Tools" text="I just used the free Crontab editor on VedaWell! Check it out:" />
                </div>
                <JsonLd type="SoftwareApplication" data={{ name: "Crontab Expression Editor", description: "Parse and build cron expressions with live description and next run times.", applicationCategory: "DeveloperApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }} />
            </main>
        </div>
    );
}
