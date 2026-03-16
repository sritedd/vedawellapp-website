"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Project, Variation, Defect } from "@/types/guardian";

// Components
import ProjectSettings from "@/components/guardian/ProjectSettings";
import ProjectOverview from "@/components/guardian/ProjectOverview";
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
                // Store stage names for child components
                setStageNames(stages.map((s: { name: string }) => s.name));

                // Find the first non-completed stage
                const activeStage = stages.find((s: { status: string }) => s.status !== "completed");
                if (activeStage) {
                    setCurrentStage(activeStage.name.toLowerCase().replace(/[\s/]+/g, "_"));
                    const idx = stages.indexOf(activeStage);
                    if (idx < stages.length - 1) {
                        setNextStage(stages[idx + 1].name);
                    }
                } else {
                    // All completed — set to last stage
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
                    ← Back to Projects
                </Link>
            </div>
        );
    }

    // Stage-relevant tab indicators — highlight what matters now
    const STAGE_RELEVANT_TABS: Record<string, string[]> = {
        site_start: ["inspections", "certificates", "photos", "payments"],
        slab: ["inspections", "certificates", "photos", "defects"],
        frame: ["inspections", "certificates", "defects", "photos", "payments"],
        lockup: ["inspections", "certificates", "payments", "defects"],
        pre_plasterboard: ["inspections", "photos", "certificates", "defects", "checklists"],
        fixing: ["inspections", "certificates", "defects", "payments", "variations"],
        practical_completion: ["inspections", "certificates", "defects", "payments", "documents"],
    };
    const normalizedStage = currentStage.toLowerCase().replace(/[\s/]+/g, "_");
    const relevantTabs = new Set(STAGE_RELEVANT_TABS[normalizedStage] || []);

    // Flat navigation tabs — grouped visually with separators, no dropdowns
    const navSections = [
        {
            label: "Overview",
            tabs: [
                { id: "overview", label: "Dashboard" },
                { id: "actions", label: "Pending Actions" },
                { id: "stagegate", label: "Stage Gate" },
            ],
        },
        {
            label: "Build",
            tabs: [
                { id: "stages", label: "Stages" },
                { id: "defects", label: "Defects" },
                { id: "inspections", label: "Inspections" },
                { id: "variations", label: "Variations" },
                { id: "redflags", label: "Red Flags" },
                { id: "ncc2025", label: "NCC 2025" },
            ],
        },
        {
            label: "Money",
            tabs: [
                { id: "payments", label: "Payments" },
                { id: "budget", label: "Budget" },
                { id: "certificates", label: "Certificates" },
                { id: "benchmarking", label: "Cost Check" },
            ],
        },
        {
            label: "Records",
            tabs: [
                { id: "photos", label: "Photos" },
                { id: "documents", label: "Documents" },
                { id: "communication", label: "Comms Log" },
            ],
        },
        {
            label: "Protect",
            tabs: [
                { id: "disputes", label: "Disputes" },
                { id: "accountability", label: "Builder Score" },
                { id: "ratings", label: "Rate Builder" },
                { id: "prehandover", label: "Pre-Handover" },
            ],
        },
        {
            label: "More",
            tabs: [
                { id: "checklists", label: "Checklists" },
                { id: "materials", label: "Materials" },
                { id: "visits", label: "Site Visits" },
                { id: "checkins", label: "Weekly Check-ins" },
                { id: "pushnotifs", label: "Notifications" },
                { id: "notifications", label: "Alerts" },
                { id: "export", label: "Export" },
                { id: "reports", label: "Reports" },
                { id: "settings", label: "Settings" },
            ],
        },
    ];

    // For breadcrumb display
    const activeSection = navSections.find((s) =>
        s.tabs.some((t) => t.id === activeTab)
    ) || navSections[0];
    const activeTabLabel = activeSection.tabs.find((t) => t.id === activeTab)?.label || "Dashboard";

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Guardian Sub-Navigation */}
            <div className="border-b border-border bg-muted/5">
                <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6">
                    <Link href="/guardian/projects" className="text-muted hover:text-foreground text-sm">
                        ← Back to Projects
                    </Link>
                    <Link href="/guardian/journey" className="text-muted hover:text-foreground text-sm">
                        📚 Learn
                    </Link>
                </div>
            </div>

            <main className="flex-1 py-8 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold mb-1">{project.name}</h1>
                            <div className="flex flex-wrap gap-4 text-muted text-sm">
                                <span>📍 {project.address}</span>
                                <span>👷 {project.builder_name}</span>
                                {project.builder_license_number && (
                                    <a
                                        href={getLicenseVerificationUrl(project.state)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        License: {project.builder_license_number}
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 items-center">
                            {paymentBlocked && (
                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-500/10 text-red-600 border border-red-500/20">
                                    🚫 Payment Blocked
                                </span>
                            )}
                            <span
                                className={`px-3 py-1 rounded-full text-sm font-medium uppercase tracking-wider border ${project.status === "active"
                                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                                    : project.status === "completed"
                                        ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                        : "bg-gray-500/10 text-gray-600 border-gray-500/20"
                                    }`}
                            >
                                {project.status}
                            </span>
                        </div>
                    </div>

                    {/* Payment Blocked Warning */}
                    {paymentBlocked && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🚫</span>
                                <div>
                                    <h3 className="font-bold text-red-800">Payment Milestone Blocked</h3>
                                    <p className="text-sm text-red-700">{blockReason}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation — horizontal scrollable, grouped with labels */}
                    <div className="mb-6">
                        <div className="overflow-x-auto -mx-6 px-6">
                            <div className="flex items-center gap-1 min-w-max pb-3 border-b border-border">
                                {navSections.map((section, sectionIdx) => (
                                    <div key={section.label} className="flex items-center gap-1">
                                        {sectionIdx > 0 && (
                                            <div className="w-px h-6 bg-border mx-2" />
                                        )}
                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1 hidden sm:inline">
                                            {section.label}
                                        </span>
                                        {section.tabs.map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`relative px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${activeTab === tab.id
                                                    ? "bg-primary text-white font-medium"
                                                    : relevantTabs.has(tab.id)
                                                        ? "text-foreground font-medium hover:bg-primary/10"
                                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                    }`}
                                            >
                                                {tab.label}
                                                {relevantTabs.has(tab.id) && activeTab !== tab.id && (
                                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                            <span>{activeSection.label}</span>
                            <span>/</span>
                            <span className="text-foreground font-medium">{activeTabLabel}</span>
                        </div>
                    </div>

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
                    <div className="min-h-[500px]">
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
                        {activeTab === "stagegate" && (
                            <StageGate
                                projectId={project.id}
                                currentStage={currentStage}
                                nextStage={nextStage}
                                onProceed={() => {
                                    // Re-fetch project data to advance the stage
                                    fetchProject();
                                    setActiveTab("overview");
                                }}
                            />
                        )}
                        {activeTab === "stages" && (
                            <StageChecklist projectId={project.id} currentStage={currentStage} />
                        )}
                        {activeTab === "checklists" && <ProjectChecklists projectId={project.id} />}
                        {activeTab === "variations" && <ProjectVariations projectId={project.id} contractValue={project.contract_value || 0} onDataChanged={fetchProject} />}
                        {activeTab === "defects" && <ProjectDefects projectId={project.id} stages={stageNames} builderEmail={project.builder_email || ""} onDataChanged={fetchProject} />}
                        {activeTab === "photos" && <ProgressPhotos projectId={project.id} stages={stageNames} />}
                        {activeTab === "visits" && <SiteVisitLog projectId={project.id} />}
                        {activeTab === "certificates" && (
                            <CertificationGate
                                projectId={project.id}
                                currentStage={currentStage}
                                onPaymentBlocked={handlePaymentBlocked}
                            />
                        )}
                        {activeTab === "checkins" && <WeeklyCheckIn projectId={project.id} />}
                        {activeTab === "inspections" && (
                            <InspectionTimeline projectId={project.id} currentStage={currentStage} />
                        )}
                        {activeTab === "ncc2025" && (
                            <NCC2025Compliance
                                projectId={project.id}
                                stateCode={project.state}
                                buildCategory={project.build_category}
                            />
                        )}
                        {activeTab === "redflags" && (
                            <DodgyBuilderAlerts
                                projectId={project.id}
                                currentStage={currentStage}
                                stateCode={project.state}
                                buildCategory={project.build_category}
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
                        {activeTab === "accountability" && (
                            <AccountabilityScore
                                projectId={project.id}
                                builderName={project.builder_name}
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
                        {activeTab === "ratings" && (
                            <BuilderRatings
                                projectId={project.id}
                                builderName={project.builder_name}
                                builderLicense={project.builder_license_number}
                                stateCode={project.state}
                            />
                        )}
                        {activeTab === "benchmarking" && (
                            <CostBenchmarking
                                projectId={project.id}
                                contractValue={project.contract_value}
                                stateCode={project.state}
                            />
                        )}
                        {activeTab === "pushnotifs" && (
                            <PushNotificationSetup
                                projectId={project.id}
                                projectName={project.name}
                            />
                        )}
                        {activeTab === "materials" && <MaterialRegistry projectId={project.id} />}
                        {activeTab === "communication" && <CommunicationLog projectId={project.id} />}
                        {activeTab === "payments" && (
                            <PaymentSchedule projectId={project.id} contractValue={project.contract_value || 0} />
                        )}
                        {activeTab === "budget" && (
                            <BudgetDashboard projectId={project.id} contractValue={project.contract_value || 0} />
                        )}
                        {activeTab === "documents" && <DocumentVault projectId={project.id} />}
                        {activeTab === "notifications" && (
                            <NotificationCenter
                                projectId={project.id}
                                projectName={project.name}
                                builderEmail={project.builder_email || ""}
                            />
                        )}
                        {activeTab === "export" && (
                            <ExportCenter
                                projectId={project.id}
                                projectName={project.name}
                                builderName={project.builder_name || "Builder"}
                                contractValue={project.contract_value || 0}
                            />
                        )}
                        {activeTab === "settings" && (
                            <ProjectSettings project={project} onProjectUpdated={(updated) => setProject(updated)} />
                        )}
                        {activeTab === "reports" && (
                            <ReportGenerator
                                projectId={project.id}
                                projectName={project.name}
                                builderName={project.builder_name}
                                contractValue={project.contract_value}
                                variations={variations}
                                defects={defects}
                            />
                        )}
                    </div>
                </div>
            </main>

            {/* Mobile Photo FAB */}
            <PhotoFAB onClick={() => setShowPhotoCapture(true)} />

            {/* Mobile Photo Capture Overlay */}
            {showPhotoCapture && (
                <MobilePhotoCapture
                    projectId={project.id}
                    stage={currentStage}
                    onPhotoSaved={() => {
                        fetchProject();
                    }}
                    onClose={() => setShowPhotoCapture(false)}
                />
            )}
        </div>
    );
}
