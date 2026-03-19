"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeProject } from "@/lib/supabase/useRealtimeProject";
import type { Project, Variation, Defect } from "@/types/guardian";

// Components
import ProjectSettings from "@/components/guardian/ProjectSettings";
import SmartDashboard from "@/components/guardian/SmartDashboard";
import ProjectChecklists from "@/components/guardian/ProjectChecklists";
import ProjectVariations from "@/components/guardian/ProjectVariations";
import ProjectDefects from "@/components/guardian/ProjectDefects";
import DocumentVault from "@/components/guardian/DocumentVault";
import CertificationGate from "@/components/guardian/CertificationGate";
import ReportGenerator from "@/components/guardian/ReportGenerator";
import CommunicationLog from "@/components/guardian/CommunicationLog";
import PaymentSchedule from "@/components/guardian/PaymentSchedule";
import BudgetDashboard from "@/components/guardian/BudgetDashboard";
import WeeklyCheckIn from "@/components/guardian/WeeklyCheckIn";
import MaterialRegistry from "@/components/guardian/MaterialRegistry";
import InspectionTimeline from "@/components/guardian/InspectionTimeline";
import BuilderActionList from "@/components/guardian/BuilderActionList";
import StageGate from "@/components/guardian/StageGate";
import ProgressPhotos from "@/components/guardian/ProgressPhotos";
import SiteVisitLog from "@/components/guardian/SiteVisitLog";
import NotificationCenter from "@/components/guardian/NotificationCenter";
import ExportCenter from "@/components/guardian/ExportCenter";
import StageChecklist from "@/components/guardian/StageChecklist";
import DisputeResolution from "@/components/guardian/DisputeResolution";
import DodgyBuilderAlerts from "@/components/guardian/DodgyBuilderAlerts";
import PreHandoverChecklist from "@/components/guardian/PreHandoverChecklist";
import AccountabilityScore from "@/components/guardian/AccountabilityScore";
import NCC2025Compliance from "@/components/guardian/NCC2025Compliance";
import GuidedOnboarding, { shouldShowOnboarding } from "@/components/guardian/GuidedOnboarding";
import MobilePhotoCapture, { PhotoFAB } from "@/components/guardian/MobilePhotoCapture";
import PushNotificationSetup from "@/components/guardian/PushNotificationSetup";
import CostBenchmarking from "@/components/guardian/CostBenchmarking";
import BuilderRatings from "@/components/guardian/BuilderRatings";
import ContractReviewChecklist from "@/components/guardian/ContractReviewChecklist";
import GuardianChat from "@/components/guardian/GuardianChat";
import AIStageAdvice from "@/components/guardian/AIStageAdvice";
import TimelineBenchmark from "@/components/guardian/TimelineBenchmark";
import TribunalExport from "@/components/guardian/TribunalExport";

/* ------------------------------------------------------------------ */
/*  Navigation Structure — 5 main sections                            */
/* ------------------------------------------------------------------ */

