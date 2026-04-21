"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
    createDefectStatusUpdate,
    isValidStatusTransition,
    Defect as UtilDefect,
} from "@/lib/guardian/calculations";
import AIDefectAssist from "@/components/guardian/AIDefectAssist";
import DefectAgingBadge from "@/components/guardian/DefectAgingBadge";
import { useToast } from "@/components/guardian/Toast";
import type { DefectAnalysis } from "@/lib/ai/prompts";

interface Defect {
    id: string;
    project_id: string;
    title: string;
    description: string;
    location: string;
    stage: string;
    severity: "critical" | "major" | "minor" | "cosmetic";
    status: "open" | "reported" | "in_progress" | "rectified" | "verified" | "disputed";
    reported_date: string;
    due_date?: string | null;
    rectified_date?: string | null;
    verified_date?: string | null;
    image_url?: string | null;
    builder_notes?: string | null;
    homeowner_notes?: string | null;
    reminder_count: number;
    created_at: string;
    reported_at?: string | null;
    escalation_level?: string;
}

interface ProjectDefectsProps {
    projectId: string;
    stages?: string[];
    builderEmail?: string;
    onDataChanged?: () => void;
}

const FREE_DEFECT_LIMIT = 3;

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
    fixed: { label: "Fixed", color: "text-teal-700 bg-teal-100" },
    rectified: { label: "Rectified", color: "text-purple-700 bg-purple-100" },
    verified: { label: "Verified Fixed", color: "text-green-700 bg-green-100" },
    disputed: { label: "Disputed", color: "text-red-700 bg-red-200" },
};

const LOCATIONS = [
    "Kitchen", "Living Room", "Dining Room", "Master Bedroom", "Bedroom 2", "Bedroom 3", "Bedroom 4",
    "Master Ensuite", "Bathroom 1", "Bathroom 2", "Powder Room", "Laundry", "Garage", "Entry",
    "Hallway", "Stairs", "Balcony", "Alfresco", "External", "Roof", "Driveway", "Landscaping"
];

const DEFAULT_STAGES = ["Base/Slab", "Frame", "Lockup", "Fixing", "Practical Completion", "Post-Handover"];

