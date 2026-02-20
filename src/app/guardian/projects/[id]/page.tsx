"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Project, Variation, Defect } from "@/types/guardian";

// Components
import ProjectOverview from "@/components/guardian/ProjectOverview";
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

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [project, setProject] = useState<Project | null>(null);
    const [variations, setVariations] = useState<Variation[]>([]);
    const [defects, setDefects] = useState<Defect[]>([]);
    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(true);
    const [paymentBlocked, setPaymentBlocked] = useState(false);
    const [blockReason, setBlockReason] = useState("");
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    useEffect(() => {
        const fetchProject = async () => {
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
            } else if (process.env.NODE_ENV === "development") {
                // Mock Data Fallback
                console.log("Using Mock Data for Project Detail");
                setProject({
                    id: "mock-project-1",
                    user_id: "mock-user-1",
                    name: "Demo Project: Dream Home",
                    address: "123 Test St, Sydney",
                    builder_name: "Metricon",
                    builder_license_number: "123456C",
                    hbcf_policy_number: "HBCF-2024-001",
                    insurance_expiry_date: "2026-12-31",
                    status: "active",
                    contract_value: 500000,
                    created_at: new Date().toISOString(),
                    start_date: new Date().toISOString(),
                });
                setVariations([
                    {
                        id: "1",
                        project_id: "mock-project-1",
                        title: "Upgraded Kitchen Benchtop",
                        description: "Stone benchtop upgrade from laminate",
                        additional_cost: 8500,
                        status: "approved",
                        created_at: new Date().toISOString(),
                    },
                    {
                        id: "2",
                        project_id: "mock-project-1",
                        title: "Extra Downlights",
                        description: "Additional 8 LED downlights in living area",
                        additional_cost: 1200,
                        status: "draft",
                        created_at: new Date().toISOString(),
                    },
                ]);
                setDefects([
                    {
                        id: "1",
                        project_id: "mock-project-1",
                        title: "Paint scratches on hallway wall",
                        description: "Multiple scratches visible near front door",
                        location: "Hallway",
                        stage: "Fixing",
                        severity: "minor",
                        status: "open",
                        reportedDate: new Date().toISOString().split("T")[0],
                        photos: [],
                        rectificationPhotos: [],
                        reminderCount: 0,
                        created_at: new Date().toISOString(),
                    },
                ]);
            } else {
                console.error("Error fetching project:", error);
            }
            setLoading(false);
        };

        if (params.id) {
            fetchProject();
        }
    }, [params.id, router]);

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

    // Tab groups for cleaner navigation
    const tabGroups = [
        {
            id: "overview",
            label: "Overview",
            icon: "📊",
            tabs: [
                { id: "overview", label: "Dashboard", icon: "📊" },
                { id: "actions", label: "Pending Actions", icon: "🚨" },
                { id: "stagegate", label: "Stage Gate", icon: "🚧" },
            ],
        },
        {
            id: "construction",
            label: "Construction",
            icon: "🏗️",
            tabs: [
                { id: "stages", label: "Build Stages", icon: "🏠" },
                { id: "checklists", label: "Custom Checklists", icon: "📋" },
                { id: "defects", label: "Defects & Snags", icon: "🛠️" },
                { id: "inspections", label: "Inspections", icon: "🔍" },
                { id: "materials", label: "Materials", icon: "🧱" },
                { id: "variations", label: "Variations", icon: "💰" },
            ],
        },
        {
            id: "progress",
            label: "Progress",
            icon: "📸",
            tabs: [
                { id: "photos", label: "Photos", icon: "📸" },
                { id: "visits", label: "Site Visits", icon: "🏗️" },
                { id: "checkins", label: "Weekly Check-ins", icon: "📅" },
            ],
        },
        {
            id: "financial",
            label: "Financial",
            icon: "💳",
            tabs: [
                { id: "payments", label: "Payments", icon: "💳" },
                { id: "budget", label: "Budget", icon: "📈" },
                { id: "certificates", label: "Certificates", icon: "📄" },
            ],
        },
        {
            id: "documents",
            label: "Docs & Comms",
            icon: "📁",
            tabs: [
                { id: "documents", label: "Document Vault", icon: "📁" },
                { id: "communication", label: "Communication Log", icon: "📝" },
                { id: "notifications", label: "Alerts", icon: "🔔" },
            ],
        },
        {
            id: "tools",
            label: "Tools",
            icon: "🔧",
            tabs: [
                { id: "export", label: "Export Reports", icon: "📤" },
                { id: "reports", label: "Generate Report", icon: "📑" },
            ],
        },
    ];

    // Find active group
    const activeGroup = tabGroups.find((g) =>
        g.tabs.some((t) => t.id === activeTab)
    ) || tabGroups[0];

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
                                        href={`https://www.fairtrading.nsw.gov.au/trades-and-businesses/licensing-and-registrations/public-register`}
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

                    {/* Grouped Navigation */}
                    <div className="mb-6">
                        {/* Main Category Tabs */}
                        <div className="flex flex-wrap gap-2 border-b border-border pb-3 mb-3">
                            {tabGroups.map((group) => {
                                const isActive = group.tabs.some((t) => t.id === activeTab);
                                return (
                                    <div key={group.id} className="relative">
                                        <button
                                            onClick={() => {
                                                if (openDropdown === group.id) {
                                                    setOpenDropdown(null);
                                                } else {
                                                    setOpenDropdown(group.id);
                                                }
                                            }}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${isActive
                                                ? "bg-primary text-white"
                                                : "bg-muted hover:bg-muted/80"
                                                }`}
                                        >
                                            <span>{group.icon}</span>
                                            <span>{group.label}</span>
                                            <span className="text-xs opacity-70">▼</span>
                                        </button>

                                        {/* Dropdown */}
                                        {openDropdown === group.id && (
                                            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-border rounded-lg shadow-lg z-50 min-w-48 py-1">
                                                {group.tabs.map((tab) => (
                                                    <button
                                                        key={tab.id}
                                                        onClick={() => {
                                                            setActiveTab(tab.id);
                                                            setOpenDropdown(null);
                                                        }}
                                                        className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted/50 text-gray-900 dark:text-gray-100 ${activeTab === tab.id
                                                            ? "bg-primary/10 text-primary font-medium"
                                                            : ""
                                                            }`}
                                                    >
                                                        <span>{tab.icon}</span>
                                                        <span>{tab.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Current Section Breadcrumb */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{activeGroup.icon} {activeGroup.label}</span>
                            <span>→</span>
                            <span className="text-foreground font-medium">
                                {activeGroup.tabs.find((t) => t.id === activeTab)?.label || "Dashboard"}
                            </span>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[500px]">
                        {activeTab === "overview" && <ProjectOverview project={project} />}
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
                                currentStage="lockup"
                                nextStage="Fixing"
                            />
                        )}
                        {activeTab === "stages" && (
                            <StageChecklist projectId={project.id} currentStage="frame" />
                        )}
                        {activeTab === "checklists" && <ProjectChecklists projectId={project.id} />}
                        {activeTab === "variations" && <ProjectVariations projectId={project.id} />}
                        {activeTab === "defects" && <ProjectDefects projectId={project.id} />}
                        {activeTab === "photos" && <ProgressPhotos projectId={project.id} />}
                        {activeTab === "visits" && <SiteVisitLog projectId={project.id} />}
                        {activeTab === "certificates" && (
                            <CertificationGate
                                projectId={project.id}
                                currentStage="lockup"
                                onPaymentBlocked={handlePaymentBlocked}
                            />
                        )}
                        {activeTab === "checkins" && <WeeklyCheckIn projectId={project.id} />}
                        {activeTab === "inspections" && (
                            <InspectionTimeline projectId={project.id} currentStage="Lockup" />
                        )}
                        {activeTab === "materials" && <MaterialRegistry projectId={project.id} />}
                        {activeTab === "communication" && <CommunicationLog projectId={project.id} />}
                        {activeTab === "payments" && (
                            <PaymentSchedule projectId={project.id} contractValue={project.contract_value || 500000} />
                        )}
                        {activeTab === "budget" && (
                            <BudgetDashboard projectId={project.id} contractValue={project.contract_value || 500000} />
                        )}
                        {activeTab === "documents" && <DocumentVault projectId={project.id} />}
                        {activeTab === "notifications" && (
                            <NotificationCenter
                                projectId={project.id}
                                projectName={project.name}
                                builderEmail=""
                            />
                        )}
                        {activeTab === "export" && (
                            <ExportCenter
                                projectId={project.id}
                                projectName={project.name}
                                builderName={project.builder_name || "Builder"}
                                contractValue={project.contract_value || 500000}
                            />
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
        </div>
    );
}
