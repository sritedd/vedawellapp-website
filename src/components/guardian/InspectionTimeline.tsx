"use client";

import { useState } from "react";
import {
    getInspectionStatusColor,
    getInspectionStatusLabel,
    countPassedInspections,
    countRequiredInspections,
    countCertificatesReceived,
    countCertificatesRequired,
    isStageComplete,
    Inspection as UtilInspection,
} from "@/lib/guardian/calculations";

interface Inspection {
    id: string;
    name: string;
    stage: string;
    status: "pending" | "scheduled" | "passed" | "failed" | "na";
    scheduledDate: string | null;
    completedDate: string | null;
    inspector: string;
    certificateRequired: boolean;
    certificateReceived: boolean;
    notes: string;
}

interface InspectionTimelineProps {
    projectId: string;
    currentStage: string;
}

const INSPECTIONS: Inspection[] = [
    { id: "1", name: "Footing/Slab Inspection", stage: "Base/Slab", status: "passed", scheduledDate: "2025-06-15", completedDate: "2025-06-15", inspector: "Council", certificateRequired: true, certificateReceived: true, notes: "All OK" },
    { id: "2", name: "Frame Inspection", stage: "Frame", status: "passed", scheduledDate: "2025-07-20", completedDate: "2025-07-20", inspector: "Private Certifier", certificateRequired: true, certificateReceived: true, notes: "" },
    { id: "3", name: "Pre-Plasterboard (EICC Rough-in)", stage: "Lockup", status: "scheduled", scheduledDate: "2025-08-10", completedDate: null, inspector: "Electrician", certificateRequired: true, certificateReceived: false, notes: "Scheduled for next week" },
    { id: "4", name: "Waterproofing Inspection", stage: "Lockup", status: "pending", scheduledDate: null, completedDate: null, inspector: "Waterproofer", certificateRequired: true, certificateReceived: false, notes: "" },
    { id: "5", name: "Plumbing Rough-in", stage: "Lockup", status: "pending", scheduledDate: null, completedDate: null, inspector: "Licensed Plumber", certificateRequired: true, certificateReceived: false, notes: "" },
    { id: "6", name: "Final Plumbing", stage: "Fixing", status: "pending", scheduledDate: null, completedDate: null, inspector: "Licensed Plumber", certificateRequired: true, certificateReceived: false, notes: "" },
    { id: "7", name: "Final Electrical (EICC)", stage: "Fixing", status: "pending", scheduledDate: null, completedDate: null, inspector: "Electrician", certificateRequired: true, certificateReceived: false, notes: "" },
    { id: "8", name: "Final Building Inspection", stage: "Practical Completion", status: "pending", scheduledDate: null, completedDate: null, inspector: "Private Certifier", certificateRequired: true, certificateReceived: false, notes: "" },
    { id: "9", name: "Occupation Certificate", stage: "Final", status: "pending", scheduledDate: null, completedDate: null, inspector: "Council/Certifier", certificateRequired: true, certificateReceived: false, notes: "" },
];

const STAGES = ["Base/Slab", "Frame", "Lockup", "Fixing", "Practical Completion", "Final"];

