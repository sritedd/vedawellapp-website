"use client";

import { useState, useRef } from "react";
import {
    getOpenDefects,
    countDefectsBySeverity,
    createDefectStatusUpdate,
    Defect as UtilDefect,
} from "@/lib/guardian/calculations";

interface Defect {
    id: string;
    title: string;
    description: string;
    location: string;
    stage: string;
    severity: "critical" | "major" | "minor" | "cosmetic";
    status: "open" | "reported" | "in_progress" | "rectified" | "verified" | "disputed";
    reportedDate: string;
    dueDate?: string;
    rectifiedDate?: string;
    verifiedDate?: string;
    photos: string[];
    rectificationPhotos: string[];
    builderNotes?: string;
    homeownerNotes?: string;
    reminderCount: number;
}

interface ProjectDefectsProps {
    projectId: string;
}

const SEVERITY_CONFIG = {
    critical: { label: "Critical", color: "bg-red-500", bgLight: "bg-red-50", border: "border-red-300", description: "Safety or structural issue" },
    major: { label: "Major", color: "bg-orange-500", bgLight: "bg-orange-50", border: "border-orange-300", description: "Affects functionality" },
    minor: { label: "Minor", color: "bg-yellow-500", bgLight: "bg-yellow-50", border: "border-yellow-300", description: "Visible but not functional" },
    cosmetic: { label: "Cosmetic", color: "bg-blue-500", bgLight: "bg-blue-50", border: "border-blue-300", description: "Aesthetic only" },
};

const STATUS_CONFIG = {
    open: { label: "Open", color: "text-red-700 bg-red-100" },
    reported: { label: "Reported to Builder", color: "text-orange-700 bg-orange-100" },
    in_progress: { label: "In Progress", color: "text-blue-700 bg-blue-100" },
    rectified: { label: "Rectified", color: "text-purple-700 bg-purple-100" },
    verified: { label: "Verified Fixed", color: "text-green-700 bg-green-100" },
    disputed: { label: "Disputed", color: "text-red-700 bg-red-200" },
};

const LOCATIONS = [
    "Kitchen", "Living Room", "Dining Room", "Master Bedroom", "Bedroom 2", "Bedroom 3", "Bedroom 4",
    "Master Ensuite", "Bathroom 1", "Bathroom 2", "Powder Room", "Laundry", "Garage", "Entry",
    "Hallway", "Stairs", "Balcony", "Alfresco", "External", "Roof", "Driveway", "Landscaping"
];

const STAGES = ["Base/Slab", "Frame", "Lockup", "Fixing", "Practical Completion", "Post-Handover"];

const INITIAL_DEFECTS: Defect[] = [
    {
        id: "1",
        title: "Cracked tile in Master Ensuite",
        description: "Hairline crack visible on floor tile near shower entry",
        location: "Master Ensuite",
        stage: "Fixing",
        severity: "minor",
        status: "reported",
        reportedDate: "2025-08-01",
        dueDate: "2025-08-15",
        photos: [],
        rectificationPhotos: [],
        homeownerNotes: "Noticed during inspection",
        reminderCount: 1,
    },
    {
        id: "2",
        title: "Paint peeling on garage ceiling",
        description: "Paint bubbling and peeling in two areas, approximately 30cm x 30cm each",
        location: "Garage",
        stage: "Practical Completion",
        severity: "cosmetic",
        status: "open",
        reportedDate: "2025-08-05",
        photos: [],
        rectificationPhotos: [],
        reminderCount: 0,
    },
    {
        id: "3",
        title: "Door not closing properly - Bedroom 2",
        description: "Door rubs against frame, requires excessive force to close",
        location: "Bedroom 2",
        stage: "Fixing",
        severity: "major",
        status: "in_progress",
        reportedDate: "2025-07-28",
        dueDate: "2025-08-10",
        photos: [],
        rectificationPhotos: [],
        builderNotes: "Carpenter scheduled for next week",
        reminderCount: 2,
    },
];

