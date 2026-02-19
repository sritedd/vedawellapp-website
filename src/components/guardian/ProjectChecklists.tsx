"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ChecklistItemCard from "./ChecklistItemCard";

interface Stage {
    id: string;
    name: string;
    status: string;
    checklist_items?: any[];
}

export default function ProjectChecklists({ projectId }: { projectId: string }) {
    const [stages, setStages] = useState<Stage[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedStage, setExpandedStage] = useState<string | null>(null);

    const fetchStages = async () => {
        const supabase = createClient();

        const { data: stagesData, error } = await supabase
            .from("stages")
            .select("*, checklist_items(*)")
            .eq("project_id", projectId)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Error fetching stages:", error);
        } else {
            setStages(stagesData || []);
            // Auto-expand first in-progress stage
            const inProgress = stagesData?.find((s: Stage) => s.status === "in_progress");
            if (inProgress) setExpandedStage(inProgress.id);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchStages();
    }, [projectId]);

    if (loading) {
        return <div className="text-muted text-sm px-4">Loading checklists...</div>;
    }

    if (stages.length === 0) {
        return (
            <div className="text-muted p-4">
                No checklists found. Checklists are generated when a project is created.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Stage Checklists</h2>
                <button className="text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors">
                    📄 Download All Reports
                </button>
            </div>

            <div className="space-y-4">
                {stages.map((stage) => {
                    const totalItems = stage.checklist_items?.length || 0;
                    const completedItems =
                        stage.checklist_items?.filter((i: any) => i.is_completed).length || 0;
                    const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
                    const isExpanded = expandedStage === stage.id;

                    return (
                        <div
                            key={stage.id}
                            className="rounded-xl border border-border overflow-hidden bg-card"
                        >
                            {/* Header */}
                            <button
                                onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                                className="w-full p-5 flex items-center justify-between hover:bg-muted/5 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${stage.status === "completed"
                                                ? "bg-green-500/10 text-green-600"
                                                : stage.status === "in_progress"
                                                    ? "bg-blue-500/10 text-blue-600"
                                                    : "bg-gray-100 text-gray-400"
                                            }`}
                                    >
                                        {stage.status === "completed"
                                            ? "✓"
                                            : stage.status === "in_progress"
                                                ? "▶"
                                                : "•"}
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold text-lg">{stage.name}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs text-muted-foreground">
                                                {completedItems} / {totalItems} items
                                            </span>
                                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500 transition-all"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <span className="text-muted-foreground text-xl">
                                    {isExpanded ? "▲" : "▼"}
                                </span>
                            </button>

                            {/* Expanded Items */}
                            {isExpanded && (
                                <div className="border-t border-border p-4 space-y-3 bg-muted/5">
                                    {stage.checklist_items?.map((item: any) => (
                                        <ChecklistItemCard
                                            key={item.id}
                                            item={item}
                                            onUpdate={fetchStages}
                                        />
                                    ))}
                                    {(!stage.checklist_items || stage.checklist_items.length === 0) && (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            No items in this stage.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
