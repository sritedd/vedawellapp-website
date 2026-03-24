"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface TimelineBenchmarkProps {
    projectId: string;
    stateCode?: string;
    buildCategory?: string;
}

interface StageRow {
    name: string;
    status: string;
    created_at: string;
    expected_start_date?: string;
    expected_end_date?: string;
    completion_date?: string;
}

// Industry average durations (weeks) for each stage — Australian residential new build
const INDUSTRY_BENCHMARKS: Record<string, { weeks: number; label: string }> = {
    site_start: { weeks: 2, label: "Site Start" },
    slab: { weeks: 4, label: "Base/Slab" },
    frame: { weeks: 4, label: "Frame" },
    lockup: { weeks: 6, label: "Lockup" },
    pre_plasterboard: { weeks: 2, label: "Pre-Plasterboard" },
    fixing: { weeks: 8, label: "Fixing" },
    practical_completion: { weeks: 4, label: "Practical Completion" },
};

function normalizeStage(name: string): string {
    return name.toLowerCase().replace(/[\s/]+/g, "_").replace(/[^a-z_]/g, "");
}

function weeksBetween(start: string, end: string): number {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(0, Math.round((ms / (7 * 24 * 60 * 60 * 1000)) * 10) / 10);
}

function daysBetween(start: string, end: string): number {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(0, Math.round(ms / (24 * 60 * 60 * 1000)));
}

interface StageAnalysis {
    name: string;
    actualWeeks: number | null; // null = still in progress
    benchmarkWeeks: number;
    status: "completed" | "in_progress" | "pending";
    startDate: string | null;
    endDate: string | null;
    delta: number | null; // positive = slower, negative = faster
}

