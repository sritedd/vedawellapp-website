"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/utils/format";
import { useToast } from "@/components/guardian/Toast";
import ShouldIPay from "@/components/guardian/ShouldIPay";
import type { Project } from "@/types/guardian";
import {
    getInsuranceAlerts,
    getStateInsuranceConfig,
    getCoolingOffStatus,
    getWarrantyAlerts,
    getLicenseVerificationUrl,
    getLicenseVerificationLabel,
    type InsuranceAlert,
    type CoolingOffStatus,
    type WarrantyAlert,
} from "@/lib/guardian/calculations";

// Stage tip with optional action target
interface StageTip {
    text: string;
    action?: { tab: string; label: string }; // navigate to tab when acted on
}

// Stage-specific guidance: which tabs matter and what to focus on
const STAGE_GUIDANCE: Record<string, {
    focus: string;
    description: string;
    relevantTabs: { id: string; label: string; reason: string }[];
    tips: StageTip[];
}> = {
    site_start: {
        focus: "Site preparation and approvals",
        description: "Your build is getting underway. Focus on ensuring site prep is done correctly and all approvals are in order.",
        relevantTabs: [
            { id: "inspections", label: "Inspections", reason: "Book site set-out inspection" },
            { id: "certificates", label: "Certificates", reason: "Check building approval status" },
            { id: "photos", label: "Photos", reason: "Document site before work begins" },
            { id: "payments", label: "Payments", reason: "Base stage payment may be due" },
        ],
        tips: [
            { text: "Take dated photos of the empty site before any work begins", action: { tab: "photos", label: "Open Photos" } },
            { text: "Confirm soil report matches what was quoted in the contract", action: { tab: "documents", label: "Check Documents" } },
            { text: "Verify site set-out matches approved plans" },
        ],
    },
    slab: {
        focus: "Foundation and footings",
        description: "Critical foundation stage. Never let concrete be poured before the footing inspection passes.",
        relevantTabs: [
            { id: "inspections", label: "Inspections", reason: "Footing inspection BEFORE pour" },
            { id: "certificates", label: "Certificates", reason: "Plumbing rough-in certificate" },
            { id: "photos", label: "Photos", reason: "Photo reinforcement before pour" },
            { id: "defects", label: "Defects", reason: "Log any footing issues" },
        ],
        tips: [
            { text: "Be on site when concrete is poured if possible", action: { tab: "visits", label: "Log Visit" } },
            { text: "Verify reinforcement steel matches engineering specs", action: { tab: "photos", label: "Take Photo" } },
            { text: "Check plumbing rough-in is complete and tested", action: { tab: "inspections", label: "Check Inspections" } },
        ],
    },
    frame: {
        focus: "Framing and structure",
        description: "Wall frames and roof trusses going up. Check for straight, undamaged timber and correct openings.",
        relevantTabs: [
            { id: "inspections", label: "Inspections", reason: "Frame inspection required" },
            { id: "certificates", label: "Certificates", reason: "Frame + truss certificates" },
            { id: "defects", label: "Defects", reason: "Log framing defects now" },
            { id: "photos", label: "Photos", reason: "Document frame before cladding" },
            { id: "payments", label: "Payments", reason: "Frame stage payment" },
        ],
        tips: [
            { text: "Check window and door openings match your contract plans", action: { tab: "photos", label: "Take Photo" } },
            { text: "Look for twisted or damaged timber in frames", action: { tab: "defects", label: "Log Defect" } },
            { text: "Ensure cladding doesn't start before frame inspection passes", action: { tab: "inspections", label: "Check Inspections" } },
        ],
    },
    lockup: {
        focus: "Lockup \u2014 building is enclosed",
        description: "Roof complete, walls clad, windows and doors installed. The building should be lockable and weatherproof.",
        relevantTabs: [
            { id: "inspections", label: "Inspections", reason: "Pre-cladding & waterproofing" },
            { id: "certificates", label: "Certificates", reason: "EICC electrical rough-in" },
            { id: "payments", label: "Payments", reason: "Lockup stage payment (35%)" },
            { id: "defects", label: "Defects", reason: "Check seals and gaps" },
        ],
        tips: [
            { text: "Check all windows and doors seal properly \u2014 no gaps", action: { tab: "defects", label: "Log Defect" } },
            { text: "Verify termite barrier/protection is installed", action: { tab: "certificates", label: "Check Certs" } },
            { text: "Don't pay lockup without EICC certificate", action: { tab: "certificates", label: "Check Certs" } },
        ],
    },
    pre_plasterboard: {
        focus: "CRITICAL \u2014 Last chance to see inside walls",
        description: "This is the most important inspection stage. Once plasterboard goes up, you can never see inside the walls again.",
        relevantTabs: [
            { id: "inspections", label: "Inspections", reason: "Pre-plasterboard inspection" },
            { id: "photos", label: "Photos", reason: "MUST photograph inside walls" },
            { id: "certificates", label: "Certificates", reason: "EICC final + plumbing" },
            { id: "defects", label: "Defects", reason: "Log everything you find" },
            { id: "checklists", label: "Checklists", reason: "Use pre-plaster checklist" },
        ],
        tips: [
            { text: "Check ceiling insulation batts are installed (R4.0 minimum)", action: { tab: "photos", label: "Take Photo" } },
            { text: "Verify wall insulation if contracted", action: { tab: "photos", label: "Take Photo" } },
            { text: "Check waterproofing membrane in wet areas", action: { tab: "certificates", label: "Check Certs" } },
            { text: "Look for fire collars at penetrations", action: { tab: "defects", label: "Log Defect" } },
            { text: "Take photos of EVERYTHING before walls close up", action: { tab: "photos", label: "Open Photos" } },
        ],
    },
    fixing: {
        focus: "Internal fit-out",
        description: "Plasterboard, tiling, cabinetry, and second-fix electrical/plumbing happening now.",
        relevantTabs: [
            { id: "inspections", label: "Inspections", reason: "Waterproofing before tiling" },
            { id: "certificates", label: "Certificates", reason: "Waterproofing warranty cert" },
            { id: "defects", label: "Defects", reason: "Check quality vs contract specs" },
            { id: "payments", label: "Payments", reason: "Fixing stage payment (25%)" },
            { id: "variations", label: "Variations", reason: "Spec changes during fit-out" },
        ],
        tips: [
            { text: "Verify tiles are installed AFTER waterproofing is certified", action: { tab: "certificates", label: "Check Certs" } },
            { text: "Check cabinet quality matches contract specifications", action: { tab: "photos", label: "Take Photo" } },
            { text: "Compare tap, fixture and appliance brands to what was quoted", action: { tab: "defects", label: "Log Defect" } },
        ],
    },
    practical_completion: {
        focus: "Final inspection and handover",
        description: "Build should be complete and ready for your final walk-through before handover.",
        relevantTabs: [
            { id: "inspections", label: "Inspections", reason: "Final + OC inspection" },
            { id: "certificates", label: "Certificates", reason: "OC, electrical, plumbing, smoke alarm" },
            { id: "defects", label: "Defects", reason: "Snag list from final walk-through" },
            { id: "payments", label: "Payments", reason: "Final payment \u2014 only after OC!" },
            { id: "documents", label: "Documents", reason: "Collect all handover documents" },
        ],
        tips: [
            { text: "NEVER pay the final amount before you have the Occupation Certificate", action: { tab: "certificates", label: "Check Certs" } },
            { text: "Do a thorough walk-through and log every defect before signing off", action: { tab: "prehandover", label: "Pre-Handover Checklist" } },
            { text: "Collect all warranties, manuals, certificates at handover", action: { tab: "documents", label: "Documents" } },
            { text: "Set the handover date \u2014 this starts your warranty period", action: { tab: "settings", label: "Settings" } },
        ],
    },
};

