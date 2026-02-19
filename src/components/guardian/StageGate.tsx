"use client";

import { useState } from "react";
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
    canOverride?: boolean; // Allow proceeding with logging
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

const STAGES_CONFIG: Record<string, { name: string; requirements: StageRequirement[] }> = {
    "slab": {
        name: "Base/Slab",
        requirements: [
            { id: "1", category: "inspection", name: "Footing inspection passed", required: true, completed: true, blocksProgress: true },
            { id: "2", category: "certificate", name: "Slab inspection certificate", required: true, completed: true, blocksProgress: true },
            { id: "3", category: "defect", name: "All slab defects rectified", required: true, completed: true, blocksProgress: true, canOverride: true },
        ]
    },
    "frame": {
        name: "Frame",
        requirements: [
            { id: "1", category: "inspection", name: "Frame inspection passed", required: true, completed: true, blocksProgress: true },
            { id: "2", category: "certificate", name: "Frame certificate received", required: true, completed: true, blocksProgress: true },
            { id: "3", category: "certificate", name: "Termite treatment certificate", required: true, completed: true, blocksProgress: true },
            { id: "4", category: "defect", name: "All frame defects rectified", required: true, completed: true, blocksProgress: true, canOverride: true },
        ]
    },
    "lockup": {
        name: "Lockup",
        requirements: [
            { id: "1", category: "inspection", name: "Waterproofing inspection passed", required: true, completed: true, blocksProgress: true },
            { id: "2", category: "certificate", name: "Waterproofing certificate", required: true, completed: true, blocksProgress: true },
            { id: "3", category: "inspection", name: "Pre-plasterboard electrical rough-in", required: true, completed: true, blocksProgress: true },
            { id: "4", category: "certificate", name: "Electrical rough-in certificate", required: true, completed: true, blocksProgress: true },
            { id: "5", category: "inspection", name: "Plumbing rough-in inspection", required: true, completed: true, blocksProgress: true },
            { id: "6", category: "defect", name: "All lockup defects rectified", required: true, completed: true, blocksProgress: true, canOverride: true },
            { id: "7", category: "variation", name: "All variations signed", required: false, completed: true, blocksProgress: false },
        ]
    },
    "fixing": {
        name: "Fixing",
        requirements: [
            { id: "1", category: "inspection", name: "Final electrical inspection", required: true, completed: true, blocksProgress: true },
            { id: "2", category: "certificate", name: "EICC (Electrical) Certificate", required: true, completed: true, blocksProgress: true },
            { id: "3", category: "inspection", name: "Final plumbing inspection", required: true, completed: true, blocksProgress: true },
            { id: "4", category: "certificate", name: "Plumbing compliance certificate", required: true, completed: true, blocksProgress: true },
            { id: "5", category: "defect", name: "All fixing stage defects rectified", required: true, completed: true, blocksProgress: true, canOverride: true },
            { id: "6", category: "certificate", name: "Insulation certificate", required: true, completed: true, blocksProgress: true },
        ]
    },
    "pc": {
        name: "Practical Completion",
        requirements: [
            { id: "1", category: "inspection", name: "Final building inspection passed", required: true, completed: true, blocksProgress: true },
            { id: "2", category: "certificate", name: "Occupation Certificate (OC) issued", required: true, completed: false, blocksProgress: true },
            { id: "3", category: "defect", name: "All defects cleared OR logged for post-OC rectification", required: true, completed: false, blocksProgress: true, canOverride: true },
            { id: "4", category: "certificate", name: "HBCF Insurance Certificate", required: true, completed: true, blocksProgress: true },
            { id: "5", category: "certificate", name: "Smoke alarm compliance certificate", required: true, completed: true, blocksProgress: true },
            { id: "6", category: "certificate", name: "All appliance warranties collected", required: true, completed: false, blocksProgress: false, canOverride: true },
        ]
    }
};