export default function TimelineBenchmark({ projectId, stateCode = "NSW" }: TimelineBenchmarkProps) {
    const [stages, setStages] = useState<StageRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [projectStart, setProjectStart] = useState<string | null>(null);

    useEffect(() => {
        async function fetch() {
            const supabase = createClient();

            const { data: stageData } = await supabase
                .from("stages")
                .select("name, status, created_at, expected_start_date, expected_end_date, completion_date")
                .eq("project_id", projectId)
                .order("order_index", { ascending: true });

            if (stageData && stageData.length > 0) {
                setStages(stageData);
                setProjectStart(stageData[0].created_at);
            }

            // Also get project start_date
            const { data: proj } = await supabase
                .from("projects")
                .select("start_date")
                .eq("id", projectId)
                .single();

            if (proj?.start_date) {
                setProjectStart(proj.start_date);
            }

            setLoading(false);
        }
        fetch();
    }, [projectId]);

    if (loading) {
        return <div className="animate-pulse h-64 bg-muted/30 rounded-xl" />;
    }

    if (stages.length === 0) {
        return (
            <div className="p-6 bg-card border border-border rounded-xl text-center">
                <p className="text-muted-foreground">No stages configured yet. Timeline benchmarking will appear once your build stages are set up.</p>
            </div>
        );
    }

    // Build analysis for each stage
    const analysis: StageAnalysis[] = stages.map((stage, idx) => {
        const key = normalizeStage(stage.name);
        const benchmark = INDUSTRY_BENCHMARKS[key] || { weeks: 4, label: stage.name };

        let startDate: string | null = null;
        let endDate: string | null = null;
        let actualWeeks: number | null = null;

        // Use completion_date if available, otherwise use next stage's created_at
        if (stage.status === "completed" || stage.status === "verified") {
            startDate = stage.expected_start_date || stage.created_at;
            endDate = stage.completion_date || stage.expected_end_date || (idx + 1 < stages.length ? stages[idx + 1].created_at : null);
            if (startDate && endDate) {
                actualWeeks = weeksBetween(startDate, endDate);
            }
        } else if (stage.status === "in_progress") {
            startDate = stage.expected_start_date || stage.created_at;
            actualWeeks = weeksBetween(startDate, new Date().toISOString());
        }

        const delta = actualWeeks !== null ? Math.round((actualWeeks - benchmark.weeks) * 10) / 10 : null;

        return {
            name: benchmark.label || stage.name,
            actualWeeks,
            benchmarkWeeks: benchmark.weeks,
            status: (stage.status === "completed" || stage.status === "verified")
                ? "completed"
                : stage.status === "in_progress"
                    ? "in_progress"
                    : "pending",
            startDate,
            endDate,
            delta,
        };
    });

    // Overall stats
    const completed = analysis.filter(a => a.status === "completed");
    const totalActual = completed.reduce((s, a) => s + (a.actualWeeks || 0), 0);
    const totalBenchmark = completed.reduce((s, a) => s + a.benchmarkWeeks, 0);
    const overallDelta = totalBenchmark > 0 ? Math.round((totalActual - totalBenchmark) * 10) / 10 : 0;
    const currentStage = analysis.find(a => a.status === "in_progress");

    // Total project elapsed
    const projectElapsedDays = projectStart ? daysBetween(projectStart, new Date().toISOString()) : 0;
    const totalBenchmarkWeeksAll = analysis.reduce((s, a) => s + a.benchmarkWeeks, 0);

    // Max width for bar scaling
    const maxWeeks = Math.max(...analysis.map(a => Math.max(a.actualWeeks || 0, a.benchmarkWeeks)), 1);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Builder Speed vs Industry</h2>
                <p className="text-muted-foreground text-sm">
                    Compare your builder&apos;s pace against {stateCode} residential averages
                </p>
            </div>

            {/* Overall verdict */}
            <div className={`p-5 rounded-xl border-2 ${
                overallDelta <= 0
                    ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
                    : overallDelta <= 2
                        ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
                        : "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
            }`}>
                <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                        overallDelta <= 0
                            ? "bg-green-500 text-white"
                            : overallDelta <= 2
                                ? "bg-amber-500 text-white"
                                : "bg-red-500 text-white"
                    }`}>
                        {overallDelta <= 0 ? (
                            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">
                            {completed.length === 0
                                ? "No completed stages yet"
                                : overallDelta <= 0
                                    ? `${Math.abs(overallDelta)} weeks ahead of schedule`
                                    : overallDelta <= 2
                                        ? `${overallDelta} weeks behind — within normal range`
                                        : `${overallDelta} weeks behind schedule`}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {projectElapsedDays > 0 && `Day ${projectElapsedDays} of build`}
                            {completed.length > 0 && ` | ${completed.length}/${analysis.length} stages complete`}
                            {totalBenchmarkWeeksAll > 0 && ` | Industry total: ~${totalBenchmarkWeeksAll} weeks`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stage-by-stage comparison */}
            <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-bold mb-4">Stage-by-Stage Breakdown</h3>
                <div className="space-y-4">
                    {analysis.map((stage) => {
                        const actualPct = maxWeeks > 0 ? Math.min(((stage.actualWeeks || 0) / maxWeeks) * 100, 100) : 0;
                        const benchPct = maxWeeks > 0 ? Math.min((stage.benchmarkWeeks / maxWeeks) * 100, 100) : 0;

                        return (
                            <div key={stage.name} className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${
                                            stage.status === "completed" ? "bg-green-500" :
                                            stage.status === "in_progress" ? "bg-blue-500 animate-pulse" :
                                            "bg-gray-300"
                                        }`} />
                                        <span className={`text-sm font-medium ${stage.status === "pending" ? "text-muted-foreground" : ""}`}>
                                            {stage.name}
                                        </span>
                                        {stage.status === "in_progress" && (
                                            <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">Current</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {stage.actualWeeks !== null
                                            ? `${stage.actualWeeks}w actual`
                                            : "—"
                                        }
                                        {" / "}
                                        {stage.benchmarkWeeks}w avg
                                        {stage.delta !== null && stage.delta !== 0 && (
                                            <span className={`ml-1 font-medium ${
                                                stage.delta <= 0 ? "text-green-600" : stage.delta <= 1 ? "text-amber-600" : "text-red-600"
                                            }`}>
                                                ({stage.delta > 0 ? "+" : ""}{stage.delta}w)
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {/* Dual bar */}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground w-10">Actual</span>
                                        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${
                                                    stage.status === "pending" ? "bg-gray-300" :
                                                    stage.delta !== null && stage.delta > 1 ? "bg-red-400" :
                                                    stage.delta !== null && stage.delta > 0 ? "bg-amber-400" :
                                                    "bg-green-400"
                                                }`}
                                                style={{ width: `${actualPct}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground w-10">Avg</span>
                                        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-blue-300/50 dark:bg-blue-700/30"
                                                style={{ width: `${benchPct}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Current stage callout */}
            {currentStage && currentStage.actualWeeks !== null && (
                <div className={`p-4 rounded-xl border ${
                    currentStage.actualWeeks > currentStage.benchmarkWeeks
                        ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
                        : "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
                }`}>
                    <h4 className="font-bold text-sm mb-1">
                        {currentStage.name} — Week {Math.ceil(currentStage.actualWeeks)} of ~{currentStage.benchmarkWeeks}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                        {currentStage.actualWeeks <= currentStage.benchmarkWeeks
                            ? "On track. Your builder is progressing at a normal pace for this stage."
                            : `This stage has been going ${Math.round(currentStage.actualWeeks - currentStage.benchmarkWeeks)} weeks longer than average. Consider asking your builder for a timeline update.`
                        }
                    </p>
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-green-400" /> Ahead/On time
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-amber-400" /> Slightly behind
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-red-400" /> Behind schedule
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-blue-300/50 dark:bg-blue-700/30" /> Industry average
                </div>
            </div>

            <div className="p-3 bg-muted/20 rounded-lg text-xs text-muted-foreground">
                Industry averages based on {stateCode} residential construction benchmarks.
                Actual timelines vary based on weather, material availability, and project complexity.
            </div>
        </div>
    );
}