// Fallback for stages not in the guidance map
const DEFAULT_GUIDANCE = {
    focus: "Track your build progress",
    description: "Keep monitoring your construction project. Log defects, track payments, and document everything.",
    relevantTabs: [
        { id: "defects", label: "Defects", reason: "Log any issues found" },
        { id: "payments", label: "Payments", reason: "Track payment milestones" },
        { id: "photos", label: "Photos", reason: "Document progress" },
        { id: "communication", label: "Comms Log", reason: "Record builder communication" },
    ],
    tips: [
        { text: "Take progress photos at every site visit", action: { tab: "photos", label: "Open Photos" } },
        { text: "Keep all communication with the builder in writing", action: { tab: "communication", label: "Comms Log" } },
        { text: "Never pay ahead of the schedule in your contract" },
    ],
};

/* ------------------------------------------------------------------ */
/*  Consolidated Alerts — show #1 priority + expandable rest           */
/* ------------------------------------------------------------------ */

function ConsolidatedAlerts({
    coolingOff,
    insuranceAlerts,
    warrantyAlerts,
    insuranceConfig,
}: {
    coolingOff: CoolingOffStatus | null;
    insuranceAlerts: InsuranceAlert[];
    warrantyAlerts: WarrantyAlert[];
    insuranceConfig: ReturnType<typeof getStateInsuranceConfig>;
}) {
    const [expanded, setExpanded] = useState(false);

    // Build a unified, priority-sorted alerts list
    const allAlerts = useMemo(() => {
        const alerts: { key: string; level: string; title: string; message: string; type: string }[] = [];

        if (coolingOff?.isActive) {
            alerts.push({
                key: "cooling-off",
                level: "warning",
                title: `Cooling-Off Active \u2014 ${coolingOff.daysRemaining} day${coolingOff.daysRemaining !== 1 ? "s" : ""} left`,
                message: `Cancel without penalty until ${coolingOff.endDate.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}. ${coolingOff.stateNote}.`,
                type: "cooling_off",
            });
        }
        for (const alert of insuranceAlerts) {
            alerts.push({ key: `ins-${alerts.length}`, level: alert.level, title: alert.title, message: alert.message, type: "insurance" });
        }
        for (const alert of warrantyAlerts) {
            alerts.push({ key: `war-${alerts.length}`, level: alert.level, title: alert.title, message: alert.message, type: "warranty" });
        }

        // Sort: critical first, then warning, then info
        const priority: Record<string, number> = { critical: 0, warning: 1, info: 2 };
        alerts.sort((a, b) => (priority[a.level] ?? 2) - (priority[b.level] ?? 2));
        return alerts;
    }, [coolingOff, insuranceAlerts, warrantyAlerts]);

    if (allAlerts.length === 0) return null;

    const topAlert = allAlerts[0];
    const remainingAlerts = allAlerts.slice(1);

    const alertStyle = (level: string) =>
        level === "critical"
            ? "bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300"
            : level === "warning"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
                : "bg-blue-500/10 border-blue-500/30 text-blue-800 dark:text-blue-300";

    const alertIcon = (level: string) =>
        level === "critical"
            ? <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            : level === "warning"
                ? <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                : <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>;

    return (
        <div className="space-y-2">
            {/* Top priority alert — always visible */}
            <div className={`p-4 rounded-lg border flex items-start gap-3 ${alertStyle(topAlert.level)}`}>
                {alertIcon(topAlert.level)}
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm">{topAlert.title}</h4>
                    <p className="text-sm opacity-80 mt-0.5">{topAlert.message}</p>
                    {topAlert.type === "insurance" && insuranceConfig && (
                        <a href={insuranceConfig.verifyUrl} target="_blank" rel="noopener noreferrer"
                            className="mt-1 text-sm text-primary hover:underline inline-block">
                            Check {insuranceConfig.scheme} status &rarr;
                        </a>
                    )}
                </div>
                {remainingAlerts.length > 0 && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-xs font-medium px-2 py-1 rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 whitespace-nowrap transition-colors"
                    >
                        {expanded ? "Hide" : `+${remainingAlerts.length} more`}
                    </button>
                )}
            </div>

            {/* Remaining alerts — collapsed by default */}
            {expanded && remainingAlerts.map((alert) => (
                <div key={alert.key} className={`p-3 rounded-lg border flex items-start gap-3 ${alertStyle(alert.level)}`}>
                    {alertIcon(alert.level)}
                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{alert.title}</h4>
                        <p className="text-xs opacity-80 mt-0.5">{alert.message}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

interface SmartDashboardProps {
    project: Project;
    currentStage: string;
    stageNames: string[];
    onNavigateTab: (tabId: string) => void;
}

interface StageRow {
    id: string;
    name: string;
    status: string;
}

interface ActivityItem {
    id: string;
    type: "defect" | "variation" | "inspection" | "payment" | "photo" | "communication";
    title: string;
    detail: string;
    date: string;
    icon: string;
}

export default function SmartDashboard({ project, currentStage, stageNames, onNavigateTab }: SmartDashboardProps) {
    const [stages, setStages] = useState<StageRow[]>([]);
    const [openDefects, setOpenDefects] = useState(0);
    const [pendingInspections, setPendingInspections] = useState(0);
    const [pendingCerts, setPendingCerts] = useState(0);
    const [pendingPayments, setPendingPayments] = useState(0);
    const [variationsTotal, setVariationsTotal] = useState(0);
    const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [dodgyWarnings, setDodgyWarnings] = useState<string[]>([]);

    const stateCode = project.state || "NSW";

    // Load stage-specific dodgy builder warnings from workflow JSON
    useEffect(() => {
        async function loadWarnings() {
            try {
                const data = await import("@/data/australian-build-workflows.json");
                const buildCategory = project.build_category || "new_build";
                const workflow = data.workflows?.[buildCategory as keyof typeof data.workflows]?.[stateCode as keyof (typeof data.workflows)[keyof typeof data.workflows]];
                if (workflow && "stages" in workflow) {
                    const stageData = (workflow as { stages: Array<{ id: string; dodgyBuilderWarnings?: string[] }> }).stages.find(
                        (s) => s.id === currentStage
                    );
                    if (stageData?.dodgyBuilderWarnings) {
                        setDodgyWarnings(stageData.dodgyBuilderWarnings);
                    }
                }
            } catch {
                // Non-critical — just skip warnings
            }
        }
        loadWarnings();
    }, [currentStage, stateCode, project.build_category]);

    // Fetch all dashboard data
    useEffect(() => {
        async function fetchData() {
            const supabase = createClient();
            const projectId = project.id;

            // Fetch stages
            const { data: stageData } = await supabase
                .from("stages")
                .select("id, name, status")
                .eq("project_id", projectId)
                .order("created_at", { ascending: true });
            if (stageData) setStages(stageData);

            // Count open defects
            const { count: defectCount } = await supabase
                .from("defects")
                .select("id", { count: "exact", head: true })
                .eq("project_id", projectId)
                .not("status", "in", "(verified,rectified)");
            setOpenDefects(defectCount || 0);

            // Count pending inspections (not_booked or booked)
            const { count: inspCount } = await supabase
                .from("inspections")
                .select("id", { count: "exact", head: true })
                .eq("project_id", projectId)
                .in("result", ["not_booked", "booked"]);
            setPendingInspections(inspCount || 0);

            // Count pending certificates
            const { count: certCount } = await supabase
                .from("certifications")
                .select("id", { count: "exact", head: true })
                .eq("project_id", projectId)
                .eq("status", "pending");
            setPendingCerts(certCount || 0);

            // Count pending/due payments
            const { count: payCount } = await supabase
                .from("payments")
                .select("id", { count: "exact", head: true })
                .eq("project_id", projectId)
                .in("status", ["pending", "due"]);
            setPendingPayments(payCount || 0);

            // Variations total
            const { data: varData } = await supabase
                .from("variations")
                .select("additional_cost")
                .eq("project_id", projectId)
                .eq("status", "approved");
            if (varData) {
                setVariationsTotal(varData.reduce((sum: number, v: { additional_cost: number | null }) => sum + (v.additional_cost || 0), 0));
            }

            // Recent activity — last 5 items across tables
            const activities: ActivityItem[] = [];

            const { data: recentDefects } = await supabase
                .from("defects")
                .select("id, title, status, created_at")
                .eq("project_id", projectId)
                .order("created_at", { ascending: false })
                .limit(3);
            if (recentDefects) {
                for (const d of recentDefects) {
                    activities.push({
                        id: d.id,
                        type: "defect",
                        title: d.title,
                        detail: `Status: ${d.status}`,
                        date: d.created_at,
                        icon: "🛠️",
                    });
                }
            }

            const { data: recentVariations } = await supabase
                .from("variations")
                .select("id, title, status, created_at")
                .eq("project_id", projectId)
                .order("created_at", { ascending: false })
                .limit(3);
            if (recentVariations) {
                for (const v of recentVariations) {
                    activities.push({
                        id: v.id,
                        type: "variation",
                        title: v.title,
                        detail: `Status: ${v.status}`,
                        date: v.created_at,
                        icon: "💰",
                    });
                }
            }

            const { data: recentComms } = await supabase
                .from("communication_log")
                .select("id, subject, type, created_at")
                .eq("project_id", projectId)
                .order("created_at", { ascending: false })
                .limit(3);
            if (recentComms) {
                for (const c of recentComms) {
                    activities.push({
                        id: c.id,
                        type: "communication",
                        title: c.subject || "Communication",
                        detail: c.type || "Note",
                        date: c.created_at,
                        icon: "💬",
                    });
                }
            }

            // Sort by date descending, take top 5
            activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setRecentActivity(activities.slice(0, 5));

            setLoading(false);
        }

        fetchData();
    }, [project.id]);

    // Lookup stage guidance
    const normalizedStage = currentStage.toLowerCase().replace(/[\s/]+/g, "_");
    const guidance = STAGE_GUIDANCE[normalizedStage] || DEFAULT_GUIDANCE;

    // Insurance, cooling-off, warranty alerts (from ProjectOverview)
    const contractValue = project.contract_value || 0;
    const insuranceAlerts: InsuranceAlert[] = getInsuranceAlerts(
        contractValue, stateCode, project.hbcf_policy_number, project.insurance_expiry_date
    );
    const insuranceConfig = getStateInsuranceConfig(stateCode);
    const coolingOff: CoolingOffStatus | null = project.contract_signed_date
        ? getCoolingOffStatus(project.contract_signed_date, stateCode)
        : null;
    const warrantyAlerts: WarrantyAlert[] = project.handover_date
        ? getWarrantyAlerts(project.handover_date, stateCode)
        : [];
    const licenseUrl = getLicenseVerificationUrl(stateCode);
    const licenseLabel = getLicenseVerificationLabel(stateCode);

    // Dismissed tips state (persisted per project+stage in localStorage)
    const { toast } = useToast();
    const tipsStorageKey = `tips-dismissed-${project.id}-${normalizedStage}`;
    const [dismissedTips, setDismissedTips] = useState<Record<number, boolean>>({});

    useEffect(() => {
        try {
            const raw = localStorage.getItem(tipsStorageKey);
            if (raw) setDismissedTips(JSON.parse(raw));
            else setDismissedTips({});
        } catch { /* ignore */ }
    }, [tipsStorageKey]);

    const dismissTip = useCallback((idx: number) => {
        setDismissedTips((prev) => {
            const next = { ...prev, [idx]: true };
            try { localStorage.setItem(tipsStorageKey, JSON.stringify(next)); } catch { /* ignore */ }
            return next;
        });
        toast("Tip completed", "success");
    }, [tipsStorageKey, toast]);

    // Completion stats
    const completedStages = stages.filter(s => s.status === "completed" || s.status === "verified").length;
    const totalStages = stages.length;
    const progressPercent = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

    // Current stage display name
    const currentStageName = stages.find(
        s => s.name.toLowerCase().replace(/[\s/]+/g, "_") === normalizedStage
    )?.name || currentStage;

    // Celebration messages based on project state
    const celebrations = useMemo(() => {
        const msgs: { text: string; icon: string }[] = [];
        if (!loading) {
            if (openDefects === 0 && recentActivity.some(a => a.type === "defect")) {
                msgs.push({ text: "All defects resolved! Clean sheet.", icon: "\u{1F389}" });
            }
            if (progressPercent === 100 && totalStages > 0) {
                msgs.push({ text: "All stages complete! Your build is done.", icon: "\u{1F3C6}" });
            } else if (progressPercent >= 75 && totalStages > 0) {
                msgs.push({ text: `${progressPercent}% complete \u2014 almost there!`, icon: "\u{1F4AA}" });
            } else if (progressPercent >= 50 && totalStages > 0) {
                msgs.push({ text: "Halfway through your build!", icon: "\u{1F680}" });
            }
        }
        return msgs;
    }, [loading, openDefects, recentActivity, progressPercent, totalStages]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-32 bg-muted/30 rounded-xl" />
                    <div className="grid md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted/30 rounded-xl" />)}
                    </div>
                    <div className="h-48 bg-muted/30 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Current Stage Hero */}
            <div className="p-6 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-medium text-primary uppercase tracking-wider">Current Stage</span>
                            {normalizedStage === "pre_plasterboard" && (
                                <span className="px-2 py-0.5 bg-red-500/10 text-red-600 text-xs rounded font-bold animate-pulse">
                                    CRITICAL
                                </span>
                            )}
                        </div>
                        <h2 className="text-2xl font-bold mb-1">{currentStageName}</h2>
                        <p className="text-muted-foreground">{guidance.focus}</p>
                        <p className="text-sm text-muted-foreground mt-2">{guidance.description}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-primary">{progressPercent}%</div>
                        <div className="text-sm text-muted-foreground">Build Progress</div>
                        <div className="mt-2 w-32 bg-muted rounded-full h-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {completedStages}/{totalStages} stages complete
                        </div>
                    </div>
                </div>
            </div>

            {/* Celebration Moments */}
            {celebrations.length > 0 && (
                <div className="space-y-2">
                    {celebrations.map((c, i) => (
                        <div key={i} className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 flex items-center gap-3">
                            <span className="text-2xl">{c.icon}</span>
                            <span className="font-semibold text-green-800 dark:text-green-300">{c.text}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Consolidated Alerts — show top priority + expandable rest */}
            <ConsolidatedAlerts
                coolingOff={coolingOff}
                insuranceAlerts={insuranceAlerts}
                warrantyAlerts={warrantyAlerts}
                insuranceConfig={insuranceConfig}
            />

            {/* Should I Pay? Mega-Button */}
            <ShouldIPay
                projectId={project.id}
                contractValue={contractValue}
                currentStage={currentStage}
                onNavigateTab={onNavigateTab}
            />

            {/* Action Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                    onClick={() => onNavigateTab("defects")}
                    className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary transition-colors"
                >
                    <div className="text-2xl mb-1">{openDefects > 0 ? '\u{1F6A8}' : '\u2705'}</div>
                    <div className={`text-2xl font-bold ${openDefects > 0 ? "text-red-500" : "text-green-500"}`}>
                        {openDefects}
                    </div>
                    <div className="text-sm text-muted-foreground">Open Defects</div>
                </button>
                <button
                    onClick={() => onNavigateTab("inspections")}
                    className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary transition-colors"
                >
                    <div className="text-2xl mb-1">{pendingInspections > 0 ? '\u{1F50D}' : '\u2705'}</div>
                    <div className={`text-2xl font-bold ${pendingInspections > 0 ? "text-amber-500" : "text-green-500"}`}>
                        {pendingInspections}
                    </div>
                    <div className="text-sm text-muted-foreground">Pending Inspections</div>
                </button>
                <button
                    onClick={() => onNavigateTab("certificates")}
                    className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary transition-colors"
                >
                    <div className="text-2xl mb-1">{pendingCerts > 0 ? '\u{1F4DC}' : '\u2705'}</div>
                    <div className={`text-2xl font-bold ${pendingCerts > 0 ? "text-amber-500" : "text-green-500"}`}>
                        {pendingCerts}
                    </div>
                    <div className="text-sm text-muted-foreground">Missing Certificates</div>
                </button>
                <button
                    onClick={() => onNavigateTab("payments")}
                    className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary transition-colors"
                >
                    <div className="text-2xl mb-1">{pendingPayments > 0 ? '\u{1F4B0}' : '\u2705'}</div>
                    <div className={`text-2xl font-bold ${pendingPayments > 0 ? "text-primary" : "text-green-500"}`}>
                        {pendingPayments}
                    </div>
                    <div className="text-sm text-muted-foreground">Payments Due</div>
                </button>
            </div>

            {/* Financial Summary */}
            <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="text-muted text-sm mb-1">Contract Value</div>
                    <div className="text-2xl font-bold">{formatMoney(contractValue)}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="text-muted text-sm mb-1">Approved Variations</div>
                    <div className={`text-2xl font-bold ${variationsTotal > 0 ? "text-orange-500" : ""}`}>
                        {variationsTotal > 0 ? "+" : ""}{formatMoney(variationsTotal)}
                    </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="text-muted text-sm mb-1">Projected Total</div>
                    <div className="text-2xl font-bold text-primary">
                        {formatMoney(contractValue + variationsTotal)}
                    </div>
                </div>
            </div>

            {/* What To Do Now — Stage-Relevant Actions */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">What To Do Now</h3>
                <div className="grid md:grid-cols-2 gap-3">
                    {guidance.relevantTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onNavigateTab(tab.id)}
                            className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors text-left"
                        >
                            <span className="text-primary font-bold text-lg mt-0.5">&rarr;</span>
                            <div>
                                <div className="font-medium">{tab.label}</div>
                                <div className="text-sm text-muted-foreground">{tab.reason}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Stage Tips — Dismissable Micro-Task Cards */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold">Tips for {currentStageName}</h3>
                    <span className="text-xs text-muted-foreground">
                        {Object.keys(dismissedTips).filter(k => dismissedTips[Number(k)]).length}/{guidance.tips.length} done
                    </span>
                </div>
                <div className="space-y-2">
                    {guidance.tips.map((tip, idx) => {
                        const isDismissed = !!dismissedTips[idx];
                        return (
                            <div
                                key={idx}
                                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                                    isDismissed
                                        ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800/50 opacity-60"
                                        : "bg-muted/30 border-border hover:border-primary/30"
                                }`}
                            >
                                <button
                                    type="button"
                                    onClick={() => dismissTip(idx)}
                                    className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors min-w-[20px] min-h-[20px] ${
                                        isDismissed
                                            ? "bg-green-500 border-green-500 text-white"
                                            : "border-muted-foreground/40 hover:border-primary"
                                    }`}
                                    aria-label={isDismissed ? "Completed" : "Mark as done"}
                                >
                                    {isDismissed && <span className="text-xs">{"\u2713"}</span>}
                                </button>
                                <span className={`text-sm flex-1 ${isDismissed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                    {tip.text}
                                </span>
                                {tip.action && !isDismissed && (
                                    <button
                                        type="button"
                                        onClick={() => onNavigateTab(tip.action!.tab)}
                                        className="flex-shrink-0 px-2.5 py-1 rounded-md text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors whitespace-nowrap min-h-[28px]"
                                    >
                                        {tip.action.label}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Dodgy Builder Warnings */}
            {dodgyWarnings.length > 0 && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                    <h3 className="font-bold mb-3 text-red-700 dark:text-red-400">
                        Watch Out For (Common Builder Issues at This Stage)
                    </h3>
                    <ul className="space-y-2">
                        {dodgyWarnings.map((warning, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground">
                                {warning}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Construction Progress Timeline */}
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-6">Construction Progress</h3>
                    <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                        {stages.length === 0 ? (
                            <p className="text-muted-foreground text-sm pl-10">No stages configured.</p>
                        ) : stages.map((stage, idx) => {
                            const isCompleted = stage.status === "completed" || stage.status === "verified";
                            const isCurrent = stage.name.toLowerCase().replace(/[\s/]+/g, "_") === normalizedStage;
                            return (
                                <div key={stage.id} className="relative flex items-start gap-4 pl-0">
                                    <div
                                        className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-background ${
                                            isCompleted
                                                ? "border-green-500 bg-green-500"
                                                : isCurrent
                                                    ? "border-primary"
                                                    : "border-border"
                                        }`}
                                    >
                                        {isCompleted && <span className="text-white text-xs">{'\u2713'}</span>}
                                        {isCurrent && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                    </div>
                                    <div>
                                        <h4 className={`font-medium ${isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                                            {stage.name}
                                        </h4>
                                        {isCurrent && (
                                            <p className="text-xs text-primary mt-1">Current Stage</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Builder Details + Recent Activity */}
                <div className="space-y-6">
                    {/* Builder Details */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-4">Builder Details</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between py-1.5 border-b border-border/50">
                                <span className="text-muted text-sm">Builder</span>
                                <span className="font-medium">{project.builder_name || "—"}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-border/50">
                                <span className="text-muted text-sm">License #</span>
                                <span className="font-medium font-mono">
                                    {project.builder_license_number || "Not set"}
                                </span>
                            </div>
                            {project.builder_license_number && (
                                <a
                                    href={licenseUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline block text-right"
                                >
                                    {licenseLabel} &rarr;
                                </a>
                            )}
                            <div className="flex justify-between py-1.5 border-b border-border/50">
                                <span className="text-muted text-sm">{insuranceConfig?.label || 'Insurance'}</span>
                                <span className="font-medium font-mono">
                                    {project.hbcf_policy_number || "Not set"}
                                </span>
                            </div>
                            <div className="flex justify-between py-1.5">
                                <span className="text-muted text-sm">Site Address</span>
                                <span className="font-medium text-right max-w-[200px]">
                                    {project.address || "—"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
                        {recentActivity.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No activity yet. Start by logging a defect, uploading photos, or recording a communication.
                            </p>
                        ) : (
                            <div className="space-y-1">
                                {recentActivity.map((item) => {
                                    const tabMap: Record<string, string> = {
                                        defect: "defects",
                                        variation: "variations",
                                        inspection: "inspections",
                                        payment: "payments",
                                        photo: "photos",
                                        communication: "communication",
                                    };
                                    const targetTab = tabMap[item.type] || "overview";
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => onNavigateTab(targetTab)}
                                            className="w-full flex items-start gap-3 py-2.5 px-2 -mx-2 rounded-lg border-b border-border/30 last:border-0 hover:bg-muted/50 transition-colors text-left group"
                                        >
                                            <span className="text-lg">{item.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">{item.title}</div>
                                                <div className="text-xs text-muted-foreground">{item.detail}</div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {new Date(item.date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                                                </span>
                                                <svg className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6" /></svg>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