const SECTIONS = [
    { id: "home", label: "Home", defaultTab: "overview" },
    { id: "build", label: "Build", defaultTab: "stagegate" },
    { id: "issues", label: "Issues", defaultTab: "defects" },
    { id: "evidence", label: "Evidence", defaultTab: "photos" },
    { id: "more", label: "More", defaultTab: "more_grid" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const SECTION_SUBTABS: Record<SectionId, { id: string; label: string }[]> = {
    home: [
        { id: "overview", label: "Dashboard" },
        { id: "actions", label: "Pending Actions" },
        { id: "aichat", label: "AI Chat" },
    ],
    build: [
        { id: "stagegate", label: "Stage Gate" },
        { id: "stages", label: "Stages" },
        { id: "inspections", label: "Inspections" },
        { id: "certificates", label: "Certificates" },
        { id: "ncc2025", label: "NCC 2025" },
    ],
    issues: [
        { id: "defects", label: "Defects" },
        { id: "variations", label: "Variations" },
        { id: "redflags", label: "Red Flags" },
        { id: "disputes", label: "Disputes" },
        { id: "prehandover", label: "Pre-Handover" },
    ],
    evidence: [
        { id: "photos", label: "Photos" },
        { id: "documents", label: "Documents" },
        { id: "communication", label: "Comms" },
        { id: "checkins", label: "Check-ins" },
        { id: "visits", label: "Site Visits" },
    ],
    more: [], // "More" uses a card grid, not sub-tabs
};

// Items shown in the "More" card grid
const MORE_ITEMS = [
    { id: "payments", label: "Payments", desc: "Track progress payments", icon: "payments" },
    { id: "budget", label: "Budget", desc: "Budget overview", icon: "budget" },
    { id: "benchmarking", label: "Cost Check", desc: "Compare costs to benchmarks", icon: "cost" },
    { id: "accountability", label: "Builder Score", desc: "Builder accountability rating", icon: "score" },
    { id: "ratings", label: "Rate Builder", desc: "Leave a builder rating", icon: "rate" },
    { id: "materials", label: "Materials", desc: "Track materials delivered", icon: "materials" },
    { id: "timeline", label: "Builder Speed", desc: "Builder pace vs industry", icon: "cost" },
    { id: "tribunal", label: "Tribunal Pack", desc: "Export evidence for dispute", icon: "export" },
    { id: "contractreview", label: "Contract Review", desc: "Review contract before signing", icon: "checklists" },
    { id: "checklists", label: "Checklists", desc: "Custom checklists", icon: "checklists" },
    { id: "export", label: "Export", desc: "Export reports & evidence", icon: "export" },
    { id: "reports", label: "Reports", desc: "Generate formal reports", icon: "reports" },
    { id: "pushnotifs", label: "Notifications", desc: "Push notification settings", icon: "notifs" },
    { id: "notifications", label: "Alerts", desc: "View all alerts", icon: "alerts" },
    { id: "settings", label: "Settings", desc: "Project settings", icon: "settings" },
];

// Reverse lookup: tab ID → section ID
const TAB_SECTION_MAP: Record<string, SectionId> = {};
for (const [sectionId, tabs] of Object.entries(SECTION_SUBTABS)) {
    for (const tab of tabs) {
        TAB_SECTION_MAP[tab.id] = sectionId as SectionId;
    }
}
// Map "more" items too
for (const item of MORE_ITEMS) {
    TAB_SECTION_MAP[item.id] = "more";
}
TAB_SECTION_MAP["more_grid"] = "more";

// Stages where certain tabs become visible/relevant
const STAGE_VISIBLE_TABS: Record<string, Set<string>> = {
    site_start: new Set(["inspections", "certificates", "photos", "payments"]),
    slab: new Set(["inspections", "certificates", "photos", "defects"]),
    frame: new Set(["inspections", "certificates", "defects", "photos", "payments"]),
    lockup: new Set(["inspections", "certificates", "payments", "defects"]),
    pre_plasterboard: new Set(["inspections", "photos", "certificates", "defects", "checklists"]),
    fixing: new Set(["inspections", "certificates", "defects", "payments", "variations"]),
    practical_completion: new Set(["inspections", "certificates", "defects", "payments", "documents", "prehandover"]),
};

/* ------------------------------------------------------------------ */
/*  SVG Nav Icons                                                      */
/* ------------------------------------------------------------------ */

function NavIcon({ type, className = "w-5 h-5" }: { type: string; className?: string }) {
    const props = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
    switch (type) {
        case "home":
            return <svg {...props}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
        case "build":
            return <svg {...props}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>;
        case "issues":
            return <svg {...props}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
        case "evidence":
            return <svg {...props}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>;
        case "more":
            return <svg {...props}><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /><circle cx="5" cy="12" r="1" fill="currentColor" /></svg>;
        default:
            return null;
    }
}

function MoreCardIcon({ type, className = "w-6 h-6" }: { type: string; className?: string }) {
    const props = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
    switch (type) {
        case "payments": return <svg {...props}><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>;
        case "budget": return <svg {...props}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
        case "cost": return <svg {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
        case "score": return <svg {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
        case "rate": return <svg {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
        case "materials": return <svg {...props}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>;
        case "checklists": return <svg {...props}><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>;
        case "export": return <svg {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
        case "reports": return <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>;
        case "notifs": return <svg {...props}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
        case "alerts": return <svg {...props}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
        case "settings": return <svg {...props}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
        default: return <svg {...props}><circle cx="12" cy="12" r="10" /></svg>;
    }
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get("tab") || "overview";
    const [project, setProject] = useState<Project | null>(null);
    const [variations, setVariations] = useState<Variation[]>([]);
    const [defects, setDefects] = useState<Defect[]>([]);
    const [activeTab, setActiveTab] = useState(initialTab);
    const [loading, setLoading] = useState(true);
    const [paymentBlocked, setPaymentBlocked] = useState(false);
    const [blockReason, setBlockReason] = useState("");
    const [currentStage, setCurrentStage] = useState("frame");
    const [nextStage, setNextStage] = useState("Lockup");
    const [stageNames, setStageNames] = useState<string[]>([]);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showPhotoCapture, setShowPhotoCapture] = useState(false);

    // Derive active section from active tab
    const activeSection: SectionId = TAB_SECTION_MAP[activeTab] || "home";
    const currentSubTabs = SECTION_SUBTABS[activeSection];

    // Stage-aware tab relevance
    const normalizedStage = currentStage.toLowerCase().replace(/[\s/]+/g, "_");
    const relevantTabs = STAGE_VISIBLE_TABS[normalizedStage] || new Set<string>();

    // Handle section click — navigate to default tab for that section
    const handleSectionClick = (sectionId: SectionId) => {
        const section = SECTIONS.find(s => s.id === sectionId);
        if (section) setActiveTab(section.defaultTab);
    };

    // State-aware license verification URLs
    const getLicenseVerificationUrl = (state?: string) => {
        switch (state) {
            case "VIC": return "https://www.vba.vic.gov.au/tools/register";
            case "QLD": return "https://www.qbcc.qld.gov.au/check-licence-status";
            case "WA": return "https://www.commerce.wa.gov.au/building-commission/register-builders";
            default: return "https://www.fairtrading.nsw.gov.au/trades-and-businesses/licensing-and-registrations/public-register";
        }
    };

    const fetchProject = useCallback(async () => {
        const supabase = createClient();

        // SECURITY: Verify user is authenticated before querying
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push("/guardian/login");
            return;
        }

        // Fetch project with user ownership check (defense-in-depth alongside RLS)
        const { data, error } = await supabase
            .from("projects")
            .select("*")
            .eq("id", params.id)
            .eq("user_id", user.id)
            .single();

        if (data) {
            setProject(data);

            // Compute current stage from stages table
            const { data: stages } = await supabase
                .from("stages")
                .select("name, status")
                .eq("project_id", params.id)
                .order("created_at", { ascending: true });

            if (stages && stages.length > 0) {
                setStageNames(stages.map((s: { name: string }) => s.name));

                const activeStage = stages.find((s: { status: string }) => s.status !== "completed");
                if (activeStage) {
                    setCurrentStage(activeStage.name.toLowerCase().replace(/[\s/]+/g, "_"));
                    const idx = stages.indexOf(activeStage);
                    if (idx < stages.length - 1) {
                        setNextStage(stages[idx + 1].name);
                    }
                } else {
                    const lastStage = stages[stages.length - 1];
                    setCurrentStage(lastStage.name.toLowerCase().replace(/[\s/]+/g, "_"));
                    setNextStage("Handover Complete");
                }
            }

            // Fetch variations for reports
            const { data: varsData } = await supabase
                .from("variations")
                .select("*")
                .eq("project_id", params.id);
            if (varsData) setVariations(varsData);

            // Fetch defects for reports
            const { data: defectsData } = await supabase
                .from("defects")
                .select("*")
                .eq("project_id", params.id);
            if (defectsData) setDefects(defectsData);
        } else {
            console.error("Error fetching project:", error);
        }
        setLoading(false);
    }, [params.id, router]);

    useEffect(() => {
        if (params.id) {
            fetchProject();
            setShowOnboarding(shouldShowOnboarding(params.id as string));
        }
    }, [params.id, fetchProject]);

    // Real-time sync: refresh when data changes from another tab/device
    useRealtimeProject(params.id as string, fetchProject);

    const handlePaymentBlocked = (blocked: boolean, reason: string) => {
        setPaymentBlocked(blocked);
        setBlockReason(reason);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
                <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
                <Link href="/guardian/projects" className="text-primary hover:underline">
                    Back to Projects
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-background pb-16 md:pb-0">
            {/* Top Bar — Back + Project Name */}
            <div className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
                    <Link href="/guardian/projects" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6" /></svg>
                        Projects
                    </Link>
                    <div className="flex items-center gap-3">
                        {paymentBlocked && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-600 border border-red-500/20">
                                Payment Blocked
                            </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider border ${
                            project.status === "active" ? "bg-green-500/10 text-green-600 border-green-500/20"
                                : project.status === "completed" ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                    : "bg-gray-500/10 text-gray-600 border-gray-500/20"
                        }`}>
                            {project.status}
                        </span>
                    </div>
                </div>
            </div>

            {/* Desktop: Main 5-Section Tabs */}
            <div className="hidden md:block border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-6">
                    <nav aria-label="Main navigation" role="tablist" className="flex items-center gap-1">
                        {SECTIONS.map((section) => (
                            <button
                                key={section.id}
                                role="tab"
                                aria-selected={activeSection === section.id}
                                onClick={() => handleSectionClick(section.id)}
                                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[-2px] ${
                                    activeSection === section.id
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                                }`}
                            >
                                <NavIcon type={section.id} className="w-4 h-4" />
                                {section.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Sub-tabs (when section has them) */}
            {currentSubTabs.length > 0 && (
                <div className="border-b border-border bg-muted/30">
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                            <div role="tablist" aria-label={`${activeSection} sub-navigation`} className="flex items-center gap-1 min-w-max py-1">
                                {currentSubTabs.map((tab) => {
                                    const isRelevant = relevantTabs.has(tab.id);
                                    return (
                                        <button
                                            key={tab.id}
                                            role="tab"
                                            aria-selected={activeTab === tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`relative px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
                                                activeTab === tab.id
                                                    ? "bg-primary text-white font-medium"
                                                    : isRelevant
                                                        ? "text-foreground font-medium hover:bg-primary/10"
                                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                            }`}
                                        >
                                            {tab.label}
                                            {isRelevant && activeTab !== tab.id && (
                                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <main role="main" aria-label="Project content" className="flex-1 py-6 px-4 md:px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Project Header — compact */}
                    <div className="mb-6">
                        <h1 className="text-2xl md:text-3xl font-bold mb-1">{project.name}</h1>
                        <div className="flex flex-wrap gap-3 text-muted-foreground text-sm">
                            {project.address && <span>{project.address}</span>}
                            {project.builder_name && (
                                <>
                                    <span className="hidden sm:inline">|</span>
                                    <span>{project.builder_name}</span>
                                </>
                            )}
                            {project.builder_license_number && (
                                <>
                                    <span className="hidden sm:inline">|</span>
                                    <a
                                        href={getLicenseVerificationUrl(project.state)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        License: {project.builder_license_number}
                                    </a>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Payment Blocked Warning */}
                    {paymentBlocked && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                            <svg className="w-6 h-6 text-red-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>
                            <div>
                                <h3 className="font-bold text-red-800 dark:text-red-400">Payment Milestone Blocked</h3>
                                <p className="text-sm text-red-700 dark:text-red-300">{blockReason}</p>
                            </div>
                        </div>
                    )}

                    {/* Guided Onboarding */}
                    {showOnboarding && (
                        <GuidedOnboarding
                            projectId={project.id}
                            projectName={project.name}
                            builderName={project.builder_name || "Builder"}
                            onDismiss={() => setShowOnboarding(false)}
                            onNavigateTab={setActiveTab}
                        />
                    )}

                    {/* Tab Content */}
                    <div role="tabpanel" aria-label={activeTab} className="min-h-[400px]">
                        {/* ── "More" Grid View ── */}
                        {activeTab === "more_grid" && (
                            <div>
                                <h2 className="text-xl font-bold mb-4">Tools & Settings</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {MORE_ITEMS.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveTab(item.id)}
                                            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-colors text-center group"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-muted/50 group-hover:bg-primary/10 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                                <MoreCardIcon type={item.icon} className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm">{item.label}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Home Section ── */}
                        {activeTab === "overview" && (
                            <SmartDashboard
                                project={project}
                                currentStage={currentStage}
                                stageNames={stageNames}
                                onNavigateTab={setActiveTab}
                            />
                        )}
                        {activeTab === "actions" && (
                            <BuilderActionList
                                projectId={project.id}
                                projectName={project.name}
                                builderName={project.builder_name || "Builder"}
                                builderEmail={project.builder_email}
                            />
                        )}
                        {activeTab === "aichat" && (
                            <GuardianChat
                                projectId={project.id}
                                projectName={project.name}
                            />
                        )}

                        {/* ── Build Section ── */}
                        {activeTab === "stagegate" && (
                            <>
                                <StageGate
                                    projectId={project.id}
                                    currentStage={currentStage}
                                    nextStage={nextStage}
                                    onProceed={() => {
                                        fetchProject();
                                        setActiveTab("overview");
                                    }}
                                />
                                <div className="mt-4">
                                    <AIStageAdvice
                                        stage={currentStage}
                                        state={project.state || "NSW"}
                                    />
                                </div>
                            </>
                        )}
                        {activeTab === "stages" && (
                            <StageChecklist projectId={project.id} currentStage={currentStage} />
                        )}
                        {activeTab === "inspections" && (
                            <InspectionTimeline projectId={project.id} currentStage={currentStage} />
                        )}
                        {activeTab === "certificates" && (
                            <CertificationGate
                                projectId={project.id}
                                currentStage={currentStage}
                                stateCode={project.state}
                                onPaymentBlocked={handlePaymentBlocked}
                            />
                        )}
                        {activeTab === "ncc2025" && (
                            <NCC2025Compliance
                                projectId={project.id}
                                stateCode={project.state}
                                buildCategory={project.build_category}
                            />
                        )}

                        {/* ── Issues Section ── */}
                        {activeTab === "defects" && <ProjectDefects projectId={project.id} stages={stageNames} builderEmail={project.builder_email || ""} onDataChanged={fetchProject} />}
                        {activeTab === "variations" && <ProjectVariations projectId={project.id} contractValue={project.contract_value || 0} onDataChanged={fetchProject} />}
                        {activeTab === "redflags" && (
                            <DodgyBuilderAlerts
                                projectId={project.id}
                                currentStage={currentStage}
                                stateCode={project.state}
                                buildCategory={project.build_category}
                                onNavigateTab={setActiveTab}
                            />
                        )}
                        {activeTab === "disputes" && (
                            <DisputeResolution
                                projectId={project.id}
                                stateCode={project.state}
                                builderName={project.builder_name}
                                projectName={project.name}
                                projectAddress={project.address}
                            />
                        )}
                        {activeTab === "prehandover" && (
                            <PreHandoverChecklist
                                projectId={project.id}
                                onDefectsCreated={() => {
                                    fetchProject();
                                    setActiveTab("defects");
                                }}
                            />
                        )}

                        {/* ── Evidence Section ── */}
                        {activeTab === "photos" && <ProgressPhotos projectId={project.id} stages={stageNames} />}
                        {activeTab === "documents" && <DocumentVault projectId={project.id} />}
                        {activeTab === "communication" && <CommunicationLog projectId={project.id} />}
                        {activeTab === "checkins" && <WeeklyCheckIn projectId={project.id} />}
                        {activeTab === "visits" && <SiteVisitLog projectId={project.id} />}

                        {/* ── More Section (individual tools) ── */}
                        {activeTab === "payments" && (
                            <MoreToolWrapper title="Payments" onBack={() => setActiveTab("more_grid")}>
                                <PaymentSchedule projectId={project.id} contractValue={project.contract_value || 0} />
                            </MoreToolWrapper>
                        )}
                        {activeTab === "budget" && (
                            <MoreToolWrapper title="Budget" onBack={() => setActiveTab("more_grid")}>
                                <BudgetDashboard projectId={project.id} contractValue={project.contract_value || 0} />
                            </MoreToolWrapper>
                        )}
                        {activeTab === "benchmarking" && (
                            <MoreToolWrapper title="Cost Check" onBack={() => setActiveTab("more_grid")}>
                                <CostBenchmarking projectId={project.id} contractValue={project.contract_value} stateCode={project.state} />
                            </MoreToolWrapper>
                        )}
                        {activeTab === "accountability" && (
                            <MoreToolWrapper title="Builder Score" onBack={() => setActiveTab("more_grid")}>
                                <AccountabilityScore projectId={project.id} builderName={project.builder_name} />
                            </MoreToolWrapper>
                        )}
                        {activeTab === "ratings" && (
                            <MoreToolWrapper title="Rate Builder" onBack={() => setActiveTab("more_grid")}>
                                <BuilderRatings projectId={project.id} builderName={project.builder_name} builderLicense={project.builder_license_number} stateCode={project.state} />
                            </MoreToolWrapper>
                        )}
                        {activeTab === "materials" && (
                            <MoreToolWrapper title="Materials" onBack={() => setActiveTab("more_grid")}>
                                <MaterialRegistry projectId={project.id} />
                            </MoreToolWrapper>
                        )}
                        {activeTab === "timeline" && (
                            <MoreToolWrapper title="Builder Speed" onBack={() => setActiveTab("more_grid")}>
                                <TimelineBenchmark projectId={project.id} stateCode={project.state} buildCategory={project.build_category} />
                            </MoreToolWrapper>
                        )}
                        {activeTab === "tribunal" && (
                            <MoreToolWrapper title="Tribunal Pack" onBack={() => setActiveTab("more_grid")}>
                                <TribunalExport
                                    projectId={project.id}
                                    projectName={project.name}
                                    builderName={project.builder_name || "Builder"}
                                    contractValue={project.contract_value || 0}
                                    address={project.address || ""}
                                    stateCode={project.state}
                                />
                            </MoreToolWrapper>
                        )}
                        {activeTab === "contractreview" && (
                            <MoreToolWrapper title="Contract Review" onBack={() => setActiveTab("more_grid")}>
                                <ContractReviewChecklist projectId={project.id} />
                            </MoreToolWrapper>
                        )}
                        {activeTab === "checklists" && (
                            <MoreToolWrapper title="Checklists" onBack={() => setActiveTab("more_grid")}>
                                <ProjectChecklists projectId={project.id} />
                            </MoreToolWrapper>
                        )}
                        {activeTab === "export" && (
                            <MoreToolWrapper title="Export" onBack={() => setActiveTab("more_grid")}>
                                <ExportCenter projectId={project.id} projectName={project.name} builderName={project.builder_name || "Builder"} contractValue={project.contract_value || 0} />
                            </MoreToolWrapper>
                        )}
                        {activeTab === "reports" && (
                            <MoreToolWrapper title="Reports" onBack={() => setActiveTab("more_grid")}>
                                <ReportGenerator projectId={project.id} projectName={project.name} builderName={project.builder_name} contractValue={project.contract_value} variations={variations} defects={defects} />
                            </MoreToolWrapper>
                        )}
                        {activeTab === "pushnotifs" && (
                            <MoreToolWrapper title="Notifications" onBack={() => setActiveTab("more_grid")}>
                                <PushNotificationSetup projectId={project.id} projectName={project.name} />
                            </MoreToolWrapper>
                        )}
                        {activeTab === "notifications" && (
                            <MoreToolWrapper title="Alerts" onBack={() => setActiveTab("more_grid")}>
                                <NotificationCenter projectId={project.id} projectName={project.name} builderEmail={project.builder_email || ""} />
                            </MoreToolWrapper>
                        )}
                        {activeTab === "settings" && (
                            <MoreToolWrapper title="Settings" onBack={() => setActiveTab("more_grid")}>
                                <ProjectSettings project={project} onProjectUpdated={(updated) => setProject(updated)} />
                            </MoreToolWrapper>
                        )}
                    </div>
                </div>
            </main>

            {/* ── Mobile Bottom Navigation ── */}
            <nav aria-label="Mobile navigation" className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50"
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
                <div className="flex items-center justify-around">
                    {SECTIONS.map((section) => (
                        <button
                            key={section.id}
                            aria-current={activeSection === section.id ? "page" : undefined}
                            onClick={() => handleSectionClick(section.id)}
                            className={`flex flex-col items-center gap-0.5 py-2 px-3 min-w-[60px] min-h-[44px] transition-colors ${
                                activeSection === section.id
                                    ? "text-primary"
                                    : "text-muted-foreground"
                            }`}
                        >
                            <NavIcon type={section.id} className={`w-5 h-5 ${activeSection === section.id ? "stroke-[2]" : ""}`} />
                            <span className="text-[10px] font-medium">{section.label}</span>
                        </button>
                    ))}
                </div>
            </nav>

            {/* Photo/Defect Speed Dial FAB */}
            <PhotoFAB onClick={() => setShowPhotoCapture(true)} />

            {/* Mobile Photo Capture Overlay */}
            {showPhotoCapture && (
                <MobilePhotoCapture
                    projectId={project.id}
                    stage={currentStage}
                    onPhotoSaved={() => { fetchProject(); }}
                    onClose={() => setShowPhotoCapture(false)}
                />
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  "More" Tool Wrapper — adds back button for drill-in tools          */
/* ------------------------------------------------------------------ */

function MoreToolWrapper({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
    return (
        <div>
            <button
                onClick={onBack}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6" /></svg>
                Back to Tools
            </button>
            <h2 className="text-xl font-bold mb-4">{title}</h2>
            {children}
        </div>
    );
}
