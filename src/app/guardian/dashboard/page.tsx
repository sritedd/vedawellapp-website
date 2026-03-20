import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { formatMoney } from "@/utils/format";
import { logout, touchLastSeen } from "@/app/guardian/actions";
import ManageBillingButton from "@/components/guardian/ManageBillingButton";
import OnboardingWizard from "@/components/guardian/OnboardingWizard";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/guardian/login");
    }

    // Record activity (fire-and-forget — does not block render)
    void touchLastSeen(user.id);

    // Parallel fetch: profile, projects, and announcements all at once
    const [profileResult, projectsResult, announcementResult] = await Promise.all([
        supabase.from('profiles').select('subscription_tier, is_admin, trial_ends_at').eq('id', user.id).single(),
        supabase.from('projects').select('id, name, contract_value, status, address, builder_name').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from("announcements").select("message, type").eq("active", true).order("created_at", { ascending: false }).limit(1).single(),
    ]);

    const profile = profileResult.data;
    const projects = projectsResult.data;
    const announcement = announcementResult.data;

    const rawTier = profile?.subscription_tier || 'free';
    const isAdmin = profile?.is_admin === true || isAdminEmail(user.email);
    const trialActive = rawTier === 'trial' && profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date();
    const hasPro = rawTier === 'guardian_pro' || isAdmin || trialActive;
    const tier = hasPro ? 'guardian_pro' : 'free';
    const isFree = !hasPro;
    const FREE_PROJECT_LIMIT = 1;

    // Aggregate stats across all projects (parallel fetch variations + defects)
    let totalContractValue = 0;
    let totalVariations = 0;
    let totalVariationsCount = 0;
    let totalOpenDefects = 0;

    if (projects && projects.length > 0) {
        totalContractValue = projects.reduce((sum: number, p: { contract_value: number | null }) => sum + (p.contract_value || 0), 0);

        const projectIds = projects.map((p: { id: string }) => p.id);

        // Parallel fetch: variations + defects
        const [variationsResult, defectsResult] = await Promise.all([
            supabase.from('variations').select('additional_cost, project_id').in('project_id', projectIds),
            supabase.from('defects').select('id').in('project_id', projectIds).not('status', 'in', '(verified,rectified)'),
        ]);

        const allVariations = variationsResult.data;
        if (allVariations) {
            totalVariations = allVariations.reduce((sum: number, v: { additional_cost: number | null }) => sum + (v.additional_cost || 0), 0);
            totalVariationsCount = allVariations.length;
        }
        totalOpenDefects = defectsResult.data?.length || 0;
    }

    // For quick actions, prefer active/planning project, fallback to most recent
    const activeProject = projects?.find((p: { status: string }) => p.status === "active" || p.status === "planning");
    const projectId = activeProject?.id || projects?.[0]?.id;
    // isAdmin already defined above from profile.is_admin

    return (
        <>
            {/* Onboarding wizard for first-time users */}
            {(!projects || projects.length === 0) && <OnboardingWizard />}

            {/* Dashboard Sub-Navigation */}
            <div className="border-b border-border bg-muted/5">
                <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <Link href="/guardian/dashboard" className="font-semibold text-primary">
                            Dashboard
                        </Link>
                        <Link href="/guardian/projects" className="text-muted hover:text-foreground">
                            Projects
                        </Link>
                        <Link href="/guardian/journey" className="text-muted hover:text-foreground">
                            📚 Learn
                        </Link>
                        <Link href="/guardian/refer" className="text-muted hover:text-foreground">
                            🎁 Refer
                        </Link>
                        {hasPro && (
                            <Link href="/guardian/support" className="text-muted hover:text-foreground">
                                💬 Support
                            </Link>
                        )}
                        {isAdmin && (
                            <Link href="/guardian/admin" className="text-yellow-600 hover:text-yellow-500 font-medium text-sm">
                                ⚙️ Admin
                            </Link>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/guardian/profile" className="text-muted text-sm hover:text-primary transition-colors flex items-center gap-1">
                            👤 {user.email}
                        </Link>
                        <form action={logout}>
                            <button
                                type="submit"
                                className="text-sm text-muted hover:text-danger transition-colors px-3 py-1 rounded border border-border hover:border-danger"
                            >
                                Sign Out
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="bg-background">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold">HomeOwner Guardian</h1>
                        <div className="flex items-center gap-3">
                            {isFree ? (
                                <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full font-medium">
                                    Free
                                </span>
                            ) : trialActive ? (
                                <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-600 rounded-full font-medium">
                                    Trial — ends {new Date(profile!.trial_ends_at!).toLocaleDateString("en-AU")}
                                </span>
                            ) : isAdmin ? (
                                <Link href="/guardian/admin" className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-600 rounded-full font-medium hover:bg-yellow-500/20 transition-colors">
                                    Admin
                                </Link>
                            ) : (
                                <ManageBillingButton />
                            )}
                        </div>
                    </div>

                    {/* Admin announcement banner */}
                    {announcement && (
                        <div className={`mb-6 p-4 rounded-lg text-sm font-medium border ${announcement.type === "warning"
                                ? "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                                : announcement.type === "success"
                                    ? "bg-green-500/10 text-green-700 border-green-500/20"
                                    : "bg-blue-500/10 text-blue-700 border-blue-500/20"
                            }`}>
                            {announcement.message}
                        </div>
                    )}

                    {/* Stats Cards — clickable when project exists */}
                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                        {projectId ? (
                            <Link href={`/guardian/projects/${projectId}`} className="card hover:border-primary transition-colors">
                                <div className="text-muted text-sm mb-1">Total Contract Value</div>
                                <div className="text-2xl font-bold">
                                    {totalContractValue > 0 ? formatMoney(totalContractValue) : '$0'}
                                </div>
                                <div className="text-sm text-muted">{projects?.length || 0} project(s)</div>
                            </Link>
                        ) : (
                            <div className="card">
                                <div className="text-muted text-sm mb-1">Total Contract Value</div>
                                <div className="text-2xl font-bold">$0</div>
                                <div className="text-sm text-muted">0 projects</div>
                            </div>
                        )}
                        <Link href={projectId ? `/guardian/projects/${projectId}?tab=variations` : "/guardian/projects"} className="card hover:border-primary transition-colors">
                            <div className="text-muted text-sm mb-1">Total Variations</div>
                            <div className={`text-2xl font-bold ${totalVariations > 0 ? 'text-orange-500' : ''}`}>
                                {totalVariations > 0 ? '+' : ''}{formatMoney(totalVariations)}
                            </div>
                            <div className="text-sm text-muted">{totalVariationsCount} variation(s)</div>
                        </Link>
                        <Link href={projectId ? `/guardian/projects/${projectId}?tab=defects` : "/guardian/projects"} className="card hover:border-primary transition-colors">
                            <div className="text-muted text-sm mb-1">Open Defects</div>
                            <div className={`text-2xl font-bold ${totalOpenDefects > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {totalOpenDefects}
                            </div>
                            <div className="text-sm text-muted">
                                {totalOpenDefects === 0 ? 'All clear!' : 'Need attention'}
                            </div>
                        </Link>
                        <Link href={projectId ? `/guardian/projects/${projectId}?tab=budget` : "/guardian/projects"} className="card hover:border-primary transition-colors">
                            <div className="text-muted text-sm mb-1">Projected Total</div>
                            <div className="text-2xl font-bold text-primary">
                                {formatMoney(totalContractValue + totalVariations)}
                            </div>
                            <div className="text-sm text-muted">Contracts + Variations</div>
                        </Link>
                    </div>

                    {/* Quick Actions */}
                    <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                        <Link href={isFree && (projects?.length || 0) >= FREE_PROJECT_LIMIT ? "/guardian/pricing" : "/guardian/projects/new"} className="card hover:border-primary transition-colors">
                            <span className="text-3xl mb-3 block">+</span>
                            <h3 className="font-bold mb-2">New Project</h3>
                            <p className="text-muted text-sm">
                                {isFree && (projects?.length || 0) >= FREE_PROJECT_LIMIT
                                    ? "Upgrade to add more projects"
                                    : "Start tracking a construction project"}
                            </p>
                        </Link>
                        {projectId && (
                            <Link href={`/guardian/projects/${projectId}`} className="card hover:border-primary transition-colors">
                                <span className="text-3xl mb-3 block">📋</span>
                                <h3 className="font-bold mb-2">View Checklists</h3>
                                <p className="text-muted text-sm">
                                    Document insulation and rough-in
                                </p>
                            </Link>
                        )}
                        <Link href="/guardian/journey" className="card hover:border-primary transition-colors bg-blue-50 border-blue-200">
                            <span className="text-3xl mb-3 block">📚</span>
                            <h3 className="font-bold mb-2 text-blue-700">Build Journey Guide</h3>
                            <p className="text-muted text-sm">
                                Learn what to expect at each stage
                            </p>
                        </Link>
                        {projectId && (
                            <Link href={`/guardian/projects/${projectId}?tab=variations`} className="card hover:border-primary transition-colors">
                                <span className="text-3xl mb-3 block">💰</span>
                                <h3 className="font-bold mb-2">Log Variation</h3>
                                <p className="text-muted text-sm">
                                    Record changes with digital signature
                                </p>
                            </Link>
                        )}
                    </div>

                    {/* Getting Started OR Projects List */}
                    {!projects || projects.length === 0 ? (
                        <div className="card border-primary/30 bg-primary/5">
                            <h2 className="text-xl font-bold mb-4">🚀 Getting Started</h2>
                            <ol className="list-decimal list-inside space-y-2 text-muted">
                                <li>Create a new project with your builder and contract details</li>
                                <li>Upload your building contract (we&apos;ll extract key dates and inclusions)</li>
                                <li>Start tracking inspections, variations, and defects</li>
                                <li>Generate reports for Fair Trading or NCAT if needed</li>
                            </ol>
                            <div className="mt-4">
                                <Link
                                    href="/guardian/journey"
                                    className="text-primary hover:underline font-medium"
                                >
                                    📚 First, learn about the build process →
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-xl font-bold mb-4">Your Projects</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                {projects.map((project: { id: string; name: string; status: string; address: string; builder_name: string; contract_value: number | null }) => (
                                    <Link
                                        key={project.id}
                                        href={`/guardian/projects/${project.id}`}
                                        className="card hover:border-primary transition-colors"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-bold">{project.name}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${project.status === 'active'
                                                ? 'bg-green-500/10 text-green-600'
                                                : project.status === 'completed'
                                                    ? 'bg-blue-500/10 text-blue-600'
                                                    : 'bg-gray-500/10 text-gray-600'
                                                }`}>
                                                {project.status}
                                            </span>
                                        </div>
                                        <div className="text-sm text-muted space-y-1">
                                            {project.address && <div>📍 {project.address}</div>}
                                            {project.builder_name && <div>👷 {project.builder_name}</div>}
                                            {project.contract_value && (
                                                <div className="font-medium text-foreground">
                                                    {formatMoney(project.contract_value)}
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
