"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    getBlockingItems,
    getOverridableItems,
    getHardBlockingItems,
    calculateStageProgress,
    canProceedToNextStage,
    canOverrideToNextStage,
    StageRequirement as UtilStageRequirement,
} from "@/lib/guardian/calculations";

interface StageRequirement {
    id: string;
    category: "inspection" | "certificate" | "defect" | "variation" | "payment";
    name: string;
    required: boolean;
    completed: boolean;
    blocksProgress: boolean;
    evidence?: string;
    notes?: string;
    canOverride?: boolean;
}

interface LoggedDefect {
    id: string;
    name: string;
    loggedAt: Date;
    acknowledgedRisk: boolean;
}

interface StageGateProps {
    projectId: string;
    currentStage: string;
    nextStage: string;
    onProceed?: () => void;
}

export default function StageGate({ projectId, currentStage, nextStage, onProceed }: StageGateProps) {
    const [requirements, setRequirements] = useState<StageRequirement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showOverrideModal, setShowOverrideModal] = useState(false);
    const [loggedDefects, setLoggedDefects] = useState<LoggedDefect[]>([]);
    const [overrideReason, setOverrideReason] = useState("");
    const [acknowledgeRisk, setAcknowledgeRisk] = useState(false);
    const [stageName, setStageName] = useState(currentStage);

    // Compute requirements from real project data
    useEffect(() => {
        const computeRequirements = async () => {
            const supabase = createClient();
            const reqs: StageRequirement[] = [];
            const stageNameLower = currentStage.toLowerCase();

            // Get actual stage name from DB (replace underscores back to spaces for matching)
            const searchName = currentStage.replace(/_/g, " ");
            const { data: stageData } = await supabase
                .from("stages")
                .select("name")
                .eq("project_id", projectId)
                .ilike("name", `%${searchName}%`)
                .limit(1)
                .single();

            if (stageData) setStageName(stageData.name);

            // 1. Check inspections for this stage
            const { data: inspections } = await supabase
                .from("inspections")
                .select("id, stage, result, certificate_received, inspector_name")
                .eq("project_id", projectId);

            if (inspections) {
                const stageInspections = inspections.filter((i: { stage: string | null }) =>
                    i.stage && (
                        i.stage.toLowerCase().includes(stageNameLower) ||
                        stageNameLower.includes(i.stage.toLowerCase())
                    )
                );

                for (const insp of stageInspections) {
                    reqs.push({
                        id: `insp-${insp.id}`,
                        category: "inspection",
                        name: `${insp.stage || "Stage"} inspection passed`,
                        required: true,
                        completed: insp.result === "passed",
                        blocksProgress: true,
                    });

                    reqs.push({
                        id: `cert-insp-${insp.id}`,
                        category: "certificate",
                        name: `${insp.stage || "Stage"} certificate received`,
                        required: true,
                        completed: insp.certificate_received === true,
                        blocksProgress: true,
                    });
                }
            }

            // 2. Check certifications for this stage
            const { data: certs } = await supabase
                .from("certifications")
                .select("id, type, status, required_for_stage")
                .eq("project_id", projectId);

            if (certs) {
                const stageCerts = certs.filter((c: { required_for_stage: string | null }) =>
                    c.required_for_stage && (
                        c.required_for_stage.toLowerCase().includes(stageNameLower) ||
                        stageNameLower.includes(c.required_for_stage.toLowerCase())
                    )
                );

                for (const cert of stageCerts) {
                    // Don't duplicate if already added from inspections
                    const existing = reqs.find(r => r.category === "certificate" && r.name.toLowerCase().includes(cert.type.toLowerCase()));
                    if (!existing) {
                        reqs.push({
                            id: `cert-${cert.id}`,
                            category: "certificate",
                            name: `${cert.type} certificate`,
                            required: true,
                            completed: cert.status === "uploaded" || cert.status === "verified",
                            blocksProgress: true,
                        });
                    }
                }
            }

            // 3. Check open defects for this stage
            const { data: defects } = await supabase
                .from("defects")
                .select("id, title, status, stage, override_reason")
                .eq("project_id", projectId)
                .not("status", "in", '("verified","rectified")');

            if (defects) {
                const stageDefects = defects.filter((d: { stage: string | null }) =>
                    d.stage && (
                        d.stage.toLowerCase().includes(stageNameLower) ||
                        stageNameLower.includes(d.stage.toLowerCase())
                    )
                );

                if (stageDefects.length > 0) {
                    reqs.push({
                        id: "defects-clear",
                        category: "defect",
                        name: `All ${stageName} defects rectified (${stageDefects.length} open)`,
                        required: true,
                        completed: false,
                        blocksProgress: true,
                        canOverride: true,
                    });
                } else {
                    reqs.push({
                        id: "defects-clear",
                        category: "defect",
                        name: `All ${stageName} defects rectified`,
                        required: true,
                        completed: true,
                        blocksProgress: true,
                        canOverride: true,
                    });
                }

                // Load previously overridden defects
                const overridden = defects.filter((d: { override_reason: string | null; status: string }) => d.override_reason && d.status === "disputed");
                if (overridden.length > 0) {
                    setLoggedDefects(overridden.map((d: { id: string; title: string }) => ({
                        id: d.id,
                        name: d.title,
                        loggedAt: new Date(),
                        acknowledgedRisk: true,
                    })));
                }
            }

            // 4. Check unsigned variations
            const { data: variations } = await supabase
                .from("variations")
                .select("id, status")
                .eq("project_id", projectId)
                .neq("status", "approved");

            if (variations && variations.length > 0) {
                reqs.push({
                    id: "variations-signed",
                    category: "variation",
                    name: `All variations signed (${variations.length} unsigned)`,
                    required: false,
                    completed: false,
                    blocksProgress: false,
                });
            }

            // If no requirements found, show a message
            if (reqs.length === 0) {
                reqs.push({
                    id: "no-data",
                    category: "inspection",
                    name: "No inspections or certificates recorded for this stage yet",
                    required: false,
                    completed: false,
                    blocksProgress: false,
                });
            }

            setRequirements(reqs);
            setLoading(false);
        };

        computeRequirements();
    }, [projectId, currentStage, stageName]);

    const toggleComplete = (id: string) => {
        setRequirements(requirements.map(r =>
            r.id === id ? { ...r, completed: !r.completed } : r
        ));
    };

    // Calculate using tested utility functions
    const blockingItems = getBlockingItems(requirements as UtilStageRequirement[]);
    const overridableItems = getOverridableItems(requirements as UtilStageRequirement[]);
    const hardBlockingItems = getHardBlockingItems(requirements as UtilStageRequirement[]);
    const progressPercent = calculateStageProgress(requirements as UtilStageRequirement[]);
    const completedCount = requirements.filter(r => r.required && r.completed).length;
    const totalRequired = requirements.filter(r => r.required).length;
    const canProceed = canProceedToNextStage(requirements as UtilStageRequirement[]);
    const canOverride = canOverrideToNextStage(requirements as UtilStageRequirement[]);
    const isPCStage = currentStage.toLowerCase().includes("completion") || currentStage.toLowerCase() === "pc";

    const getCategoryIcon = (category: StageRequirement["category"]) => {
        switch (category) {
            case "inspection": return "🔍";
            case "certificate": return "📜";
            case "defect": return "🛠️";
            case "variation": return "💰";
            case "payment": return "💳";
        }
    };

    const handleProceed = () => {
        if (canProceed) {
            setShowConfirmation(true);
        }
    };

    const handleOverride = () => {
        setShowOverrideModal(true);
    };

    const confirmOverride = async () => {
        if (!acknowledgeRisk || !overrideReason.trim()) return;

        const supabase = createClient();

        // Get open defects for this stage and mark them as disputed with override reason
        const { data: defects } = await supabase
            .from("defects")
            .select("id, title, stage")
            .eq("project_id", projectId)
            .not("status", "in", '("verified","rectified","disputed","fixed")');

        if (defects) {
            const stageNameLower = currentStage.toLowerCase();
            const stageDefects = defects.filter((d: { id: string; title: string; stage?: string }) =>
                d.stage && (
                    d.stage.toLowerCase().includes(stageNameLower) ||
                    stageNameLower.includes(d.stage.toLowerCase())
                )
            );
            for (const defect of stageDefects) {
                await supabase
                    .from("defects")
                    .update({
                        status: "disputed",
                        override_reason: overrideReason,
                    })
                    .eq("id", defect.id);
            }

            const newLoggedDefects: LoggedDefect[] = stageDefects.map((d: { id: string; title: string }) => ({
                id: d.id,
                name: d.title,
                loggedAt: new Date(),
                acknowledgedRisk: true,
            }));
            setLoggedDefects([...loggedDefects, ...newLoggedDefects]);
        }

        // Mark defect requirement as completed with override
        setRequirements(requirements.map(r => {
            if (r.canOverride && !r.completed) {
                return { ...r, completed: true, notes: `OVERRIDDEN: ${overrideReason}` };
            }
            return r;
        }));

        setShowOverrideModal(false);
        setOverrideReason("");
        setAcknowledgeRisk(false);
    };

    const confirmProceed = async () => {
        // Update stage status in DB using the actual stage name from DB (not the normalized version)
        const supabase = createClient();
        const { error: updateError } = await supabase
            .from("stages")
            .update({ status: "completed", completion_date: new Date().toISOString().split("T")[0] })
            .eq("project_id", projectId)
            .eq("name", stageName);

        // Fallback: try ilike match if exact name didn't work
        let fallbackError: { message: string } | null = null;
        if (updateError || stageName === currentStage) {
            const { error: ilikeError } = await supabase
                .from("stages")
                .update({ status: "completed", completion_date: new Date().toISOString().split("T")[0] })
                .eq("project_id", projectId)
                .ilike("name", `%${currentStage.replace(/_/g, " ")}%`);
            fallbackError = ilikeError;
        }

        // If both paths errored, don't advance — user would see UI move forward
        // while DB still flags the stage as in_progress, and the next gate
        // check would whiplash them back.
        if (updateError && fallbackError) {
            alert(`Could not mark stage complete: ${fallbackError.message}. Please try again.`);
            return;
        }

        setShowConfirmation(false);
        onProceed?.();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold">Stage Gate: {stageName}</h2>
                <p className="text-muted-foreground">
                    Complete all requirements before proceeding to {nextStage}
                </p>
            </div>

            {/* Progress */}
            <div className="p-6 bg-card border border-border rounded-xl">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="font-medium">Stage Completion Progress</h3>
                        <p className="text-sm text-muted-foreground">
                            {completedCount} of {totalRequired} required items complete
                        </p>
                    </div>
                    <div className={`text-4xl font-bold ${canProceed ? "text-green-600" : "text-amber-600"}`}>
                        {progressPercent}%
                    </div>
                </div>
                <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all ${canProceed ? "bg-green-500" : "bg-amber-500"}`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Logged Defects */}
            {loggedDefects.length > 0 && (
                <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl">
                    <h3 className="font-bold text-amber-800 flex items-center gap-2 mb-3">
                        <span className="text-2xl">📋</span>
                        {loggedDefects.length} Defect{loggedDefects.length !== 1 && "s"} Logged for Post-OC Rectification
                    </h3>
                    <ul className="space-y-2">
                        {loggedDefects.map((defect) => (
                            <li key={defect.id} className="flex items-center gap-2 text-amber-700">
                                <span>⚠️</span>
                                <span>{defect.name}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-3 text-sm text-amber-600 font-medium">
                        Builder must rectify these items within warranty period.
                    </p>
                </div>
            )}

            {/* Blocking Items Warning */}
            {blockingItems.length > 0 && (
                <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl">
                    <h3 className="font-bold text-red-800 flex items-center gap-2 mb-3">
                        {blockingItems.length} Item{blockingItems.length !== 1 && "s"} Blocking Stage Progression
                    </h3>
                    <ul className="space-y-2">
                        {blockingItems.map((item) => (
                            <li key={item.id} className="flex items-center gap-2 text-red-700">
                                <span>{getCategoryIcon(item.category)}</span>
                                <span>{item.name}</span>
                                {item.canOverride && (
                                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                                        Can Log &amp; Proceed
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                    <p className="mt-4 text-sm text-red-600 font-medium">
                        Do NOT release payment until blocking items are resolved.
                    </p>
                </div>
            )}

            {/* Requirements List */}
            <div className="space-y-3">
                <h3 className="font-bold">Stage Requirements Checklist</h3>

                {requirements.map((req) => (
                    <div
                        key={req.id}
                        className={`p-4 rounded-xl border-2 transition-colors ${req.completed
                            ? req.notes?.includes("OVERRIDDEN")
                                ? "bg-amber-50 border-amber-300"
                                : "bg-green-50 border-green-300"
                            : req.blocksProgress
                                ? "bg-red-50 border-red-300"
                                : "bg-gray-50 border-gray-200"
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => toggleComplete(req.id)}
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${req.completed
                                        ? req.notes?.includes("OVERRIDDEN")
                                            ? "bg-amber-500 border-amber-500 text-white"
                                            : "bg-green-500 border-green-500 text-white"
                                        : "border-gray-400 hover:border-green-500"
                                        }`}
                                >
                                    {req.completed && "✓"}
                                </button>
                                <span className="text-xl">{getCategoryIcon(req.category)}</span>
                                <div>
                                    <span className={req.completed ? "line-through text-gray-500" : ""}>
                                        {req.name}
                                    </span>
                                    <div className="flex gap-2 mt-1">
                                        {req.required && (
                                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                                Required
                                            </span>
                                        )}
                                        {req.blocksProgress && !req.completed && (
                                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                                                Blocks Progress
                                            </span>
                                        )}
                                        {req.notes?.includes("OVERRIDDEN") && (
                                            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                                                Logged for Rectification
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Proceed Buttons */}
            <div className="pt-4 space-y-3">
                {canProceed ? (
                    <button
                        onClick={handleProceed}
                        className="w-full py-4 bg-green-500 text-white rounded-xl font-bold text-lg hover:bg-green-600 transition-colors"
                    >
                        All Clear - Proceed to {nextStage}
                    </button>
                ) : canOverride ? (
                    <div className="space-y-3">
                        <button
                            disabled
                            className="w-full py-4 bg-gray-300 text-gray-500 rounded-xl font-bold text-lg cursor-not-allowed"
                        >
                            Cannot Proceed - {blockingItems.length} Item{blockingItems.length !== 1 && "s"} Pending
                        </button>
                        <button
                            onClick={handleOverride}
                            className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold text-lg hover:bg-amber-600 transition-colors"
                        >
                            Log Defects &amp; Proceed (Accept with Defects)
                        </button>
                    </div>
                ) : (
                    <button
                        disabled
                        className="w-full py-4 bg-gray-300 text-gray-500 rounded-xl font-bold text-lg cursor-not-allowed"
                    >
                        Cannot Proceed - {hardBlockingItems.length} Critical Item{hardBlockingItems.length !== 1 && "s"} Required
                    </button>
                )}
            </div>

            {/* Override Modal */}
            {showOverrideModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">Proceed with Unresolved Defects</h3>

                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4 text-sm text-red-800">
                            <p className="font-bold mb-2">IMPORTANT: You are about to accept your home with defects still unresolved:</p>
                            <ul className="mt-2 space-y-1">
                                {overridableItems.map(item => (
                                    <li key={item.id}>• {item.name}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Reason for proceeding with defects:
                                </label>
                                <textarea
                                    value={overrideReason}
                                    onChange={(e) => setOverrideReason(e.target.value)}
                                    placeholder="e.g., Builder has committed to rectify within 14 days of handover..."
                                    className="w-full p-3 border rounded-lg resize-none h-24"
                                />
                            </div>

                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="acknowledgeRisk"
                                    checked={acknowledgeRisk}
                                    onChange={(e) => setAcknowledgeRisk(e.target.checked)}
                                    className="mt-1 w-5 h-5"
                                />
                                <label htmlFor="acknowledgeRisk" className="text-sm">
                                    I understand that I am accepting the Occupation Certificate with outstanding defects.
                                    These defects will be logged and the builder remains liable to rectify them under the
                                    Home Building Act warranty provisions.
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowOverrideModal(false)}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmOverride}
                                disabled={!acknowledgeRisk || !overrideReason.trim()}
                                className={`flex-1 py-3 rounded-lg font-medium ${acknowledgeRisk && overrideReason.trim()
                                    ? "bg-amber-500 text-white hover:bg-amber-600"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    }`}
                            >
                                Log Defects &amp; Proceed
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">Confirm {isPCStage ? "Handover" : "Stage Progression"}</h3>
                        <p className="text-muted-foreground mb-6">
                            {isPCStage ? (
                                <>
                                    Congratulations! All requirements for <strong>Practical Completion</strong> are met.
                                    Are you ready to complete handover and receive your keys?
                                </>
                            ) : (
                                <>
                                    All requirements for <strong>{stageName}</strong> are complete.
                                    Are you ready to proceed to <strong>{nextStage}</strong> and authorize the stage payment?
                                </>
                            )}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmProceed}
                                className="flex-1 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
                            >
                                {isPCStage ? "Complete Handover" : "Confirm & Proceed"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Legal Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                <p className="font-medium mb-1">NSW Home Building Act Reminder</p>
                <p>
                    {isPCStage ? (
                        <>
                            You can accept your new home with minor defects that the builder commits to rectify.
                            Major defects should be fixed before handover. All defects are covered under the
                            statutory warranty (2 years general, 6 years structural).
                        </>
                    ) : (
                        <>
                            Under NSW law, builders must provide certificates for certain work before claiming
                            progress payments. You have the right to withhold payment until all required
                            certificates are provided.
                        </>
                    )}
                </p>
            </div>
        </div>
    );
}
