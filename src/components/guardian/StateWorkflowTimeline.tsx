"use client";

import { useState } from "react";
import australianData from "@/data/australian-build-workflows.json";

interface StateWorkflowTimelineProps {
    buildCategory: "new_build" | "extension" | "granny_flat";
    state: string;
    currentStage?: string;
}

export default function StateWorkflowTimeline({
    buildCategory = "new_build",
    state = "NSW",
    currentStage,
}: StateWorkflowTimelineProps) {
    const [expandedStage, setExpandedStage] = useState<string | null>(currentStage || null);

    // Get workflow data
    const categoryWorkflows = australianData.workflows[buildCategory];
    const stateWorkflow = categoryWorkflows?.[state as keyof typeof categoryWorkflows] as any;
    const stages = stateWorkflow?.stages || [];
    const approvalPathways = stateWorkflow?.approvalPathways || [];

    if (stages.length === 0) {
        return (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-700">
                    Workflow data for {buildCategory} in {state} is not yet available. Using NSW new build workflow as reference.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Approval Pathways */}
            {approvalPathways.length > 0 && (
                <div className="grid md:grid-cols-2 gap-4">
                    {approvalPathways.map((pathway: any) => (
                        <div
                            key={pathway.id}
                            className={`p-4 rounded-xl border-2 ${pathway.id === "cdc"
                                    ? "border-green-200 bg-green-50"
                                    : "border-orange-200 bg-orange-50"
                                }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold">{pathway.name}</h4>
                                <span
                                    className={`text-sm px-2 py-0.5 rounded ${pathway.id === "cdc"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-orange-100 text-orange-700"
                                        }`}
                                >
                                    {pathway.avgDays}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{pathway.suitableFor}</p>
                            {pathway.requirements && (
                                <div className="mt-2">
                                    <span className="text-xs font-medium text-muted-foreground">Requirements:</span>
                                    <ul className="text-xs mt-1 space-y-0.5">
                                        {pathway.requirements.slice(0, 4).map((req: string, i: number) => (
                                            <li key={i} className="flex items-start gap-1">
                                                <span className={pathway.id === "cdc" ? "text-green-600" : "text-orange-600"}>
                                                    •
                                                </span>
                                                {req}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Construction Stages Timeline */}
            <div>
                <h3 className="text-lg font-bold mb-4">Construction Stages ({state})</h3>
                <div className="space-y-3">
                    {stages.map((stage: any, idx: number) => {
                        const isExpanded = expandedStage === stage.id;
                        const isCritical = stage.critical;

                        return (
                            <div
                                key={stage.id}
                                className={`rounded-xl border overflow-hidden ${isCritical
                                        ? "border-red-300 bg-red-50"
                                        : "border-border bg-card"
                                    }`}
                            >
                                <button
                                    onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                                    className="w-full p-4 flex items-center gap-4 text-left hover:bg-muted/5 transition-colors"
                                >
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isCritical
                                                ? "bg-red-500 text-white"
                                                : "bg-primary/10 text-primary"
                                            }`}
                                    >
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold">{stage.name}</h4>
                                            {isCritical && (
                                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">
                                                    CRITICAL
                                                </span>
                                            )}
                                            {stage.paymentMilestone && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                                    💰 {stage.paymentMilestone}
                                                </span>
                                            )}
                                        </div>
                                        {stage.description && (
                                            <p className="text-sm text-muted-foreground mt-0.5">{stage.description}</p>
                                        )}
                                    </div>
                                    <span className="text-muted-foreground">{isExpanded ? "▲" : "▼"}</span>
                                </button>

                                {isExpanded && (
                                    <div className="border-t border-border/50 p-4 space-y-4 bg-background/50">
                                        {/* Inspections */}
                                        {stage.inspections && stage.inspections.length > 0 && (
                                            <div>
                                                <h5 className="text-sm font-bold text-blue-700 mb-2">🔍 Required Inspections</h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {stage.inspections.map((inspection: string, i: number) => (
                                                        <span
                                                            key={i}
                                                            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                                                        >
                                                            {inspection}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Certificates */}
                                        {stage.certificates && stage.certificates.length > 0 && (
                                            <div>
                                                <h5 className="text-sm font-bold text-green-700 mb-2">📄 Certificates Required</h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {stage.certificates.map((cert: string, i: number) => (
                                                        <span
                                                            key={i}
                                                            className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                                                        >
                                                            {cert}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Critical Checklist Items */}
                                        {stage.checklist && stage.checklist.length > 0 && (
                                            <div>
                                                <h5 className="text-sm font-bold text-amber-700 mb-2">
                                                    ✅ Checklist Items ({stage.checklist.filter((c: any) => c.critical).length} critical)
                                                </h5>
                                                <div className="space-y-1">
                                                    {stage.checklist.map((item: any, i: number) => (
                                                        <div
                                                            key={i}
                                                            className={`flex items-center gap-2 text-sm py-1 ${item.critical ? "text-red-700 font-medium" : ""
                                                                }`}
                                                        >
                                                            <span>{item.requiresPhoto ? "📸" : "☐"}</span>
                                                            <span>{item.item}</span>
                                                            {item.rValue && (
                                                                <span className="text-xs bg-muted px-1 rounded">{item.rValue}</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Dodgy Builder Warnings */}
                                        {stage.dodgyBuilderWarnings && stage.dodgyBuilderWarnings.length > 0 && (
                                            <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
                                                <h5 className="text-sm font-bold text-red-700 mb-2">⚠️ Watch Out For</h5>
                                                <ul className="space-y-1">
                                                    {stage.dodgyBuilderWarnings.map((warning: string, i: number) => (
                                                        <li key={i} className="text-sm text-red-800">
                                                            {warning}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Your Rights */}
                                        {stage.yourRights && stage.yourRights.length > 0 && (
                                            <div className="p-3 bg-blue-100 border border-blue-200 rounded-lg">
                                                <h5 className="text-sm font-bold text-blue-700 mb-2">⚖️ Your Rights</h5>
                                                <ul className="space-y-1">
                                                    {stage.yourRights.map((right: string, i: number) => (
                                                        <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                                                            <span>→</span>
                                                            {right}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