export default function ProjectDefects({ projectId, stages, builderEmail, onDataChanged }: ProjectDefectsProps) {
    const { toast } = useToast();
    const [defects, setDefects] = useState<Defect[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterSeverity, setFilterSeverity] = useState<string>("all");
    const [error, setError] = useState("");
    const [uploadingPhotoId, setUploadingPhotoId] = useState<string | null>(null);
    const [tierLimited, setTierLimited] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeDefectRef = useRef<string | null>(null);

    const STAGES = stages && stages.length > 0 ? stages : DEFAULT_STAGES;

    const [newDefect, setNewDefect] = useState({
        title: "",
        description: "",
        location: "Kitchen",
        stage: "Practical Completion",
        severity: "minor" as Defect["severity"],
        dueDate: "",
        homeownerNotes: "",
    });

    // Fetch defects from database
    useEffect(() => {
        const fetchDefects = async () => {
            const supabase = createClient();
            const { data, error: fetchError } = await supabase
                .from("defects")
                .select("*")
                .eq("project_id", projectId)
                .order("created_at", { ascending: false });

            if (fetchError) {
                console.error("Error fetching defects:", fetchError);
                setError("Failed to load defects");
            } else {
                const mapped = (data || []).map((d: Record<string, unknown>) => ({
                    id: d.id as string,
                    project_id: d.project_id as string,
                    title: d.title as string,
                    description: (d.description as string) || "",
                    location: (d.location as string) || "Other",
                    stage: (d.stage as string) || "Practical Completion",
                    severity: (d.severity as Defect["severity"]) || "minor",
                    status: (d.status as Defect["status"]) || "open",
                    reported_date: ((d.reported_date as string) || (d.created_at as string) || "").split("T")[0],
                    due_date: d.due_date as string | null,
                    rectified_date: d.rectified_date as string | null,
                    verified_date: d.verified_date as string | null,
                    image_url: d.image_url as string | null,
                    builder_notes: d.builder_notes as string | null,
                    homeowner_notes: d.homeowner_notes as string | null,
                    reminder_count: (d.reminder_count as number) || 0,
                    created_at: d.created_at as string,
                    reported_at: (d.reported_at as string) || (d.created_at as string) || null,
                    escalation_level: (d.escalation_level as string) || "none",
                }));
                setDefects(mapped);
            }
            setLoading(false);
        };
        fetchDefects();
    }, [projectId]);

    // Check free tier limits
    useEffect(() => {
        const checkTier = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from("profiles")
                .select("subscription_tier, is_admin, trial_ends_at")
                .eq("id", user.id)
                .single();

            const tier = profile?.subscription_tier || "free";
            const isAdmin = profile?.is_admin === true;
            const trialActive = tier === "trial" && profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date();
            const hasPro = tier === "guardian_pro" || isAdmin || trialActive;

            if (!hasPro) {
                setTierLimited(true);
            }
        };
        checkTier();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDefect.title.trim()) return;

        // Enforce free tier limit
        if (tierLimited && defects.length >= FREE_DEFECT_LIMIT) {
            setError(`Free plan allows ${FREE_DEFECT_LIMIT} defect reports. Upgrade to Guardian Pro for unlimited.`);
            return;
        }

        setSaving(true);
        setError("");

        const supabase = createClient();
        const { data, error: insertError } = await supabase
            .from("defects")
            .insert({
                project_id: projectId,
                title: newDefect.title.trim(),
                description: newDefect.description.trim(),
                location: newDefect.location,
                stage: newDefect.stage,
                severity: newDefect.severity,
                status: "open",
                reported_date: new Date().toISOString().split("T")[0],
                due_date: newDefect.dueDate || null,
                homeowner_notes: newDefect.homeownerNotes.trim() || null,
                reminder_count: 0,
            })
            .select()
            .single();

        if (insertError) {
            // Server-side trigger (schema_v42) surfaces as FREE_TIER_DEFECT_LIMIT
            // for free users who bypassed the client-side guard.
            if (insertError.message?.includes("FREE_TIER_DEFECT_LIMIT")) {
                setError(`Free plan allows ${FREE_DEFECT_LIMIT} defect reports. Upgrade to Guardian Pro for unlimited.`);
            } else {
                setError(`Failed to save: ${insertError.message}`);
            }
        } else if (data) {
            setDefects([{
                ...data,
                reported_date: (data.reported_date || data.created_at || "").split("T")[0],
                reminder_count: data.reminder_count || 0,
            }, ...defects]);
            setShowForm(false);
            setNewDefect({ title: "", description: "", location: "Kitchen", stage: "Practical Completion", severity: "minor", dueDate: "", homeownerNotes: "" });
            onDataChanged?.();
        }
        setSaving(false);
    };

    const updateStatus = async (id: string, newStatus: Defect["status"]) => {
        // Validate transition using business rules from calculations.ts
        const defect = defects.find(d => d.id === id);
        if (!defect) return;

        if (!isValidStatusTransition(defect.status as UtilDefect["status"], newStatus as UtilDefect["status"])) {
            setError(`Cannot transition from "${defect.status}" to "${newStatus}".`);
            return;
        }

        const supabase = createClient();
        const updates: Record<string, unknown> = { status: newStatus };

        if (newStatus === "rectified") updates.rectified_date = new Date().toISOString().split("T")[0];
        if (newStatus === "verified") updates.verified_date = new Date().toISOString().split("T")[0];

        const { error: updateError } = await supabase
            .from("defects")
            .update(updates)
            .eq("id", id);

        if (updateError) {
            setError(`Failed to update status: ${updateError.message}`);
            return;
        }

        setDefects(defects.map(d =>
            d.id === id ? { ...d, ...updates } as Defect : d
        ));
        onDataChanged?.();
    };

    const sendReminder = async (id: string) => {
        const supabase = createClient();
        const defect = defects.find(d => d.id === id);
        if (!defect) return;

        const newCount = defect.reminder_count + 1;
        const { error } = await supabase.from("defects").update({ reminder_count: newCount }).eq("id", id);
        if (error) { toast("Failed to update reminder count.", "error"); return; }
        setDefects(defects.map(d =>
            d.id === id ? { ...d, reminder_count: newCount } : d
        ));

        // Open mailto with defect details
        const email = builderEmail || "";
        const subject = encodeURIComponent(`Defect Reminder #${newCount}: ${defect.title}`);
        const body = encodeURIComponent(
            `Hi,\n\nThis is reminder #${newCount} regarding the following defect:\n\n` +
            `Title: ${defect.title}\n` +
            `Severity: ${defect.severity.toUpperCase()}\n` +
            `Location: ${defect.location}\n` +
            `Stage: ${defect.stage}\n` +
            `Status: ${defect.status}\n` +
            `Reported: ${defect.reported_date}\n` +
            (defect.due_date ? `Due: ${defect.due_date}\n` : "") +
            `\nDescription: ${defect.description}\n` +
            `\nPlease address this defect as soon as possible.\n\nRegards`
        );
        window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_self");
    };

    const handlePhotoClick = (defectId: string) => {
        activeDefectRef.current = defectId;
        fileInputRef.current?.click();
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const defectId = activeDefectRef.current;
        if (!file || !defectId) return;

        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError("Image must be under 10MB");
            return;
        }

        setUploadingPhotoId(defectId);
        setError("");

        try {
            const supabase = createClient();
            const timestamp = Date.now();
            const ext = file.name.split(".").pop() || "jpg";
            const filePath = `${projectId}/defects/${defectId}_${timestamp}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from("evidence")
                .upload(filePath, file);

            if (uploadError) {
                setError(`Upload failed: ${uploadError.message}`);
                setUploadingPhotoId(null);
                return;
            }

            const { data: urlData } = supabase.storage
                .from("evidence")
                .getPublicUrl(filePath);

            const { error: updateErr } = await supabase
                .from("defects")
                .update({ image_url: urlData.publicUrl })
                .eq("id", defectId);

            if (updateErr) {
                // Rollback: remove the uploaded blob so we don't leak storage
                // on a failed metadata write, then surface the error.
                await supabase.storage.from("evidence").remove([filePath]);
                setError(`Photo upload saved but could not be linked to defect: ${updateErr.message}`);
                setUploadingPhotoId(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
            }

            setDefects(defects.map(d =>
                d.id === defectId ? { ...d, image_url: urlData.publicUrl } : d
            ));
        } catch {
            setError("Photo upload failed. Please try again.");
        }

        setUploadingPhotoId(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const deleteDefect = async (id: string) => {
        if (!confirm("Delete this defect? This cannot be undone.")) return;

        const supabase = createClient();
        const defect = defects.find(d => d.id === id);

        if (defect?.image_url) {
            try {
                const url = new URL(defect.image_url);
                const pathMatch = url.pathname.match(/\/object\/(?:public|sign)\/evidence\/(.+)/);
                if (pathMatch?.[1]) {
                    await supabase.storage.from("evidence").remove([decodeURIComponent(pathMatch[1])]);
                } else {
                    const urlParts = defect.image_url.split("/evidence/");
                    if (urlParts[1]) {
                        await supabase.storage.from("evidence").remove([urlParts[1]]);
                    }
                }
            } catch {
                console.warn("Could not parse storage URL for cleanup:", defect.image_url);
            }
        }

        const { error: delErr } = await supabase.from("defects").delete().eq("id", id);
        if (delErr) { toast("Failed to delete defect.", "error"); return; }
        setDefects(defects.filter(d => d.id !== id));
        onDataChanged?.();
    };

    const generateExportList = () => {
        const openDefects = defects.filter(d => !["verified", "rectified"].includes(d.status));
        let text = "DEFECT REPORT\n";
        text += "========================================\n\n";
        text += `Date: ${new Date().toLocaleDateString("en-AU")}\n`;
        text += `Total Open Defects: ${openDefects.length}\n\n`;

        openDefects.forEach((d, i) => {
            const severity = SEVERITY_CONFIG[d.severity];
            text += `${i + 1}. ${d.title} [${severity.label.toUpperCase()}]\n`;
            text += `   Location: ${d.location}\n`;
            text += `   ${d.description}\n`;
            if (d.due_date) text += `   Due: ${new Date(d.due_date).toLocaleDateString("en-AU")}\n`;
            text += `   Status: ${STATUS_CONFIG[d.status].label}\n\n`;
        });

        text += "========================================\n";
        text += "Please address these defects as per the contract.\n";
        return text;
    };

    const copyList = async () => {
        await navigator.clipboard.writeText(generateExportList());
        toast("Defect list copied to clipboard!", "success");
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
    const overdueCount = defects.filter(d => d.due_date && new Date(d.due_date) < new Date() && !["verified", "rectified"].includes(d.status)).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Hidden file input for photo uploads */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoUpload}
            />

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Defect &amp; Snag List</h2>
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

            {/* Error */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                    {error.includes("Upgrade") && (
                        <Link href="/guardian/pricing" className="ml-2 font-semibold underline">Upgrade →</Link>
                    )}
                    <button onClick={() => setError("")} className="ml-2 text-red-500 hover:underline">dismiss</button>
                </div>
            )}

            {/* Share Actions */}
            {defects.length > 0 && (
                <div className="flex gap-3">
                    <button onClick={copyList} className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">
                        Copy List
                    </button>
                    <button onClick={emailList} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200">
                        Email to Builder
                    </button>
                </div>
            )}

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
                            <div className="mt-2">
                                <AIDefectAssist
                                    currentDescription={newDefect.description}
                                    stage={newDefect.stage}
                                    onApply={(analysis: DefectAnalysis) => {
                                        setNewDefect(prev => ({
                                            ...prev,
                                            description: analysis.improvedDescription || prev.description,
                                            severity: analysis.severity || prev.severity,
                                            location: analysis.location ? (LOCATIONS.includes(analysis.location) ? analysis.location : prev.location) : prev.location,
                                        }));
                                    }}
                                />
                            </div>
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
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Your Notes</label>
                            <input
                                type="text"
                                value={newDefect.homeownerNotes}
                                onChange={(e) => setNewDefect({ ...newDefect, homeownerNotes: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg"
                                placeholder="Any additional notes..."
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Report Defect"}
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
                        <p className="text-muted-foreground">
                            {defects.length === 0 ? "No defects reported yet. Report your first defect above." : "No defects match your filters."}
                        </p>
                    </div>
                ) : (
                    filteredDefects.map((defect) => {
                        const severity = SEVERITY_CONFIG[defect.severity];
                        const status = STATUS_CONFIG[defect.status];
                        const isOverdue = defect.due_date && new Date(defect.due_date) < new Date() && !["verified", "rectified"].includes(defect.status);

                        return (
                            <div
                                key={defect.id}
                                className={`p-5 rounded-xl border-2 ${severity.bgLight} ${severity.border} ${isOverdue ? "ring-2 ring-red-500" : ""}`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-lg truncate">{defect.title}</h3>
                                            {isOverdue && (
                                                <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded shrink-0">
                                                    OVERDUE
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600">{defect.description}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 ml-3 shrink-0">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${severity.color} text-white`}>
                                            {severity.label}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
                                            {status.label}
                                        </span>
                                        <DefectAgingBadge
                                            reportedAt={defect.reported_at || defect.created_at}
                                            status={defect.status}
                                            escalationLevel={defect.escalation_level}
                                        />
                                    </div>
                                </div>

                                {/* Photo */}
                                {defect.image_url && (
                                    <div className="mb-3">
                                        <img
                                            src={defect.image_url}
                                            alt={`Defect: ${defect.title}`}
                                            className="w-32 h-32 object-cover rounded-lg border border-border"
                                        />
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">
                                    <span>{defect.location}</span>
                                    <span>{defect.stage}</span>
                                    <span>Reported: {defect.reported_date ? new Date(defect.reported_date).toLocaleDateString("en-AU") : "N/A"}</span>
                                    {defect.due_date && (
                                        <span>Due: {new Date(defect.due_date).toLocaleDateString("en-AU")}</span>
                                    )}
                                    {defect.reminder_count > 0 && (
                                        <span className="text-orange-600">{defect.reminder_count} reminder{defect.reminder_count !== 1 ? "s" : ""}</span>
                                    )}
                                </div>

                                {(defect.builder_notes || defect.homeowner_notes) && (
                                    <div className="mb-4 p-3 bg-white/50 rounded-lg text-sm">
                                        {defect.builder_notes && (
                                            <p><span className="font-medium">Builder:</span> {defect.builder_notes}</p>
                                        )}
                                        {defect.homeowner_notes && (
                                            <p><span className="font-medium">Notes:</span> {defect.homeowner_notes}</p>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex flex-wrap gap-2">
                                    {defect.status === "open" && (
                                        <>
                                            <button
                                                onClick={() => updateStatus(defect.id, "reported")}
                                                className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded text-sm"
                                            >
                                                Mark Reported
                                            </button>
                                            <button
                                                onClick={() => updateStatus(defect.id, "disputed")}
                                                className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm"
                                            >
                                                Dispute
                                            </button>
                                        </>
                                    )}
                                    {defect.status === "reported" && (
                                        <>
                                            <button
                                                onClick={() => updateStatus(defect.id, "in_progress")}
                                                className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-sm"
                                            >
                                                Mark In Progress
                                            </button>
                                            <button
                                                onClick={() => sendReminder(defect.id)}
                                                className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded text-sm"
                                            >
                                                📧 Send Reminder
                                            </button>
                                            <button
                                                onClick={() => updateStatus(defect.id, "disputed")}
                                                className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm"
                                            >
                                                Dispute
                                            </button>
                                        </>
                                    )}
                                    {defect.status === "in_progress" && (
                                        <>
                                            <button
                                                onClick={() => updateStatus(defect.id, "rectified")}
                                                className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded text-sm"
                                            >
                                                Mark Rectified
                                            </button>
                                            <button
                                                onClick={() => sendReminder(defect.id)}
                                                className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded text-sm"
                                            >
                                                📧 Send Reminder
                                            </button>
                                            <button
                                                onClick={() => updateStatus(defect.id, "disputed")}
                                                className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm"
                                            >
                                                Dispute
                                            </button>
                                        </>
                                    )}
                                    {defect.status === "rectified" && (
                                        <>
                                            <button
                                                onClick={() => updateStatus(defect.id, "verified")}
                                                className="px-3 py-1.5 bg-green-100 text-green-700 rounded text-sm"
                                            >
                                                ✓ Verify Fixed
                                            </button>
                                            <button
                                                onClick={() => updateStatus(defect.id, "disputed")}
                                                className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm"
                                            >
                                                Not Fixed
                                            </button>
                                            <button
                                                onClick={() => updateStatus(defect.id, "open")}
                                                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm"
                                            >
                                                ↩ Reopen
                                            </button>
                                        </>
                                    )}
                                    {defect.status === "disputed" && (
                                        <>
                                            <button
                                                onClick={() => updateStatus(defect.id, "open")}
                                                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm"
                                            >
                                                ↩ Reopen
                                            </button>
                                            <button
                                                onClick={() => updateStatus(defect.id, "reported")}
                                                className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded text-sm"
                                            >
                                                Re-report
                                            </button>
                                            <button
                                                onClick={() => sendReminder(defect.id)}
                                                className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded text-sm"
                                            >
                                                📧 Send Reminder
                                            </button>
                                        </>
                                    )}
                                    {!["verified"].includes(defect.status) && (
                                        <button
                                            onClick={() => handlePhotoClick(defect.id)}
                                            disabled={uploadingPhotoId === defect.id}
                                            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
                                        >
                                            {uploadingPhotoId === defect.id ? "Uploading..." : defect.image_url ? "Update Photo" : "Add Photo"}
                                        </button>
                                    )}
                                    {defect.status !== "verified" && (
                                        <button
                                            onClick={() => deleteDefect(defect.id)}
                                            className="px-3 py-1.5 text-red-400 hover:text-red-600 rounded text-sm ml-auto"
                                        >
                                            Delete
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
                <p className="font-medium mb-1">Defect Tracking Tips</p>
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