export default function InspectionTimeline({ projectId, currentStage }: InspectionTimelineProps) {
    const [inspections, setInspections] = useState<Inspection[]>(INSPECTIONS);
    const [expandedStage, setExpandedStage] = useState<string | null>(currentStage);

    // Use tested utility functions
    const getStatusColor = (status: Inspection["status"]) =>
        getInspectionStatusColor(status as UtilInspection['status']);

    const getStatusLabel = (status: Inspection["status"]) =>
        getInspectionStatusLabel(status as UtilInspection['status']);

    const updateInspection = (id: string, updates: Partial<Inspection>) => {
        setInspections(inspections.map(i =>
            i.id === id ? { ...i, ...updates } : i
        ));
    };

    // Calculate using tested utility functions
    const passedCount = countPassedInspections(inspections as UtilInspection[]);
    const totalRequired = countRequiredInspections(inspections as UtilInspection[]);
    const certsReceived = countCertificatesReceived(inspections as UtilInspection[]);
    const certsRequired = countCertificatesRequired(inspections as UtilInspection[]);

    const inspectionsByStage = STAGES.map(stage => {
        const stageInspections = inspections.filter(i => i.stage === stage);
        return {
            stage,
            inspections: stageInspections,
            isComplete: isStageComplete(stageInspections as UtilInspection[]),
            isCurrent: stage === currentStage,
        };
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">🔍 Inspection Timeline</h2>
                <p className="text-muted-foreground">
                    Track mandatory inspections and certificates for your build.
                </p>
            </div>

            {/* Progress Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex justify-between items-center">
                        <span className="text-green-700 font-medium">Inspections Passed</span>
                        <span className="text-2xl font-bold text-green-600">{passedCount}/{totalRequired}</span>
                    </div>
                    <div className="w-full h-2 bg-green-200 rounded-full mt-2 overflow-hidden">
                        <div
                            className="h-full bg-green-500 transition-all"
                            style={{ width: `${(passedCount / totalRequired) * 100}%` }}
                        />
                    </div>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex justify-between items-center">
                        <span className="text-blue-700 font-medium">Certificates Received</span>
                        <span className="text-2xl font-bold text-blue-600">{certsReceived}/{certsRequired}</span>
                    </div>
                    <div className="w-full h-2 bg-blue-200 rounded-full mt-2 overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all"
                            style={{ width: `${(certsReceived / certsRequired) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
                {inspectionsByStage.map(({ stage, inspections: stageInspections, isComplete, isCurrent }) => (
                    <div
                        key={stage}
                        className={`border rounded-xl overflow-hidden ${isCurrent ? "border-primary" : "border-border"
                            }`}
                    >
                        {/* Stage Header */}
                        <button
                            onClick={() => setExpandedStage(expandedStage === stage ? null : stage)}
                            className={`w-full p-4 flex justify-between items-center ${isCurrent ? "bg-primary/10" : "bg-card"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${isComplete ? "bg-green-500" : isCurrent ? "bg-primary" : "bg-gray-300"
                                    }`}>
                                    {isComplete ? "✓" : STAGES.indexOf(stage) + 1}
                                </div>
                                <span className="font-medium">{stage}</span>
                                {isCurrent && (
                                    <span className="px-2 py-0.5 bg-primary text-white text-xs rounded">
                                        Current
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    {stageInspections.filter(i => i.status === "passed").length}/{stageInspections.length} complete
                                </span>
                                <span>{expandedStage === stage ? "▼" : "▶"}</span>
                            </div>
                        </button>

                        {/* Inspections */}
                        {expandedStage === stage && (
                            <div className="p-4 space-y-3 bg-muted/10">
                                {stageInspections.map((inspection) => (
                                    <div
                                        key={inspection.id}
                                        className="p-4 bg-card border border-border rounded-lg"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="font-medium">{inspection.name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    Inspector: {inspection.inspector}
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs text-white ${getStatusColor(inspection.status)}`}>
                                                {getStatusLabel(inspection.status)}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                                            {inspection.scheduledDate && (
                                                <div>
                                                    <span className="text-muted-foreground">Scheduled: </span>
                                                    {new Date(inspection.scheduledDate).toLocaleDateString("en-AU")}
                                                </div>
                                            )}
                                            {inspection.completedDate && (
                                                <div>
                                                    <span className="text-muted-foreground">Completed: </span>
                                                    {new Date(inspection.completedDate).toLocaleDateString("en-AU")}
                                                </div>
                                            )}
                                        </div>

                                        {inspection.certificateRequired && (
                                            <div className="mt-3 flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded text-xs ${inspection.certificateReceived
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-amber-100 text-amber-700"
                                                    }`}>
                                                    {inspection.certificateReceived
                                                        ? "📜 Certificate Received"
                                                        : "⚠️ Certificate Required"}
                                                </span>
                                                {!inspection.certificateReceived && (
                                                    <button
                                                        onClick={() => updateInspection(inspection.id, { certificateReceived: true })}
                                                        className="text-xs text-primary hover:underline"
                                                    >
                                                        Mark as received
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {inspection.notes && (
                                            <div className="mt-2 text-sm text-muted-foreground italic">
                                                {inspection.notes}
                                            </div>
                                        )}

                                        {/* Quick Actions */}
                                        {inspection.status === "pending" && (
                                            <div className="mt-3 flex gap-2">
                                                <button
                                                    onClick={() => updateInspection(inspection.id, {
                                                        status: "scheduled",
                                                        scheduledDate: new Date().toISOString().split("T")[0]
                                                    })}
                                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                                                >
                                                    Schedule
                                                </button>
                                            </div>
                                        )}
                                        {inspection.status === "scheduled" && (
                                            <div className="mt-3 flex gap-2">
                                                <button
                                                    onClick={() => updateInspection(inspection.id, {
                                                        status: "passed",
                                                        completedDate: new Date().toISOString().split("T")[0]
                                                    })}
                                                    className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm"
                                                >
                                                    Mark Passed
                                                </button>
                                                <button
                                                    onClick={() => updateInspection(inspection.id, { status: "failed" })}
                                                    className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm"
                                                >
                                                    Mark Failed
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* NSW Info */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <p className="font-medium mb-1">⚠️ Important for NSW Builds</p>
                <p>
                    Critical inspections (frame, waterproofing, final) must be completed before
                    progressing to the next stage. Never pay for a stage without the required
                    inspection certificates.
                </p>
            </div>
        </div>
    );
}
