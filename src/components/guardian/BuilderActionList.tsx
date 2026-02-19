"use client";

import { useState, useEffect } from "react";

interface PendingAction {
    id: string;
    type: "defect" | "variation" | "inspection" | "certificate" | "checklist" | "custom";
    priority: "critical" | "high" | "medium" | "low";
    title: string;
    description: string;
    stage: string;
    dueDate: string | null;
    status: "pending" | "in_progress" | "awaiting_response" | "completed";
    assignedTo: string;
    createdAt: string;
    lastReminder: string | null;
    reminderCount: number;
}

interface BuilderActionListProps {
    projectId: string;
    projectName: string;
    builderName: string;
    builderEmail?: string;
}

const PRIORITY_CONFIG = {
    critical: { label: "Critical", color: "bg-red-500", bgLight: "bg-red-50", border: "border-red-300" },
    high: { label: "High", color: "bg-orange-500", bgLight: "bg-orange-50", border: "border-orange-300" },
    medium: { label: "Medium", color: "bg-yellow-500", bgLight: "bg-yellow-50", border: "border-yellow-300" },
    low: { label: "Low", color: "bg-blue-500", bgLight: "bg-blue-50", border: "border-blue-300" },
};

const TYPE_ICONS = {
    defect: "🛠️",
    variation: "💰",
    inspection: "🔍",
    certificate: "📜",
    checklist: "📋",
    custom: "📝",
};

// Sample data
const INITIAL_ACTIONS: PendingAction[] = [
    {
        id: "1",
        type: "defect",
        priority: "critical",
        title: "Fix water stain on ceiling - Bedroom 2",
        description: "Water stain appeared after rain. Needs investigation for roof leak.",
        stage: "Lockup",
        dueDate: "2025-08-15",
        status: "pending",
        assignedTo: "Builder",
        createdAt: "2025-08-01",
        lastReminder: null,
        reminderCount: 0,
    },
    {
        id: "2",
        type: "certificate",
        priority: "critical",
        title: "Provide Waterproofing Certificate",
        description: "Waterproofing certificate required before tiling can proceed.",
        stage: "Lockup",
        dueDate: "2025-08-10",
        status: "awaiting_response",
        assignedTo: "Builder",
        createdAt: "2025-07-28",
        lastReminder: "2025-08-05",
        reminderCount: 2,
    },
    {
        id: "3",
        type: "variation",
        priority: "high",
        title: "Sign variation for downlights upgrade",
        description: "Waiting for builder to provide itemized quote for LED downlights.",
        stage: "Fixing",
        dueDate: "2025-08-20",
        status: "in_progress",
        assignedTo: "Builder",
        createdAt: "2025-08-03",
        lastReminder: null,
        reminderCount: 0,
    },
    {
        id: "4",
        type: "inspection",
        priority: "high",
        title: "Schedule Frame Inspection",
        description: "Council frame inspection needs to be booked before plasterboard.",
        stage: "Frame",
        dueDate: null,
        status: "pending",
        assignedTo: "Builder",
        createdAt: "2025-08-02",
        lastReminder: "2025-08-05",
        reminderCount: 1,
    },
];

