"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    getInspectionStatusColor,
    getInspectionStatusLabel,
} from "@/lib/guardian/calculations";

interface Inspection {
    id: string;
    stage: string | null;
    result: string | null; // DB values: not_booked/booked/passed/failed
    scheduled_date: string | null;
    inspector_name: string | null;
    certificate_received: boolean;
    notes: string | null;
}

interface InspectionTimelineProps {
    projectId: string;
    currentStage: string;
}

// Map DB result values to display status
function getStatus(result: string | null): "pending" | "scheduled" | "passed" | "failed" {
    if (!result || result === "not_booked") return "pending";
    if (result === "booked") return "scheduled";
    if (result === "passed" || result === "pass") return "passed";
    if (result === "failed" || result === "fail") return "failed";
    return "pending";
}

export default function InspectionTimeline({ projectId, currentStage }: InspectionTimelineProps) {
    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [stages, setStages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedStage, setExpandedStage] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newInspection, setNewInspection] = useState({
        stage: "",
        inspector_name: "",
        scheduled_date: "",
        notes: "",
    });

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient();

            // Fetch project stages for grouping
            const { data: stageData } = await supabase
                .from("stages")
                .select("name")
                .eq("project_id", projectId)
                .order("order_index", { ascending: true });

            const stageNames = stageData?.map((s: { name: string }) => s.name) || [];
            setStages(stageNames);

            // Fetch inspections from DB
            const { data: inspData } = await supabase
                .from("inspections")
                .select("id, stage, result, scheduled_date, inspector_name, certificate_received, notes")
                .eq("project_id", projectId)
                .order("created_at", { ascending: true });

            setInspections(inspData || []);

            // Auto-expand the current stage
            if (currentStage && stageNames.length > 0) {
                // Find best matching stage name
                const match = stageNames.find((s: string) =>
                    s.toLowerCase().includes(currentStage.toLowerCase()) ||
                    currentStage.toLowerCase().includes(s.toLowerCase())
                );
                setExpandedStage(match || stageNames[0]);
            }

            setLoading(false);
        };

        fetchData();
    }, [projectId, currentStage]);

    const updateInspection = async (id: string, updates: Partial<{ result: string; certificate_received: boolean; scheduled_date: string }>) => {
        const supabase = createClient();

        // Optimistic update
        setInspections(prev => prev.map(i =>
            i.id === id ? { ...i, ...updates } : i
        ));

        const { error } = await supabase
            .from("inspections")
            .update(updates)
            .eq("id", id);

        if (error) {
            // Revert — refetch
            const { data } = await supabase
                .from("inspections")
                .select("id, stage, result, scheduled_date, inspector_name, certificate_received, notes")
                .eq("project_id", projectId)
                .order("created_at", { ascending: true });
            setInspections(data || []);
        }
    };

    const addInspection = async () => {
        if (!newInspection.stage.trim()) return;

        const supabase = createClient();
        const { data, error } = await supabase
            .from("inspections")
            .insert({
                project_id: projectId,
                stage: newInspection.stage || null,
                inspector_name: newInspection.inspector_name || null,
                scheduled_date: newInspection.scheduled_date || null,
                result: newInspection.scheduled_date ? "booked" : "not_booked",
                notes: newInspection.notes || null,
                certificate_received: false,
            })
            .select()
            .single();

        if (!error && data) {
            setInspections(prev => [...prev, data]);
            setNewInspection({ stage: "", inspector_name: "", scheduled_date: "", notes: "" });
            setShowAddForm(false);
        }
    };

    const passedCount = inspections.filter(i => getStatus(i.result) === "passed").length;
    const totalCount = inspections.length;
    const certsReceived = inspections.filter(i => i.certificate_received).length;

    // Group inspections by stage
    const inspectionsByStage = stages.map(stage => {
        const stageInspections = inspections.filter(i =>
            i.stage && (i.stage.toLowerCase() === stage.toLowerCase() ||
            stage.toLowerCase().includes(i.stage.toLowerCase()) ||
            i.stage.toLowerCase().includes(stage.toLowerCase()))
        );
        return {
            stage,
            inspections: stageInspections,
            isComplete: stageInspections.length > 0 && stageInspections.every(i => getStatus(i.result) === "passed"),
        };
    });

    // Ungrouped inspections (no stage or unmatched stage)
    const groupedIds = new Set(inspectionsByStage.flatMap(g => g.inspections.map(i => i.id)));
    const ungrouped = inspections.filter(i => !groupedIds.has(i.id));

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Inspection Timeline</h2>
                    <p className="text-muted-foreground">
                        Track mandatory inspections and certificates for your build.
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
                >
                    + Add Inspection
                </button>
            </div>

            {/* Add Form */}
            {showAddForm && (
                <div className="p-4 bg-card border border-border rounded-xl space-y-3">
                    <h3 className="font-bold">Add New Inspection</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                        <select
                            value={newInspection.stage}
                            onChange={e => setNewInspection({ ...newInspection, stage: e.target.value })}
                            className="w-full p-2 border border-border rounded-lg text-sm"
                        >
                            <option value="">Select stage</option>
                            {stages.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <input
                            type="text"
                            placeholder="Inspector (e.g. Council, Private Certifier)"
                            value={newInspection.inspector_name}
                            onChange={e => setNewInspection({ ...newInspection, inspector_name: e.target.value })}
                            className="w-full p-2 border border-border rounded-lg text-sm"
                        />
                        <input
                            type="date"
                            value={newInspection.scheduled_date}
                            onChange={e => setNewInspection({ ...newInspection, scheduled_date: e.target.value })}
                            className="w-full p-2 border border-border rounded-lg text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={addInspection} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">Save</button>
                        <button onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-muted rounded-lg text-sm">Cancel</button>
                    </div>
                </div>
            )}

            {/* Progress Stats */}
            {inspections.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex justify-between items-center">
                            <span className="text-green-700 font-medium">Inspections Passed</span>
                            <span className="text-2xl font-bold text-green-600">{passedCount}/{totalCount}</span>
                        </div>
                        <div className="w-full h-2 bg-green-200 rounded-full mt-2 overflow-hidden">
                            <div
                                className="h-full bg-green-500 transition-all"
                                style={{ width: `${totalCount > 0 ? (passedCount / totalCount) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="flex justify-between items-center">
                            <span className="text-blue-700 font-medium">Certificates Received</span>
                            <span className="text-2xl font-bold text-blue-600">{certsReceived}/{totalCount}</span>
                        </div>
                        <div className="w-full h-2 bg-blue-200 rounded-full mt-2 overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all"
                                style={{ width: `${totalCount > 0 ? (certsReceived / totalCount) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Timeline */}
            {inspections.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-border rounded-xl">
                    <p className="text-muted-foreground mb-2">No inspections recorded yet.</p>
                    <p className="text-sm text-muted-foreground">
                        Add inspections as they are scheduled to track your build progress.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {inspectionsByStage.filter(g => g.inspections.length > 0).map(({ stage, inspections: stageInspections, isComplete }) => (
                        <div
                            key={stage}
                            className={`border rounded-xl overflow-hidden ${expandedStage === stage ? "border-primary" : "border-border"}`}
                        >
                            <button
                                onClick={() => setExpandedStage(expandedStage === stage ? null : stage)}
                                className={`w-full p-4 flex justify-between items-center ${expandedStage === stage ? "bg-primary/10" : "bg-card"}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${isComplete ? "bg-green-500" : "bg-gray-300"}`}>
                                        {isComplete ? "✓" : stageInspections.length}
                                    </div>
                                    <span className="font-medium">{stage}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        {stageInspections.filter(i => getStatus(i.result) === "passed").length}/{stageInspections.length} complete
                                    </span>
                                    <span>{expandedStage === stage ? "▼" : "▶"}</span>
                                </div>
                            </button>

                            {expandedStage === stage && (
                                <div className="p-4 space-y-3 bg-muted/10">
                                    {stageInspections.map((inspection) => {
                                        const status = getStatus(inspection.result);
                                        return (
                                            <div key={inspection.id} className="p-4 bg-card border border-border rounded-lg">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="font-medium">{inspection.stage || "Inspection"}</div>
                                                        {inspection.inspector_name && (
                                                            <div className="text-sm text-muted-foreground">
                                                                Inspector: {inspection.inspector_name}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className={`px-2 py-1 rounded text-xs text-white ${getInspectionStatusColor(status)}`}>
                                                        {getInspectionStatusLabel(status)}
                                                    </span>
                                                </div>

                                                {inspection.scheduled_date && (
                                                    <div className="text-sm mt-3">
                                                        <span className="text-muted-foreground">Scheduled: </span>
                                                        {new Date(inspection.scheduled_date).toLocaleDateString("en-AU")}
                                                    </div>
                                                )}

                                                {/* Certificate status */}
                                                <div className="mt-3 flex items-center gap-2">
                                                    <span className={`px-2 py-1 rounded text-xs ${inspection.certificate_received
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-amber-100 text-amber-700"
                                                        }`}>
                                                        {inspection.certificate_received
                                                            ? "Certificate Received"
                                                            : "Certificate Required"}
                                                    </span>
                                                    {!inspection.certificate_received && (
                                                        <button
                                                            onClick={() => updateInspection(inspection.id, { certificate_received: true })}
                                                            className="text-xs text-primary hover:underline"
                                                        >
                                                            Mark as received
                                                        </button>
                                                    )}
                                                </div>

                                                {inspection.notes && (
                                                    <div className="mt-2 text-sm text-muted-foreground italic">
                                                        {inspection.notes}
                                                    </div>
                                                )}

                                                {/* Quick Actions */}
                                                {status === "pending" && (
                                                    <div className="mt-3 flex gap-2">
                                                        <button
                                                            onClick={() => updateInspection(inspection.id, {
                                                                result: "booked",
                                                                scheduled_date: new Date().toISOString().split("T")[0]
                                                            })}
                                                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                                                        >
                                                            Schedule
                                                        </button>
                                                    </div>
                                                )}
                                                {status === "scheduled" && (
                                                    <div className="mt-3 flex gap-2">
                                                        <button
                                                            onClick={() => updateInspection(inspection.id, {
                                                                result: "passed"
                                                            })}
                                                            className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm"
                                                        >
                                                            Mark Passed
                                                        </button>
                                                        <button
                                                            onClick={() => updateInspection(inspection.id, {
                                                                result: "failed"
                                                            })}
                                                            className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm"
                                                        >
                                                            Mark Failed
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Ungrouped inspections */}
                    {ungrouped.length > 0 && (
                        <div className="border rounded-xl overflow-hidden border-border">
                            <div className="p-4 bg-card font-medium">Other Inspections</div>
                            <div className="p-4 space-y-3 bg-muted/10">
                                {ungrouped.map(inspection => {
                                    const status = getStatus(inspection.result);
                                    return (
                                        <div key={inspection.id} className="p-4 bg-card border border-border rounded-lg">
                                            <div className="flex justify-between items-start">
                                                <div className="font-medium">{inspection.stage || "Inspection"}</div>
                                                <span className={`px-2 py-1 rounded text-xs text-white ${getInspectionStatusColor(status)}`}>
                                                    {getInspectionStatusLabel(status)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* NSW Info */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <p className="font-medium mb-1">Important for NSW Builds</p>
                <p>
                    Critical inspections (frame, waterproofing, final) must be completed before
                    progressing to the next stage. Never pay for a stage without the required
                    inspection certificates.
                </p>
            </div>
        </div>
    );
}
