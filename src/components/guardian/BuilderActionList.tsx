"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface PendingAction {
    id: string;
    type: "defect" | "variation" | "inspection" | "certificate" | "custom";
    priority: "critical" | "high" | "medium" | "low";
    title: string;
    description: string;
    stage: string;
    dueDate: string | null;
    status: "pending" | "in_progress" | "awaiting_response" | "completed";
    createdAt: string;
    sourceTable: string;
}

interface BuilderActionListProps {
    projectId: string;
    projectName: string;
    builderName: string;
    builderEmail?: string;
}

const PRIORITY_CONFIG = {
    critical: { label: "Critical", color: "bg-red-500", bgLight: "bg-red-50", border: "border-red-300" },
    high: { label: "High", color: "bg-amber-500", bgLight: "bg-amber-50", border: "border-amber-300" },
    medium: { label: "Medium", color: "bg-yellow-500", bgLight: "bg-yellow-50", border: "border-yellow-300" },
    low: { label: "Low", color: "bg-blue-500", bgLight: "bg-blue-50", border: "border-blue-300" },
};

const TYPE_ICONS: Record<string, string> = {
    defect: "🛠️",
    variation: "💰",
    inspection: "🔍",
    certificate: "📜",
    custom: "📝",
};

function mapDefectPriority(severity: string): PendingAction["priority"] {
    if (severity === "critical") return "critical";
    if (severity === "major") return "high";
    return "medium";
}

function mapDefectStatus(status: string): PendingAction["status"] {
    if (status === "open" || status === "reported") return "pending";
    if (status === "in_progress") return "in_progress";
    if (status === "fixed" || status === "rectified" || status === "verified" || status === "disputed") return "completed";
    return "pending";
}

function mapVariationStatus(status: string): PendingAction["status"] {
    if (status === "draft") return "pending";
    if (status === "sent") return "awaiting_response";
    if (status === "approved" || status === "rejected") return "completed";
    return "pending";
}

function mapInspectionStatus(result: string): PendingAction["status"] {
    if (result === "not_booked") return "pending";
    if (result === "booked") return "in_progress";
    if (result === "passed") return "completed";
    if (result === "failed") return "pending"; // needs re-scheduling
    return "pending";
}

function mapCertStatus(status: string): PendingAction["status"] {
    if (status === "pending") return "pending";
    if (status === "uploaded" || status === "verified") return "completed";
    if (status === "expired") return "pending";
    return "pending";
}