export default function BuilderActionList({ projectId, projectName, builderName, builderEmail }: BuilderActionListProps) {
    const [actions, setActions] = useState<PendingAction[]>(INITIAL_ACTIONS);
    const [showAddForm, setShowAddForm] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [copied, setCopied] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const [newAction, setNewAction] = useState({
        type: "custom" as PendingAction["type"],
        priority: "medium" as PendingAction["priority"],
        title: "",
        description: "",
        dueDate: "",
    });

    const filteredActions = actions.filter(a => {
        if (filterStatus === "all") return a.status !== "completed";
        if (filterStatus === "completed") return a.status === "completed";
        return a.status === filterStatus;
    });

    const criticalCount = actions.filter(a => a.priority === "critical" && a.status !== "completed").length;
    const pendingCount = actions.filter(a => a.status !== "completed").length;

    const addAction = (e: React.FormEvent) => {
        e.preventDefault();
        const action: PendingAction = {
            id: Date.now().toString(),
            ...newAction,
            stage: "Current",
            status: "pending",
            assignedTo: "Builder",
            createdAt: new Date().toISOString().split("T")[0],
            lastReminder: null,
            reminderCount: 0,
        };
        setActions([action, ...actions]);
        setShowAddForm(false);
        setNewAction({ type: "custom", priority: "medium", title: "", description: "", dueDate: "" });
    };

    const markComplete = (id: string) => {
        setActions(actions.map(a => a.id === id ? { ...a, status: "completed" as const } : a));
    };

    const sendReminder = (id: string) => {
        setActions(actions.map(a =>
            a.id === id ? {
                ...a,
                lastReminder: new Date().toISOString().split("T")[0],
                reminderCount: a.reminderCount + 1
            } : a
        ));
    };

    const generateShareableList = () => {
        const pendingActions = actions.filter(a => a.status !== "completed");
        const date = new Date().toLocaleDateString("en-AU", {
            weekday: "long", day: "numeric", month: "long", year: "numeric"
        });

        let text = `🏠 BUILDER ACTION LIST\n`;
        text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        text += `Project: ${projectName}\n`;
        text += `To: ${builderName}\n`;
        text += `Date: ${date}\n\n`;
        text += `Dear ${builderName},\n\n`;
        text += `Please find below the outstanding items requiring your attention before we can proceed to the next stage.\n\n`;

        // Group by priority
        const critical = pendingActions.filter(a => a.priority === "critical");
        const high = pendingActions.filter(a => a.priority === "high");
        const other = pendingActions.filter(a => a.priority !== "critical" && a.priority !== "high");

        if (critical.length > 0) {
            text += `🚨 CRITICAL - Must be resolved immediately:\n`;
            text += `─────────────────────────────────────────\n`;
            critical.forEach((a, i) => {
                text += `${i + 1}. ${a.title}\n`;
                text += `   ${TYPE_ICONS[a.type]} ${a.description}\n`;
                if (a.dueDate) text += `   📅 Due: ${new Date(a.dueDate).toLocaleDateString("en-AU")}\n`;
                text += `\n`;
            });
        }

        if (high.length > 0) {
            text += `⚠️ HIGH PRIORITY:\n`;
            text += `─────────────────────────────────────────\n`;
            high.forEach((a, i) => {
                text += `${i + 1}. ${a.title}\n`;
                text += `   ${TYPE_ICONS[a.type]} ${a.description}\n`;
                if (a.dueDate) text += `   📅 Due: ${new Date(a.dueDate).toLocaleDateString("en-AU")}\n`;
                text += `\n`;
            });
        }

        if (other.length > 0) {
            text += `📋 OTHER ITEMS:\n`;
            text += `─────────────────────────────────────────\n`;
            other.forEach((a, i) => {
                text += `${i + 1}. ${a.title}\n`;
                text += `   ${TYPE_ICONS[a.type]} ${a.description}\n`;
                if (a.dueDate) text += `   📅 Due: ${new Date(a.dueDate).toLocaleDateString("en-AU")}\n`;
                text += `\n`;
            });
        }

        text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `⚠️ IMPORTANT NOTICE:\n`;
        text += `Please address the CRITICAL items before proceeding with any further work.\n`;
        text += `Payment for the next stage will not be released until all critical items are resolved.\n\n`;
        text += `Please respond confirming receipt and expected completion dates.\n\n`;
        text += `Kind regards,\n`;
        text += `Homeowner\n`;
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

    const canProceedToNextStage = criticalCount === 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold">📋 Builder Action List</h2>
                    <p className="text-muted-foreground">
                        Track pending items and share with your builder
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                    {showAddForm ? "Cancel" : "+ Add Action Item"}
                </button>
            </div>

            {/* Stage Progress Blocker */}
            {!canProceedToNextStage && (
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
            )}

            {canProceedToNextStage && pendingCount === 0 && (
                <div className="p-4 bg-green-50 border border-green-300 rounded-xl">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">✅</span>
                        <div>
                            <h3 className="font-bold text-green-800">All Clear!</h3>
                            <p className="text-green-700 text-sm">
                                No pending actions. You can proceed to the next stage.
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
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-center">
                    <div className="text-2xl font-bold text-orange-600">
                        {actions.filter(a => a.priority === "high" && a.status !== "completed").length}
                    </div>
                    <div className="text-xs text-orange-700">High</div>
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

            {/* Share Actions */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <h3 className="font-bold mb-3">📤 Share Action List with Builder</h3>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={copyToClipboard}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${copied ? "bg-green-500 text-white" : "bg-white border border-gray-300 hover:bg-gray-50"
                            }`}
                    >
                        {copied ? "✓ Copied!" : "📋 Copy to Clipboard"}
                    </button>
                    <button
                        onClick={shareViaEmail}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${emailSent ? "bg-green-500 text-white" : "bg-blue-500 text-white hover:bg-blue-600"
                            }`}
                    >
                        {emailSent ? "✓ Email Opened!" : "📧 Send via Email"}
                    </button>
                    <button
                        onClick={shareViaWhatsApp}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
                    >
                        💬 Share via WhatsApp
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Creates a formatted list of all pending items with priorities and due dates.
                </p>
            </div>

            {/* Add Form */}
            {showAddForm && (
                <form onSubmit={addAction} className="p-6 bg-card border border-border rounded-xl space-y-4">
                    <h3 className="font-bold">Add New Action Item</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Type</label>
                            <select
                                value={newAction.type}
                                onChange={(e) => setNewAction({ ...newAction, type: e.target.value as any })}
                                className="w-full p-3 border border-border rounded-lg"
                            >
                                <option value="defect">🛠️ Defect</option>
                                <option value="variation">💰 Variation</option>
                                <option value="inspection">🔍 Inspection</option>
                                <option value="certificate">📜 Certificate</option>
                                <option value="checklist">📋 Checklist Item</option>
                                <option value="custom">📝 Custom</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Priority</label>
                            <select
                                value={newAction.priority}
                                onChange={(e) => setNewAction({ ...newAction, priority: e.target.value as any })}
                                className="w-full p-3 border border-border rounded-lg"
                            >
                                <option value="critical">🚨 Critical (Blocks Progress)</option>
                                <option value="high">⚠️ High</option>
                                <option value="medium">📋 Medium</option>
                                <option value="low">📝 Low</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Title</label>
                            <input
                                type="text"
                                value={newAction.title}
                                onChange={(e) => setNewAction({ ...newAction, title: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg"
                                placeholder="e.g., Fix cracked tile in bathroom"
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                value={newAction.description}
                                onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg resize-none h-20"
                                placeholder="Detailed description..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Due Date (optional)</label>
                            <input
                                type="date"
                                value={newAction.dueDate}
                                onChange={(e) => setNewAction({ ...newAction, dueDate: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
                    >
                        Add Action Item
                    </button>
                </form>
            )}

            {/* Filter */}
            <div className="flex gap-2">
                {["all", "pending", "in_progress", "awaiting_response", "completed"].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === status
                                ? "bg-primary text-white"
                                : "bg-muted hover:bg-muted/80"
                            }`}
                    >
                        {status === "all" ? "Pending" : status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                ))}
            </div>

            {/* Action List */}
            <div className="space-y-3">
                {filteredActions.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        {filterStatus === "completed" ? "No completed items yet." : "No pending actions! 🎉"}
                    </div>
                ) : (
                    filteredActions.map((action) => {
                        const priority = PRIORITY_CONFIG[action.priority];
                        const isOverdue = action.dueDate && new Date(action.dueDate) < new Date() && action.status !== "completed";

                        return (
                            <div
                                key={action.id}
                                className={`p-4 rounded-xl border-2 ${priority.bgLight} ${priority.border} ${isOverdue ? "ring-2 ring-red-500" : ""
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span>{TYPE_ICONS[action.type]}</span>
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
                                                <span>📅 Due: {new Date(action.dueDate).toLocaleDateString("en-AU")}</span>
                                            )}
                                            <span>📍 Stage: {action.stage}</span>
                                            {action.reminderCount > 0 && (
                                                <span className="text-orange-600">
                                                    🔔 {action.reminderCount} reminder{action.reminderCount !== 1 && "s"} sent
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {action.status !== "completed" && (
                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => sendReminder(action.id)}
                                                className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-sm hover:bg-orange-200"
                                                title="Send reminder"
                                            >
                                                🔔
                                            </button>
                                            <button
                                                onClick={() => markComplete(action.id)}
                                                className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                                                title="Mark complete"
                                            >
                                                ✓
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Help Text */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <p className="font-medium mb-1">💡 Pro Tip: Keep a Paper Trail</p>
                <p>
                    Always share the action list via email to create a written record. If disputes arise,
                    this documentation proves you communicated issues in writing. Save copies of all sent emails.
                </p>
            </div>
        </div>
    );
}
