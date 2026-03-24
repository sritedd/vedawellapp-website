"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface ProjectHealthScoreProps {
    projectId: string;
}

interface SubScore {
    label: string;
    value: number;
    max: 25;
    issue?: string;
}

export default function ProjectHealthScore({ projectId }: ProjectHealthScoreProps) {
    const [totalScore, setTotalScore] = useState<number | null>(null);
    const [subScores, setSubScores] = useState<SubScore[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchHealthData() {
            const supabase = createClient();

            const [defectsRes, stagesRes, inspectionsRes, paymentsRes, commsRes] =
                await Promise.all([
                    supabase
                        .from("defects")
                        .select("id, status")
                        .eq("project_id", projectId),
                    supabase
                        .from("stages")
                        .select("id, status")
                        .eq("project_id", projectId),
                    supabase
                        .from("inspections")
                        .select("id, result")
                        .eq("project_id", projectId),
                    supabase
                        .from("payments")
                        .select("id, status")
                        .eq("project_id", projectId),
                    supabase
                        .from("communication_log")
                        .select("id, created_at")
                        .eq("project_id", projectId)
                        .gte(
                            "created_at",
                            new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
                        ),
                ]);

            const defects = defectsRes.data || [];
            const stages = stagesRes.data || [];
            const inspections = inspectionsRes.data || [];
            const payments = paymentsRes.data || [];
            const comms = commsRes.data || [];

            const totalDefects = defects.length;
            const openDefects = defects.filter(
                (d: { status: string }) => d.status === "open" || d.status === "in_progress"
            ).length;
            const totalStages = stages.length;
            const completedStages = stages.filter(
                (s: { status: string }) => s.status === "completed"
            ).length;
            const totalInspections = inspections.length;
            const passedInspections = inspections.filter(
                (i: { result?: string }) => i.result === "passed"
            ).length;
            const hasOverduePayment = payments.some(
                (p: { status: string }) => p.status === "blocked"
            );
            const commCount = comms.length;

            // Build Progress (0-25)
            const buildProgress: SubScore = {
                label: "Build Progress",
                value:
                    totalStages > 0
                        ? Math.round((completedStages / totalStages) * 25)
                        : 0,
                max: 25,
            };
            if (buildProgress.value < 15) {
                buildProgress.issue =
                    totalStages === 0
                        ? "No stages set up"
                        : `Only ${completedStages}/${totalStages} stages done`;
            }

            // Defect Control (0-25)
            const defectControl: SubScore = {
                label: "Defect Control",
                value:
                    totalDefects === 0
                        ? 25
                        : Math.round(
                              ((totalDefects - openDefects) / totalDefects) * 25
                          ),
                max: 25,
            };
            if (defectControl.value < 15) {
                defectControl.issue = `${openDefects} open defect${openDefects !== 1 ? "s" : ""} unresolved`;
            }

            // Inspection Pass Rate (0-25)
            const inspectionRate: SubScore = {
                label: "Inspection Pass Rate",
                value:
                    totalInspections === 0
                        ? 25
                        : Math.round(
                              (passedInspections / totalInspections) * 25
                          ),
                max: 25,
            };
            if (inspectionRate.value < 15) {
                inspectionRate.issue = `Only ${passedInspections}/${totalInspections} inspections passed`;
            }

            // Engagement (0-25)
            let engagementValue = Math.min(25, commCount * 5);
            if (hasOverduePayment) engagementValue = Math.max(0, engagementValue - 10);
            const engagement: SubScore = {
                label: "Engagement",
                value: engagementValue,
                max: 25,
            };
            if (engagement.value < 15) {
                const issues: string[] = [];
                if (commCount < 3) issues.push("Low communication activity");
                if (hasOverduePayment) issues.push("Overdue payment");
                engagement.issue = issues.join("; ");
            }

            const scores = [buildProgress, defectControl, inspectionRate, engagement];
            const total = scores.reduce((sum, s) => sum + s.value, 0);

            setSubScores(scores);
            setTotalScore(total);
            setLoading(false);
        }

        fetchHealthData();
    }, [projectId]);

    if (loading) {
        return (
            <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
                <div className="h-6 bg-muted rounded w-48 mb-4" />
                <div className="h-24 bg-muted rounded-full w-24 mx-auto mb-4" />
                <div className="space-y-2">
                    <div className="h-3 bg-muted rounded" />
                    <div className="h-3 bg-muted rounded" />
                    <div className="h-3 bg-muted rounded" />
                    <div className="h-3 bg-muted rounded" />
                </div>
            </div>
        );
    }

    if (totalScore === null) return null;

    const scoreColor =
        totalScore >= 80
            ? "text-green-500"
            : totalScore >= 60
              ? "text-amber-500"
              : "text-red-500";
    const strokeColor =
        totalScore >= 80
            ? "stroke-green-500"
            : totalScore >= 60
              ? "stroke-amber-500"
              : "stroke-red-500";
    const verdict =
        totalScore >= 80
            ? "Excellent"
            : totalScore >= 70
              ? "Good"
              : totalScore >= 60
                ? "Needs Attention"
                : "At Risk";

    const issues = subScores.filter((s) => s.issue);

    // SVG circle gauge values
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (totalScore / 100) * circumference;

    return (
        <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-base font-semibold mb-4">Project Health Score</h3>

            <div className="flex items-center gap-6">
                {/* Circular Gauge */}
                <div className="relative flex-shrink-0">
                    <svg width="100" height="100" className="-rotate-90">
                        <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            strokeWidth="8"
                            className="stroke-muted"
                        />
                        <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={dashOffset}
                            className={`${strokeColor} transition-all duration-1000`}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-2xl font-bold ${scoreColor}`}>
                            {totalScore}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                            / 100
                        </span>
                    </div>
                </div>

                {/* Sub-score bars */}
                <div className="flex-1 space-y-2.5">
                    {subScores.map((sub) => {
                        const pct = (sub.value / 25) * 100;
                        const barColor =
                            pct >= 70
                                ? "bg-green-500"
                                : pct >= 50
                                  ? "bg-amber-500"
                                  : "bg-red-500";
                        return (
                            <div key={sub.label}>
                                <div className="flex justify-between text-xs mb-0.5">
                                    <span className="text-muted-foreground">
                                        {sub.label}
                                    </span>
                                    <span className="font-medium">
                                        {sub.value}/25
                                    </span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Verdict */}
            <div className="mt-4 flex items-center justify-between">
                <span className={`text-sm font-semibold ${scoreColor}`}>
                    {verdict}
                </span>
                {issues.length > 0 && (
                    <span className="text-xs text-muted-foreground max-w-[60%] text-right">
                        {issues.map((s) => s.issue).join(" | ")}
                    </span>
                )}
            </div>
        </div>
    );
}