export default function StageGate({ projectId, currentStage, nextStage, onProceed }: StageGateProps) {
    const [selectedStage, setSelectedStage] = useState(currentStage.toLowerCase() || "pc");
    const stageConfig = STAGES_CONFIG[selectedStage] || STAGES_CONFIG["pc"];
    const [requirements, setRequirements] = useState<StageRequirement[]>(stageConfig.requirements);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showOverrideModal, setShowOverrideModal] = useState(false);
    const [loggedDefects, setLoggedDefects] = useState<LoggedDefect[]>([]);
    const [overrideReason, setOverrideReason] = useState("");
    const [acknowledgeRisk, setAcknowledgeRisk] = useState(false);

    // Reset requirements when stage changes
    const handleStageChange = (newStage: string) => {
        setSelectedStage(newStage);
        setRequirements(STAGES_CONFIG[newStage]?.requirements || []);
        setLoggedDefects([]);
        setShowConfirmation(false);
        setShowOverrideModal(false);
    };

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
    const isPCStage = currentStage.toLowerCase() === "pc";

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

    const confirmOverride = () => {
        if (!acknowledgeRisk || !overrideReason.trim()) return;

        // Log the defects being overridden
        const newLoggedDefects: LoggedDefect[] = overridableItems.map(item => ({
            id: item.id,
            name: item.name,
            loggedAt: new Date(),
            acknowledgedRisk: true,
        }));
        setLoggedDefects([...loggedDefects, ...newLoggedDefects]);

        // Mark as "completed with override"
        setRequirements(requirements.map(r => {
            if (overridableItems.find(o => o.id === r.id)) {
                return { ...r, completed: true, notes: `OVERRIDDEN: ${overrideReason}` };
            }
            return r;
        }));

        setShowOverrideModal(false);
        setOverrideReason("");
        setAcknowledgeRisk(false);
    };

    const confirmProceed = () => {
        setShowConfirmation(false);
        onProceed?.();
    };

    return (
        <div className="space-y-6">
            {/* Header with Stage Selector */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">🚧 Stage Gate: {stageConfig.name}</h2>
                    <p className="text-muted-foreground">
                        Complete all requirements before proceeding to {nextStage}
                    </p>
                </div>

                {/* Stage Selector for Testing */}
                <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-xl">
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">🧪 Test Stage:</span>
                    <select
                        value={selectedStage}
                        onChange={(e) => handleStageChange(e.target.value)}
                        className="px-3 py-1.5 border border-purple-300 dark:border-purple-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                        <option value="slab" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">📦 Base/Slab</option>
                        <option value="frame" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">🏗️ Frame</option>
                        <option value="lockup" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">🔒 Lockup</option>
                        <option value="fixing" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">🔧 Fixing</option>
                        <option value="pc" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">🏠 Practical Completion (OC)</option>
                    </select>
                </div>
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
                                <span className="text-xs bg-amber-200 px-2 py-0.5 rounded">
                                    Logged {defect.loggedAt.toLocaleDateString()}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-3 text-sm text-amber-600 font-medium">
                        ✅ You may proceed with OC. Builder must rectify these items within warranty period.
                    </p>
                </div>
            )}

            {/* Blocking Items Warning */}
            {blockingItems.length > 0 && (
                <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl">
                    <h3 className="font-bold text-red-800 flex items-center gap-2 mb-3">
                        <span className="text-2xl">⛔</span>
                        {blockingItems.length} Item{blockingItems.length !== 1 && "s"} Blocking Stage Progression
                    </h3>
                    <ul className="space-y-2">
                        {blockingItems.map((item) => (
                            <li key={item.id} className="flex items-center gap-2 text-red-700">
                                <span>{getCategoryIcon(item.category)}</span>
                                <span>{item.name}</span>
                                {item.canOverride && (
                                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                                        Can Log & Proceed
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                    <p className="mt-4 text-sm text-red-600 font-medium">
                        ⚠️ Do NOT release payment until blocking items are resolved.
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

                            {!req.completed && (
                                <button className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">
                                    Upload Evidence
                                </button>
                            )}
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
                        ✅ All Clear - Proceed to {nextStage}
                    </button>
                ) : canOverride ? (
                    <div className="space-y-3">
                        <button
                            disabled
                            className="w-full py-4 bg-gray-300 text-gray-500 rounded-xl font-bold text-lg cursor-not-allowed"
                        >
                            🚫 Cannot Proceed - {blockingItems.length} Item{blockingItems.length !== 1 && "s"} Pending
                        </button>
                        <button
                            onClick={handleOverride}
                            className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold text-lg hover:bg-amber-600 transition-colors"
                        >
                            ⚠️ Log Defects & Proceed with OC (Accept with Defects)
                        </button>
                    </div>
                ) : (
                    <button
                        disabled
                        className="w-full py-4 bg-gray-300 text-gray-500 rounded-xl font-bold text-lg cursor-not-allowed"
                    >
                        🚫 Cannot Proceed - {hardBlockingItems.length} Critical Item{hardBlockingItems.length !== 1 && "s"} Required
                    </button>
                )}
            </div>

            {/* Override Modal */}
            {showOverrideModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">⚠️ Proceed with Unresolved Defects</h3>

                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4 text-sm text-red-800">
                            <p className="font-bold mb-2">⚠️ IMPORTANT: You are about to accept your new home with the following defects still unresolved:</p>
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

                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6 text-sm text-blue-800">
                            <p className="font-medium">📋 What happens next:</p>
                            <ul className="mt-2 space-y-1">
                                <li>• Defects will be logged with timestamp</li>
                                <li>• Builder legally obligated to rectify within warranty</li>
                                <li>• You can report to Fair Trading if not rectified</li>
                                <li>• HBCF insurance covers structural defects for 6 years</li>
                            </ul>
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
                                Log Defects & Proceed
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">🎉 Confirm {isPCStage ? "Handover" : "Stage Progression"}</h3>
                        <p className="text-gray-600 mb-6">
                            {isPCStage ? (
                                <>
                                    Congratulations! All requirements for <strong>Practical Completion</strong> are met.
                                    Are you ready to complete handover and receive your keys?
                                </>
                            ) : (
                                <>
                                    You have confirmed all requirements for <strong>{stageConfig.name}</strong> are complete.
                                    Are you ready to proceed to <strong>{nextStage}</strong> and authorize the stage payment?
                                </>
                            )}
                        </p>
                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl mb-6 text-sm text-green-800">
                            <p className="font-medium">✅ Before confirming:</p>
                            <ul className="mt-2 space-y-1">
                                <li>• All certificates are filed in your documents</li>
                                <li>• You have photos of the completed work</li>
                                {isPCStage && <li>• You have meter readings recorded</li>}
                                {loggedDefects.length > 0 && <li>• {loggedDefects.length} defect(s) logged for post-handover rectification</li>}
                            </ul>
                        </div>
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
                                {isPCStage ? "🎉 Complete Handover" : "Confirm & Proceed"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Legal Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                <p className="font-medium mb-1">📚 NSW Home Building Act Reminder</p>
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