export default function BuilderActionList({ projectId, projectName, builderName, builderEmail }: BuilderActionListProps) {
    const [actions, setActions] = useState<PendingAction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [copied, setCopied] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    useEffect(() => {
        const fetchActions = async () => {
            const supabase = createClient();
            const allActions: PendingAction[] = [];

            // 1. Fetch open defects
            const { data: defects } = await supabase
                .from("defects")
                .select("id, title, description, severity, status, stage, due_date, created_at")
                .eq("project_id", projectId);

            if (defects) {
                for (const d of defects) {
                    allActions.push({
                        id: d.id,
                        type: "defect",
                        priority: mapDefectPriority(d.severity || "minor"),
                        title: d.title,
                        description: d.description || "",
                        stage: d.stage || "—",
                        dueDate: d.due_date || null,
                        status: mapDefectStatus(d.status),
                        createdAt: d.created_at,
                        sourceTable: "defects",
                    });
                }
            }

            // 2. Fetch pending variations
            const { data: variations } = await supabase
                .from("variations")
                .select("id, title, description, status, additional_cost, created_at")
                .eq("project_id", projectId);

            if (variations) {
                for (const v of variations) {
                    allActions.push({
                        id: v.id,
                        type: "variation",
                        priority: (v.additional_cost || 0) > 5000 ? "high" : "medium",
                        title: v.title,
                        description: v.description || `Cost: $${(v.additional_cost || 0).toLocaleString()}`,
                        stage: "—",
                        dueDate: null,
                        status: mapVariationStatus(v.status),
                        createdAt: v.created_at,
                        sourceTable: "variations",
                    });
                }
            }

            // 3. Fetch inspections
            const { data: inspections } = await supabase
                .from("inspections")
                .select("id, stage, scheduled_date, result, inspector_name, notes, created_at")
                .eq("project_id", projectId);

            if (inspections) {
                for (const i of inspections) {
                    const stageLabel = (i.stage || "").replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
                    allActions.push({
                        id: i.id,
                        type: "inspection",
                        priority: i.result === "failed" ? "critical" : "high",
                        title: `${stageLabel} Inspection`,
                        description: i.result === "failed"
                            ? `Failed — needs re-inspection. ${i.notes || ""}`
                            : i.result === "not_booked"
                                ? "Needs to be booked"
                                : i.result === "booked"
                                    ? `Booked${i.scheduled_date ? ` for ${new Date(i.scheduled_date).toLocaleDateString("en-AU")}` : ""}`
                                    : "Passed",
                        stage: stageLabel,
                        dueDate: i.scheduled_date || null,
                        status: mapInspectionStatus(i.result),
                        createdAt: i.created_at,
                        sourceTable: "inspections",
                    });
                }
            }

            // 4. Fetch certifications
            const { data: certs } = await supabase
                .from("certifications")
                .select("id, type, status, required_for_stage, expiry_date, created_at")
                .eq("project_id", projectId);

            if (certs) {
                for (const c of certs) {
                    const stageLabel = (c.required_for_stage || "").replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
                    allActions.push({
                        id: c.id,
                        type: "certificate",
                        priority: c.status === "expired" ? "critical" : "high",
                        title: `${c.type} Certificate`,
                        description: c.status === "expired"
                            ? "Certificate has expired — needs renewal"
                            : c.status === "pending"
                                ? `Required for ${stageLabel || "next stage"}`
                                : `Uploaded for ${stageLabel || "stage"}`,
                        stage: stageLabel || "—",
                        dueDate: c.expiry_date || null,
                        status: mapCertStatus(c.status),
                        createdAt: c.created_at,
                        sourceTable: "certifications",
                    });
                }
            }

            // Sort: pending first, then by priority, then by date
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            const statusOrder = { pending: 0, in_progress: 1, awaiting_response: 2, completed: 3 };
            allActions.sort((a, b) => {
                const sd = statusOrder[a.status] - statusOrder[b.status];
                if (sd !== 0) return sd;
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            });

            setActions(allActions);
            setLoading(false);
        };

        fetchActions();
    }, [projectId]);

    const filteredActions = actions.filter(a => {
        if (filterStatus === "all") return a.status !== "completed";
        if (filterStatus === "completed") return a.status === "completed";
        return a.status === filterStatus;
    });

    const criticalCount = actions.filter(a => a.priority === "critical" && a.status !== "completed").length;
    const pendingCount = actions.filter(a => a.status !== "completed").length;

    const generateShareableList = () => {
        const pendingActions = actions.filter(a => a.status !== "completed");
        const date = new Date().toLocaleDateString("en-AU", {
            weekday: "long", day: "numeric", month: "long", year: "numeric"
        });

        let text = `BUILDER ACTION LIST\n`;
        text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        text += `Project: ${projectName}\n`;
        text += `To: ${builderName}\n`;
        text += `Date: ${date}\n\n`;
        text += `Dear ${builderName},\n\n`;
        text += `Please find below the outstanding items requiring your attention.\n\n`;

        const critical = pendingActions.filter(a => a.priority === "critical");
        const high = pendingActions.filter(a => a.priority === "high");
        const other = pendingActions.filter(a => a.priority !== "critical" && a.priority !== "high");

        if (critical.length > 0) {
            text += `CRITICAL - Must be resolved immediately:\n`;
            text += `─────────────────────────────────────────\n`;
            critical.forEach((a, i) => {
                text += `${i + 1}. ${a.title}\n`;
                text += `   ${a.description}\n`;
                if (a.dueDate) text += `   Due: ${new Date(a.dueDate).toLocaleDateString("en-AU")}\n`;
                text += `\n`;
            });
        }

        if (high.length > 0) {
            text += `HIGH PRIORITY:\n`;
            text += `─────────────────────────────────────────\n`;
            high.forEach((a, i) => {
                text += `${i + 1}. ${a.title}\n`;
                text += `   ${a.description}\n`;
                if (a.dueDate) text += `   Due: ${new Date(a.dueDate).toLocaleDateString("en-AU")}\n`;
                text += `\n`;
            });
        }

        if (other.length > 0) {
            text += `OTHER ITEMS:\n`;
            text += `─────────────────────────────────────────\n`;
            other.forEach((a, i) => {
                text += `${i + 1}. ${a.title}\n`;
                text += `   ${a.description}\n`;
                if (a.dueDate) text += `   Due: ${new Date(a.dueDate).toLocaleDateString("en-AU")}\n`;
                text += `\n`;
            });
        }

        text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `Please respond confirming receipt and expected completion dates.\n\n`;
        text += `Kind regards,\nHomeowner\n`;
        text += `\n─────────────────────────────────────────\n`;
        text += `Generated via HomeOwner Guardian | ${new Date().toLocaleString("en-AU")}\n`;

        return text;
    };

    const copyToClipboard = async () => {
        const text = generateShareableList();
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    const shareViaEmail = () => {
        const subject = encodeURIComponent(`Action Items Required - ${projectName}`);
        const body = encodeURIComponent(generateShareableList());
        const mailtoUrl = `mailto:${builderEmail || ""}?subject=${subject}&body=${body}`;
        window.open(mailtoUrl, "_blank");
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000);
    };

    const shareViaWhatsApp = () => {
        const text = encodeURIComponent(generateShareableList());
        window.open(`https://wa.me/?text=${text}`, "_blank");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold">Pending Actions</h2>
                <p className="text-muted-foreground">
                    All outstanding defects, variations, inspections, and certificates for this project
                </p>
            </div>

            {/* Summary banner */}
            {pendingCount === 0 ? (
                <div className="p-4 bg-green-50 border border-green-300 rounded-xl">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">✅</span>
                        <div>
                            <h3 className="font-bold text-green-800">All Clear</h3>
                            <p className="text-green-700 text-sm">
                                No pending actions. You can proceed to the next stage.
                            </p>
                        </div>
                    </div>
                </div>
            ) : criticalCount > 0 ? (
                <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🚫</span>
                        <div>
                            <h3 className="font-bold text-red-800">Stage Progression Blocked</h3>
                            <p className="text-red-700 text-sm">
                                {criticalCount} critical item{criticalCount !== 1 && "s"} must be resolved before
                                proceeding to the next stage or releasing payment.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">⚠️</span>
                        <div>
                            <h3 className="font-bold text-amber-800">{pendingCount} Item{pendingCount !== 1 && "s"} Pending</h3>
                            <p className="text-amber-700 text-sm">
                                No critical blockers, but items still need attention.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                    <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
                    <div className="text-xs text-red-700">Critical</div>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                    <div className="text-2xl font-bold text-amber-600">
                        {actions.filter(a => a.priority === "high" && a.status !== "completed").length}
                    </div>
                    <div className="text-xs text-amber-700">High</div>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
                    <div className="text-2xl font-bold text-blue-600">{pendingCount}</div>
                    <div className="text-xs text-blue-700">Total Pending</div>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                    <div className="text-2xl font-bold text-green-600">
                        {actions.filter(a => a.status === "completed").length}
                    </div>
                    <div className="text-xs text-green-700">Completed</div>
                </div>
            </div>

            {/* Share Actions — only show if there are pending items */}
            {pendingCount > 0 && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl border border-blue-200">
                    <h3 className="font-bold mb-3">Share Action List with Builder</h3>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={copyToClipboard}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${copied ? "bg-green-500 text-white" : "bg-white border border-gray-300 hover:bg-gray-50"}`}
                        >
                            {copied ? "Copied!" : "Copy to Clipboard"}
                        </button>
                        <button
                            onClick={shareViaEmail}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${emailSent ? "bg-green-500 text-white" : "bg-blue-500 text-white hover:bg-blue-600"}`}
                        >
                            {emailSent ? "Email Opened!" : "Send via Email"}
                        </button>
                        <button
                            onClick={shareViaWhatsApp}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
                        >
                            Share via WhatsApp
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Creates a formatted list of all pending items with priorities and due dates.
                    </p>
                </div>
            )}

            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
                {[
                    { key: "all", label: "Pending" },
                    { key: "in_progress", label: "In Progress" },
                    { key: "awaiting_response", label: "Awaiting Response" },
                    { key: "completed", label: "Completed" },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setFilterStatus(key)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === key
                            ? "bg-primary text-white"
                            : "bg-muted hover:bg-muted/80"
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Action List */}
            <div className="space-y-3">
                {filteredActions.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        {filterStatus === "completed"
                            ? "No completed items yet."
                            : filterStatus === "all"
                                ? "No pending actions — everything is on track."
                                : "No items with this status."}
                    </div>
                ) : (
                    filteredActions.map((action) => {
                        const priority = PRIORITY_CONFIG[action.priority];
                        const isOverdue = action.dueDate && new Date(action.dueDate) < new Date() && action.status !== "completed";

                        return (
                            <div
                                key={`${action.sourceTable}-${action.id}`}
                                className={`p-4 rounded-xl border-2 ${priority.bgLight} ${priority.border} ${isOverdue ? "ring-2 ring-red-500" : ""}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span>{TYPE_ICONS[action.type] || "📝"}</span>
                                            <span className="font-medium">{action.title}</span>
                                            <span className={`px-2 py-0.5 rounded text-xs text-white ${priority.color}`}>
                                                {priority.label}
                                            </span>
                                            {isOverdue && (
                                                <span className="px-2 py-0.5 bg-red-500 text-white rounded text-xs">
                                                    OVERDUE
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                            {action.dueDate && (
                                                <span>Due: {new Date(action.dueDate).toLocaleDateString("en-AU")}</span>
                                            )}
                                            {action.stage !== "—" && (
                                                <span>Stage: {action.stage}</span>
                                            )}
                                            <span className="capitalize text-gray-400">{action.type}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Help Text */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <p className="font-medium mb-1">Pro Tip: Keep a Paper Trail</p>
                <p>
                    Always share the action list via email to create a written record. If disputes arise,
                    this documentation proves you communicated issues in writing.
                </p>
            </div>
        </div>
    );
}
