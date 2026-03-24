"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Stage {
    id: string;
    project_id: string;
    name: string;
    status: string;
    created_at: string;
    updated_at: string;
}

interface Inspection {
    id: string;
    project_id: string;
    stage: string;
    scheduled_date: string;
    result: string;
    created_at: string;
}

interface Defect {
    id: string;
    project_id: string;
    title: string;
    status: string;
    stage?: string;
    stage_name?: string;
    created_at: string;
}

interface ProgressTimelineProps {
    projectId: string;
    startDate?: string;
}

/* ------------------------------------------------------------------ */
/*  Industry standard durations (days) — AU residential                */
/* ------------------------------------------------------------------ */

const INDUSTRY_DURATIONS: Record<string, number> = {
    "site start": 14,
    "slab": 21,
    "frame": 28,
    "lockup": 35,
    "fixing": 42,
    "practical completion": 14,
};

function getExpectedDays(stageName: string): number {
    const key = stageName.toLowerCase().trim();
    return INDUSTRY_DURATIONS[key] ?? 21; // default 21 days
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function daysBetween(a: Date, b: Date): number {
    return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function formatDate(date: Date): string {
    return date.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function getMonthLabel(date: Date): string {
    return date.toLocaleDateString("en-AU", { month: "short", year: "2-digit" });
}

/** Normalise status strings to one of three canonical values */
function normaliseStatus(status: string): "completed" | "current" | "upcoming" {
    const s = status.toLowerCase().trim();
    if (s === "completed" || s === "complete" || s === "done") return "completed";
    if (s === "current" || s === "active" || s === "in_progress" || s === "in-progress") return "current";
    return "upcoming";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ProgressTimeline({ projectId, startDate }: ProgressTimelineProps) {
    const [stages, setStages] = useState<Stage[]>([]);
    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [defects, setDefects] = useState<Defect[]>([]);
    const [loading, setLoading] = useState(true);

    /* ── Fetch data ── */
    useEffect(() => {
        async function load() {
            const supabase = createClient();

            const [stagesRes, inspectionsRes, defectsRes] = await Promise.all([
                supabase
                    .from("stages")
                    .select("*")
                    .eq("project_id", projectId)
                    .order("order_index", { ascending: true }),
                supabase
                    .from("inspections")
                    .select("*")
                    .eq("project_id", projectId)
                    .order("scheduled_date", { ascending: true }),
                supabase
                    .from("defects")
                    .select("*")
                    .eq("project_id", projectId),
            ]);

            setStages(stagesRes.data ?? []);
            setInspections(inspectionsRes.data ?? []);
            setDefects(defectsRes.data ?? []);
            setLoading(false);
        }
        load();
    }, [projectId]);

    /* ── Compute timeline geometry ── */
    const timeline = useMemo(() => {
        if (stages.length === 0) return null;

        const projectStart = startDate ? new Date(startDate) : new Date(stages[0].created_at);

        // Build bar data for each stage
        let cumulativeDay = 0;
        const bars = stages.map((stage) => {
            const status = normaliseStatus(stage.status);
            const expectedDays = getExpectedDays(stage.name);

            let actualDays: number | null = null;
            if (status === "completed" && stage.updated_at && stage.created_at) {
                actualDays = Math.max(1, daysBetween(new Date(stage.created_at), new Date(stage.updated_at)));
            }

            const barStart = cumulativeDay;
            const barLength = status === "completed" ? (actualDays ?? expectedDays) : expectedDays;
            cumulativeDay += barLength;

            // Defects for this stage
            const stageKey = stage.name.toLowerCase().trim();
            const stageDefects = defects.filter((d) => {
                const dStage = (d.stage || d.stage_name || "").toLowerCase().trim();
                return dStage === stageKey;
            });
            const openDefects = stageDefects.filter(
                (d) => d.status !== "rectified" && d.status !== "verified" && d.status !== "fixed"
            );

            // Inspections for this stage
            const stageInspections = inspections.filter(
                (i) => (i.stage || "").toLowerCase().trim() === stageKey
            );

            return {
                stage,
                status,
                expectedDays,
                actualDays,
                barStart,
                barLength,
                openDefectCount: openDefects.length,
                inspections: stageInspections,
            };
        });

        const totalDays = cumulativeDay;
        const endDate = addDays(projectStart, totalDays);

        // Today marker
        const today = new Date();
        const todayOffset = daysBetween(projectStart, today);

        // Month markers
        const months: { label: string; offset: number }[] = [];
        const cursor = new Date(projectStart.getFullYear(), projectStart.getMonth(), 1);
        while (cursor <= endDate) {
            const offset = daysBetween(projectStart, cursor);
            if (offset >= 0) {
                months.push({ label: getMonthLabel(cursor), offset });
            }
            cursor.setMonth(cursor.getMonth() + 1);
        }

        return { projectStart, endDate, totalDays, todayOffset, bars, months };
    }, [stages, inspections, defects, startDate]);

    /* ── Loading state ── */
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    /* ── Empty state ── */
    if (!timeline || stages.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
                <svg className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                    <line x1="8" y1="14" x2="16" y2="14" />
                    <line x1="8" y1="18" x2="12" y2="18" />
                </svg>
                <h3 className="text-lg font-semibold mb-2">No stages configured yet</h3>
                <p className="text-muted-foreground text-sm">
                    Stages are created when you start your project. Head to the Stage Gate tab to begin.
                </p>
            </div>
        );
    }

    const { totalDays, todayOffset, bars, months } = timeline;
    const CHART_WIDTH = Math.max(800, totalDays * 6); // min 800px, ~6px per day
    const ROW_HEIGHT = 48;
    const HEADER_HEIGHT = 36;
    const CHART_HEIGHT = HEADER_HEIGHT + bars.length * ROW_HEIGHT + 16;
    const BAR_HEIGHT = 28;
    const LEFT_LABEL_WIDTH = 180;

    /** Convert a day offset to an x position in the bar area */
    const dayToX = (day: number) => {
        const barAreaWidth = CHART_WIDTH - LEFT_LABEL_WIDTH;
        return LEFT_LABEL_WIDTH + (day / totalDays) * barAreaWidth;
    };

    const statusColor = (status: "completed" | "current" | "upcoming") => {
        switch (status) {
            case "completed": return "fill-green-500";
            case "current": return "fill-teal-500";
            case "upcoming": return "fill-slate-200 dark:fill-slate-700";
        }
    };

    const statusTextColor = (status: "completed" | "current" | "upcoming") => {
        switch (status) {
            case "completed": return "text-green-700 dark:text-green-400";
            case "current": return "text-teal-700 dark:text-teal-400";
            case "upcoming": return "text-slate-500 dark:text-slate-400";
        }
    };

    return (
        <div className="rounded-xl border border-border bg-card">
            {/* Title bar */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-lg font-bold">Construction Timeline</h2>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Completed
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-teal-500 inline-block" /> Active
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-700 inline-block" /> Upcoming
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rotate-45 bg-blue-500 inline-block" /> Inspection
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Open Defect
                    </span>
                </div>
            </div>

            {/* Scrollable chart area */}
            <div className="overflow-x-auto">
                <svg
                    width={CHART_WIDTH}
                    height={CHART_HEIGHT}
                    viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                    className="text-foreground"
                    role="img"
                    aria-label="Gantt-style construction timeline"
                >
                    {/* ── Month headers ── */}
                    {months.map((m, i) => {
                        const x = dayToX(m.offset);
                        return (
                            <g key={i}>
                                <line
                                    x1={x} y1={0} x2={x} y2={CHART_HEIGHT}
                                    className="stroke-border"
                                    strokeWidth={1}
                                    strokeDasharray="4 4"
                                    opacity={0.5}
                                />
                                <text
                                    x={x + 4} y={14}
                                    className="fill-muted-foreground text-[11px]"
                                    fontFamily="inherit"
                                >
                                    {m.label}
                                </text>
                            </g>
                        );
                    })}

                    {/* ── Stage rows ── */}
                    {bars.map((bar, i) => {
                        const y = HEADER_HEIGHT + i * ROW_HEIGHT;
                        const barY = y + (ROW_HEIGHT - BAR_HEIGHT) / 2;
                        const x1 = dayToX(bar.barStart);
                        const x2 = dayToX(bar.barStart + bar.barLength);
                        const barWidth = Math.max(x2 - x1, 4);

                        return (
                            <g key={bar.stage.id}>
                                {/* Row background — alternating */}
                                {i % 2 === 1 && (
                                    <rect
                                        x={0} y={y} width={CHART_WIDTH} height={ROW_HEIGHT}
                                        className="fill-muted/20"
                                    />
                                )}

                                {/* Stage label */}
                                <text
                                    x={8} y={barY + BAR_HEIGHT / 2 + 1}
                                    dominantBaseline="middle"
                                    className="fill-foreground text-[13px] font-medium"
                                    fontFamily="inherit"
                                >
                                    {bar.stage.name}
                                </text>

                                {/* Duration label */}
                                <text
                                    x={8} y={barY + BAR_HEIGHT / 2 + 14}
                                    dominantBaseline="middle"
                                    className={`text-[10px] ${statusTextColor(bar.status)}`}
                                    fontFamily="inherit"
                                >
                                    {bar.status === "completed" && bar.actualDays != null
                                        ? `${bar.actualDays}d / ${bar.expectedDays}d expected`
                                        : `${bar.expectedDays}d expected`
                                    }
                                </text>

                                {/* Bar */}
                                <rect
                                    x={x1} y={barY} width={barWidth} height={BAR_HEIGHT}
                                    rx={6}
                                    className={statusColor(bar.status)}
                                    opacity={bar.status === "upcoming" ? 0.6 : 0.85}
                                >
                                    {bar.status === "current" && (
                                        <animate
                                            attributeName="opacity"
                                            values="0.85;0.55;0.85"
                                            dur="2s"
                                            repeatCount="indefinite"
                                        />
                                    )}
                                </rect>

                                {/* Bar label (stage name on the bar for wide bars) */}
                                {barWidth > 60 && (
                                    <text
                                        x={x1 + barWidth / 2}
                                        y={barY + BAR_HEIGHT / 2 + 1}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className={`text-[11px] font-medium ${
                                            bar.status === "upcoming"
                                                ? "fill-slate-500 dark:fill-slate-400"
                                                : "fill-white"
                                        }`}
                                        fontFamily="inherit"
                                    >
                                        {bar.stage.name}
                                    </text>
                                )}

                                {/* Inspection diamonds */}
                                {bar.inspections.map((insp) => {
                                    const inspDate = new Date(insp.scheduled_date);
                                    const stageStart = new Date(bar.stage.created_at);
                                    const inspOffset = bar.barStart + Math.max(0, daysBetween(stageStart, inspDate));
                                    const ix = dayToX(Math.min(inspOffset, bar.barStart + bar.barLength));
                                    const iy = barY - 2;
                                    return (
                                        <g key={insp.id}>
                                            <rect
                                                x={ix - 5} y={iy - 5}
                                                width={10} height={10}
                                                rx={1}
                                                transform={`rotate(45 ${ix} ${iy})`}
                                                className={
                                                    insp.result === "passed" || insp.result === "completed"
                                                        ? "fill-blue-500"
                                                        : insp.result === "failed"
                                                            ? "fill-red-500"
                                                            : "fill-blue-400"
                                                }
                                            />
                                            <title>
                                                {insp.stage} inspection — {formatDate(inspDate)} ({insp.result})
                                            </title>
                                        </g>
                                    );
                                })}

                                {/* Defect indicator */}
                                {bar.openDefectCount > 0 && (
                                    <g>
                                        <circle
                                            cx={x2 + 12} cy={barY + BAR_HEIGHT / 2}
                                            r={8}
                                            className="fill-red-500"
                                        />
                                        <text
                                            x={x2 + 12} y={barY + BAR_HEIGHT / 2 + 1}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            className="fill-white text-[10px] font-bold"
                                            fontFamily="inherit"
                                        >
                                            {bar.openDefectCount}
                                        </text>
                                        <title>{bar.openDefectCount} open defect{bar.openDefectCount > 1 ? "s" : ""}</title>
                                    </g>
                                )}
                            </g>
                        );
                    })}

                    {/* ── Today line ── */}
                    {todayOffset >= 0 && todayOffset <= totalDays && (
                        <g>
                            <line
                                x1={dayToX(todayOffset)}
                                y1={0}
                                x2={dayToX(todayOffset)}
                                y2={CHART_HEIGHT}
                                stroke="#ef4444"
                                strokeWidth={2}
                                strokeDasharray="6 3"
                            />
                            <text
                                x={dayToX(todayOffset) + 4}
                                y={HEADER_HEIGHT - 6}
                                className="fill-red-500 text-[10px] font-semibold"
                                fontFamily="inherit"
                            >
                                Today
                            </text>
                        </g>
                    )}
                </svg>
            </div>

            {/* Summary cards below the chart */}
            <div className="px-4 py-3 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="rounded-lg bg-muted/30 p-2.5 text-center">
                    <div className="text-xs text-muted-foreground">Total Stages</div>
                    <div className="text-lg font-bold">{bars.length}</div>
                </div>
                <div className="rounded-lg bg-green-500/10 p-2.5 text-center">
                    <div className="text-xs text-green-700 dark:text-green-400">Completed</div>
                    <div className="text-lg font-bold text-green-700 dark:text-green-400">
                        {bars.filter(b => b.status === "completed").length}
                    </div>
                </div>
                <div className="rounded-lg bg-teal-500/10 p-2.5 text-center">
                    <div className="text-xs text-teal-700 dark:text-teal-400">Active</div>
                    <div className="text-lg font-bold text-teal-700 dark:text-teal-400">
                        {bars.filter(b => b.status === "current").length}
                    </div>
                </div>
                <div className="rounded-lg bg-red-500/10 p-2.5 text-center">
                    <div className="text-xs text-red-700 dark:text-red-400">Open Defects</div>
                    <div className="text-lg font-bold text-red-700 dark:text-red-400">
                        {bars.reduce((sum, b) => sum + b.openDefectCount, 0)}
                    </div>
                </div>
            </div>
        </div>
    );
}