export default function ProjectDefects({ projectId }: ProjectDefectsProps) {
    const [defects, setDefects] = useState<Defect[]>(INITIAL_DEFECTS);
    const [showForm, setShowForm] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterSeverity, setFilterSeverity] = useState<string>("all");
    const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [newDefect, setNewDefect] = useState({
        title: "",
        description: "",
        location: "Kitchen",
        stage: "Practical Completion",
        severity: "minor" as Defect["severity"],
        dueDate: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const defect: Defect = {
            id: Date.now().toString(),
            ...newDefect,
            status: "open",
            reportedDate: new Date().toISOString().split("T")[0],
            photos: [],
            rectificationPhotos: [],
            reminderCount: 0,
        };
        setDefects([defect, ...defects]);
        setShowForm(false);
        setNewDefect({ title: "", description: "", location: "Kitchen", stage: "Practical Completion", severity: "minor", dueDate: "" });
    };

    const updateStatus = (id: string, newStatus: Defect["status"]) => {
        setDefects(defects.map(d => {
            if (d.id === id) {
                // Use tested utility function to create status update
                const statusUpdate = createDefectStatusUpdate(newStatus as UtilDefect['status']);
                return { ...d, ...statusUpdate };
            }
            return d;
        }));
    };

    const sendReminder = (id: string) => {
        setDefects(defects.map(d =>
            d.id === id ? { ...d, reminderCount: d.reminderCount + 1 } : d
        ));
    };

    const generateExportList = () => {
        // Use tested utility function for filtering
        const openDefects = getOpenDefects(defects as UtilDefect[]) as Defect[];
        let text = "🏠 DEFECT REPORT\n";
        text += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
        text += `Date: ${new Date().toLocaleDateString("en-AU")}\n`;
        text += `Total Open Defects: ${openDefects.length}\n\n`;

        openDefects.forEach((d, i) => {
            const severity = SEVERITY_CONFIG[d.severity];
            text += `${i + 1}. ${d.title} [${severity.label.toUpperCase()}]\n`;
            text += `   📍 Location: ${d.location}\n`;
            text += `   📝 ${d.description}\n`;
            if (d.dueDate) text += `   📅 Due: ${new Date(d.dueDate).toLocaleDateString("en-AU")}\n`;
            text += `   Status: ${STATUS_CONFIG[d.status].label}\n\n`;
        });

        text += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        text += "Please address these defects as per the contract.\n";

        return text;
    };

    const copyList = async () => {
        await navigator.clipboard.writeText(generateExportList());
        alert("Defect list copied to clipboard!");
    };

    const emailList = () => {
        const subject = encodeURIComponent("Defect Report - Action Required");
        const body = encodeURIComponent(generateExportList());
        window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    };

    const filteredDefects = defects.filter(d => {
        if (filterStatus !== "all" && d.status !== filterStatus) return false;
        if (filterSeverity !== "all" && d.severity !== filterSeverity) return false;
        return true;
    });

    const openCount = defects.filter(d => !["verified", "rectified"].includes(d.status)).length;
    const criticalCount = defects.filter(d => d.severity === "critical" && !["verified", "rectified"].includes(d.status)).length;
    const overdueCount = defects.filter(d => d.dueDate && new Date(d.dueDate) < new Date() && !["verified", "rectified"].includes(d.status)).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">🛠️ Defect & Snag List</h2>
                    <p className="text-muted-foreground">Track and manage construction defects</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    {showForm ? "Cancel" : "+ Report Defect"}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                    <div className="text-2xl font-bold text-red-600">{openCount}</div>
                    <div className="text-xs text-red-700">Open</div>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-center">
                    <div className="text-2xl font-bold text-orange-600">{criticalCount}</div>
                    <div className="text-xs text-orange-700">Critical</div>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                    <div className="text-2xl font-bold text-amber-600">{overdueCount}</div>
                    <div className="text-xs text-amber-700">Overdue</div>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                    <div className="text-2xl font-bold text-green-600">
                        {defects.filter(d => d.status === "verified").length}
                    </div>
                    <div className="text-xs text-green-700">Verified</div>
                </div>
            </div>

            {/* Share Actions */}
            <div className="flex gap-3">
                <button onClick={copyList} className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">
                    📋 Copy List
                </button>
                <button onClick={emailList} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200">
                    📧 Email to Builder
                </button>
            </div>

            {/* Add Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="p-6 bg-card border border-border rounded-xl space-y-4">
                    <h3 className="font-bold">Report New Defect</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Title</label>
                            <input
                                type="text"
                                value={newDefect.title}
                                onChange={(e) => setNewDefect({ ...newDefect, title: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg"
                                placeholder="e.g., Cracked tile in bathroom"
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                value={newDefect.description}
                                onChange={(e) => setNewDefect({ ...newDefect, description: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg resize-none h-20"
                                placeholder="Describe the defect in detail..."
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Location</label>
                            <select
                                value={newDefect.location}
                                onChange={(e) => setNewDefect({ ...newDefect, location: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg"
                            >
                                {LOCATIONS.map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Stage</label>
                            <select
                                value={newDefect.stage}
                                onChange={(e) => setNewDefect({ ...newDefect, stage: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg"
                            >
                                {STAGES.map(stage => (
                                    <option key={stage} value={stage}>{stage}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Severity</label>
                            <select
                                value={newDefect.severity}
                                onChange={(e) => setNewDefect({ ...newDefect, severity: e.target.value as Defect["severity"] })}
                                className="w-full p-3 border border-border rounded-lg"
                            >
                                {Object.entries(SEVERITY_CONFIG).map(([key, val]) => (
                                    <option key={key} value={key}>{val.label} - {val.description}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Due Date</label>
                            <input
                                type="date"
                                value={newDefect.dueDate}
                                onChange={(e) => setNewDefect({ ...newDefect, dueDate: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg"
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
                        Report Defect
                    </button>
                </form>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="flex gap-2">
                    <span className="text-sm text-muted-foreground self-center">Status:</span>
                    {["all", ...Object.keys(STATUS_CONFIG)].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${filterStatus === status ? "bg-primary text-white" : "bg-muted"
                                }`}
                        >
                            {status === "all" ? "All" : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Defect List */}
            <div className="space-y-4">
                {filteredDefects.length === 0 ? (
                    <div className="p-12 text-center border border-dashed border-border rounded-xl">
                        <span className="text-4xl block mb-2">✨</span>
                        <p className="text-muted-foreground">No defects found. Great work!</p>
                    </div>
                ) : (
                    filteredDefects.map((defect) => {
                        const severity = SEVERITY_CONFIG[defect.severity];
                        const status = STATUS_CONFIG[defect.status];
                        const isOverdue = defect.dueDate && new Date(defect.dueDate) < new Date() && !["verified", "rectified"].includes(defect.status);

                        return (
                            <div
                                key={defect.id}
                                className={`p-5 rounded-xl border-2 ${severity.bgLight} ${severity.border} ${isOverdue ? "ring-2 ring-red-500" : ""
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-lg">{defect.title}</h3>
                                            {isOverdue && (
                                                <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded">
                                                    OVERDUE
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600">{defect.description}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${severity.color} text-white`}>
                                            {severity.label}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
                                            {status.label}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">
                                    <span>📍 {defect.location}</span>
                                    <span>🔧 {defect.stage}</span>
                                    <span>📅 Reported: {new Date(defect.reportedDate).toLocaleDateString("en-AU")}</span>
                                    {defect.dueDate && (
                                        <span>⏰ Due: {new Date(defect.dueDate).toLocaleDateString("en-AU")}</span>
                                    )}
                                    {defect.reminderCount > 0 && (
                                        <span className="text-orange-600">🔔 {defect.reminderCount} reminders</span>
                                    )}
                                </div>

                                {(defect.builderNotes || defect.homeownerNotes) && (
                                    <div className="mb-4 p-3 bg-white/50 rounded-lg text-sm">
                                        {defect.builderNotes && (
                                            <p><span className="font-medium">Builder:</span> {defect.builderNotes}</p>
                                        )}
                                        {defect.homeownerNotes && (
                                            <p><span className="font-medium">Notes:</span> {defect.homeownerNotes}</p>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex flex-wrap gap-2">
                                    {defect.status === "open" && (
                                        <button
                                            onClick={() => updateStatus(defect.id, "reported")}
                                            className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded text-sm"
                                        >
                                            📧 Mark Reported
                                        </button>
                                    )}
                                    {defect.status === "reported" && (
                                        <>
                                            <button
                                                onClick={() => updateStatus(defect.id, "in_progress")}
                                                className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-sm"
                                            >
                                                🔧 Mark In Progress
                                            </button>
                                            <button
                                                onClick={() => sendReminder(defect.id)}
                                                className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded text-sm"
                                            >
                                                🔔 Send Reminder
                                            </button>
                                        </>
                                    )}
                                    {defect.status === "in_progress" && (
                                        <button
                                            onClick={() => updateStatus(defect.id, "rectified")}
                                            className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded text-sm"
                                        >
                                            ✓ Mark Rectified
                                        </button>
                                    )}
                                    {defect.status === "rectified" && (
                                        <>
                                            <button
                                                onClick={() => updateStatus(defect.id, "verified")}
                                                className="px-3 py-1.5 bg-green-100 text-green-700 rounded text-sm"
                                            >
                                                ✅ Verify Fixed
                                            </button>
                                            <button
                                                onClick={() => updateStatus(defect.id, "disputed")}
                                                className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm"
                                            >
                                                ❌ Not Fixed
                                            </button>
                                        </>
                                    )}
                                    {!["verified"].includes(defect.status) && (
                                        <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm">
                                            📸 Add Photo
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Help */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                <p className="font-medium mb-1">💡 Defect Tracking Tips</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>Always take photos of defects before and after rectification</li>
                    <li>Report defects in writing and keep copies of all communications</li>
                    <li>Critical and Major defects should be resolved before making payments</li>
                    <li>You have up to 6 years for structural defects under NSW warranty</li>
                </ul>
            </div>
        </div>
    );
}
