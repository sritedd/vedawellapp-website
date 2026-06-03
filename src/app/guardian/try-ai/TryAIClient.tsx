"use client";

import { useState } from "react";

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] as const;
const STAGES = [
    "Pre-construction",
    "Site Start",
    "Slab / Footings",
    "Frame",
    "Lockup",
    "Pre-Plasterboard",
    "Fixing",
    "Practical Completion",
    "Warranty",
];

interface DefectAnalysis {
    improvedDescription: string;
    severity: "critical" | "major" | "minor" | "cosmetic";
    category: string;
    location: string;
    recommendedAction: string;
    isUrgent: boolean;
    australianStandard?: string;
}

const SAMPLES = [
    "Builder poured concrete on the slab today but the inspector never came out. The footing inspection was supposed to happen first.",
    "I noticed a hairline crack on the new garage wall, about 30cm long, running diagonally from the top corner. The house is 4 months old.",
    "Frame stage just finished and I can see two studs in the lounge wall that look twisted. The plaster will go on next week.",
];

const SEVERITY_COLOURS: Record<string, string> = {
    critical: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-200 dark:border-red-800",
    major: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800",
    minor: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-800",
    cosmetic: "bg-muted text-muted-foreground border-border",
};

export default function TryAIClient() {
    const [description, setDescription] = useState("");
    const [stage, setStage] = useState("");
    const [state, setState] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<DefectAnalysis | null>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch("/api/guardian/ai/describe-defect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description: description.trim(),
                    stage: stage || undefined,
                    state: state || undefined,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Something went wrong. Please try again.");
                return;
            }
            setResult(data);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={submit} className="rounded-2xl bg-card border border-border p-5 md:p-6 space-y-4">
                <div>
                    <label htmlFor="description" className="block text-sm font-semibold mb-1">
                        Describe what you&apos;ve seen <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={loading}
                        rows={5}
                        maxLength={2000}
                        placeholder="e.g. The builder said the inspection happened yesterday but I haven't seen any paperwork…"
                        className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs text-muted-foreground self-center">Or try:</span>
                        {SAMPLES.map((sample, i) => (
                            <button
                                key={i}
                                type="button"
                                disabled={loading}
                                onClick={() => setDescription(sample)}
                                className="text-xs px-2.5 py-1 rounded-full border border-border bg-muted/30 hover:bg-muted/50 text-muted-foreground transition-colors"
                            >
                                Sample {i + 1}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="stage" className="block text-xs font-medium text-muted-foreground mb-1">
                            Build stage (optional)
                        </label>
                        <select
                            id="stage"
                            value={stage}
                            onChange={(e) => setStage(e.target.value)}
                            disabled={loading}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">— Not sure —</option>
                            {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="state" className="block text-xs font-medium text-muted-foreground mb-1">
                            State (optional)
                        </label>
                        <select
                            id="state"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            disabled={loading}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">— Any —</option>
                            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm dark:bg-red-950/30 dark:border-red-800 dark:text-red-300">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || !description.trim()}
                    className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                    {loading ? "Analysing…" : "Analyse with AI"}
                </button>
            </form>

            {result && (
                <div className="rounded-2xl bg-card border border-border p-5 md:p-6 space-y-4 animate-fade-in">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                        <h3 className="text-lg font-bold">Analysis</h3>
                        <div className="flex gap-2">
                            <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold uppercase ${SEVERITY_COLOURS[result.severity] || SEVERITY_COLOURS.cosmetic}`}>
                                {result.severity}
                            </span>
                            {result.isUrgent && (
                                <span className="text-xs px-2.5 py-1 rounded-full border border-red-400 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200 font-bold uppercase">
                                    Urgent
                                </span>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Professional description</div>
                        <p className="text-sm leading-relaxed">{result.improvedDescription}</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Category</div>
                            <p className="text-sm capitalize">{result.category}</p>
                        </div>
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Location</div>
                            <p className="text-sm">{result.location}</p>
                        </div>
                    </div>

                    <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                        <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Recommended action</div>
                        <p className="text-sm leading-relaxed text-foreground">{result.recommendedAction}</p>
                    </div>

                    {result.australianStandard && (
                        <div className="text-xs text-muted-foreground">
                            Reference standard: <span className="font-mono">{result.australianStandard}</span>
                        </div>
                    )}

                    <div className="pt-3 border-t border-border flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                            Like what you see? Set up your project to log unlimited defects.
                        </p>
                        <a
                            href="/guardian/projects/new"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm whitespace-nowrap"
                        >
                            Start your project →
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
