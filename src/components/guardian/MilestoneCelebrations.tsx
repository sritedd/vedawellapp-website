"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface MilestoneCelebrationsProps {
    projectId: string;
    projectName: string;
}

interface MilestoneData {
    defectCount: number;
    checkinCount: number;
    photoCount: number;
    completedStages: number;
    totalStages: number;
}

interface Milestone {
    id: string;
    label: string;
    check: (d: MilestoneData) => boolean;
    icon: string;
}

const MILESTONES: Milestone[] = [
    { id: "first_defect", label: "First Defect Logged", check: (d) => d.defectCount >= 1, icon: "\u{1F6E0}\u{FE0F}" },
    { id: "five_defects", label: "Diligent Inspector", check: (d) => d.defectCount >= 5, icon: "\u{1F50D}" },
    { id: "first_checkin", label: "First Weekly Check-in", check: (d) => d.checkinCount >= 1, icon: "\u{1F4CB}" },
    { id: "four_checkins", label: "Monthly Streak", check: (d) => d.checkinCount >= 4, icon: "\u{1F525}" },
    { id: "first_photo", label: "Documenter", check: (d) => d.photoCount >= 1, icon: "\u{1F4F8}" },
    { id: "stage_complete", label: "Stage Completed", check: (d) => d.completedStages >= 1, icon: "\u{1F3D7}\u{FE0F}" },
    { id: "half_done", label: "Halfway There!", check: (d) => d.totalStages > 0 && d.completedStages >= d.totalStages / 2, icon: "\u{1F3AF}" },
    { id: "all_stages", label: "Build Complete!", check: (d) => d.totalStages > 0 && d.completedStages === d.totalStages, icon: "\u{1F3E0}" },
];

function getStorageKey(projectId: string) {
    return `guardian-milestones-${projectId}`;
}

function getCelebratedMilestones(projectId: string): Set<string> {
    try {
        const raw = localStorage.getItem(getStorageKey(projectId));
        if (!raw) return new Set();
        return new Set(JSON.parse(raw));
    } catch {
        return new Set();
    }
}

function saveCelebratedMilestones(projectId: string, ids: Set<string>) {
    try {
        localStorage.setItem(getStorageKey(projectId), JSON.stringify([...ids]));
    } catch {
        // localStorage unavailable
    }
}

export default function MilestoneCelebrations({ projectId, projectName }: MilestoneCelebrationsProps) {
    const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set());
    const [newMilestones, setNewMilestones] = useState<Milestone[]>([]);
    const [visibleBanner, setVisibleBanner] = useState<Milestone | null>(null);
    const [bannerAnimating, setBannerAnimating] = useState(false);
    const [loading, setLoading] = useState(true);

    const dismissBanner = useCallback(() => {
        setBannerAnimating(false);
        setTimeout(() => setVisibleBanner(null), 300);
    }, []);

    useEffect(() => {
        async function fetchMilestoneData() {
            const supabase = createClient();

            const [defectsRes, checkinsRes, photosRes, stagesRes] =
                await Promise.all([
                    supabase
                        .from("defects")
                        .select("id", { count: "exact", head: true })
                        .eq("project_id", projectId),
                    supabase
                        .from("weekly_checkins")
                        .select("id", { count: "exact", head: true })
                        .eq("project_id", projectId),
                    supabase
                        .from("progress_photos")
                        .select("id", { count: "exact", head: true })
                        .eq("project_id", projectId),
                    supabase
                        .from("stages")
                        .select("id, status")
                        .eq("project_id", projectId),
                ]);

            const data: MilestoneData = {
                defectCount: defectsRes.count ?? 0,
                checkinCount: checkinsRes.count ?? 0,
                photoCount: photosRes.count ?? 0,
                completedStages: (stagesRes.data || []).filter(
                    (s: { status: string }) => s.status === "completed"
                ).length,
                totalStages: (stagesRes.data || []).length,
            };

            const celebrated = getCelebratedMilestones(projectId);
            const earned = new Set<string>();
            const justEarned: Milestone[] = [];

            for (const m of MILESTONES) {
                if (m.check(data)) {
                    earned.add(m.id);
                    if (!celebrated.has(m.id)) {
                        justEarned.push(m);
                    }
                }
            }

            // Mark all newly earned as celebrated
            if (justEarned.length > 0) {
                const updated = new Set([...celebrated, ...earned]);
                saveCelebratedMilestones(projectId, updated);
            }

            setEarnedIds(earned);
            setNewMilestones(justEarned);
            setLoading(false);
        }

        fetchMilestoneData();
    }, [projectId]);

    // Show new milestone banners one at a time
    useEffect(() => {
        if (newMilestones.length === 0 || visibleBanner) return;

        const next = newMilestones[0];
        setVisibleBanner(next);
        // Trigger slide-in animation
        requestAnimationFrame(() => {
            setBannerAnimating(true);
        });

        // Auto-dismiss after 5 seconds
        const timer = setTimeout(() => {
            dismissBanner();
            // Remove from queue
            setNewMilestones((prev) => prev.slice(1));
        }, 5000);

        return () => clearTimeout(timer);
    }, [newMilestones, visibleBanner, dismissBanner]);

    if (loading) return null;

    return (
        <div className="space-y-3">
            {/* Celebration Banner */}
            {visibleBanner && (
                <div
                    className={`rounded-xl border-2 border-primary/30 bg-primary/5 p-4 flex items-center gap-3 transition-all duration-300 ${
                        bannerAnimating
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 -translate-y-4"
                    }`}
                >
                    <span className="text-3xl">{visibleBanner.icon}</span>
                    <div className="flex-1">
                        <p className="text-xs font-medium text-primary uppercase tracking-wider">
                            Achievement Unlocked
                        </p>
                        <p className="text-sm font-semibold">
                            {visibleBanner.label}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            dismissBanner();
                            setNewMilestones((prev) => prev.slice(1));
                        }}
                        className="text-muted-foreground hover:text-foreground p-1"
                        aria-label="Dismiss"
                    >
                        <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Achievements Grid */}
            <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold mb-3">Achievements</h3>
                <div className="grid grid-cols-4 gap-2">
                    {MILESTONES.map((m) => {
                        const earned = earnedIds.has(m.id);
                        return (
                            <div
                                key={m.id}
                                title={earned ? m.label : "Locked"}
                                className={`flex flex-col items-center gap-1 p-2 rounded-lg text-center transition-colors ${
                                    earned
                                        ? "bg-primary/10 border border-primary/20"
                                        : "bg-muted/50 border border-transparent opacity-50"
                                }`}
                            >
                                <span className="text-lg">
                                    {earned ? m.icon : "?"}
                                </span>
                                <span
                                    className={`text-[10px] leading-tight ${
                                        earned
                                            ? "font-medium text-foreground"
                                            : "text-muted-foreground"
                                    }`}
                                >
                                    {earned ? m.label : "Locked"}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
