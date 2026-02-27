import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/utils/format";
import { logout, touchLastSeen } from "@/app/guardian/actions";
import ManageBillingButton from "@/components/guardian/ManageBillingButton";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/guardian/login");
    }

    // Record activity (fire-and-forget — does not block render)
    void touchLastSeen(user.id);

    // Fetch user profile for subscription tier
    const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();

    const tier = profile?.subscription_tier || 'free';
    const isFree = tier === 'free';

    // Free tier limits
    const FREE_PROJECT_LIMIT = 1;
    const FREE_DEFECT_LIMIT = 3;
    const FREE_VARIATION_LIMIT = 2;

    // Fetch all projects with their names and status
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name, contract_value, status, address, builder_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    // Aggregate stats across all projects
    let totalContractValue = 0;
    let totalVariations = 0;
    let totalVariationsCount = 0;
    let totalOpenDefects = 0;

    if (projects && projects.length > 0) {
        totalContractValue = projects.reduce((sum: number, p: { contract_value: number | null }) => sum + (p.contract_value || 0), 0);

        // Fetch all variations across all projects
        const projectIds = projects.map((p: { id: string }) => p.id);
        const { data: allVariations } = await supabase
            .from('variations')
            .select('additional_cost, project_id')
            .in('project_id', projectIds);
        if (allVariations) {
            totalVariations = allVariations.reduce((sum: number, v: { additional_cost: number | null }) => sum + (v.additional_cost || 0), 0);
            totalVariationsCount = allVariations.length;
        }

        // Fetch all open defects across all projects
        const { data: allDefects } = await supabase
            .from('defects')
            .select('id')
            .in('project_id', projectIds)
            .eq('status', 'open');
        totalOpenDefects = allDefects?.length || 0;
    }

    // For backward compatibility with quick actions
    const projectId = projects?.[0]?.id;
    const isAdmin = ["sridhar.kothandam@gmail.com", "support@vedawellapp.com"].includes(user.email ?? "");

    return (
        <>
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
                        <h1 className="text-3xl font-bold">🏠 HomeOwner Guardian Dashboard</h1>
                        {isFree ? (
                            <Link href="/guardian/pricing" className="text-sm px-3 py-1.5 bg-primary/10 text-primary rounded-full font-medium hover:bg-primary/20 transition-colors">
                                Free Plan — Upgrade
                            </Link>
                        ) : (
                            <ManageBillingButton />
                        )}
                    </div>

                    {/* Free tier upgrade banner */}
                    {isFree && (
                        <div className="mb-8 p-4 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
                            <div>
                                <p className="font-semibold">Unlock unlimited projects, PDF exports & evidence packs</p>
                                <p className="text-sm text-muted">
                                    Free plan: {FREE_PROJECT_LIMIT} project, {FREE_DEFECT_LIMIT} defects, {FREE_VARIATION_LIMIT} variations
                                </p>
                            </div>
                            <Link href="/guardian/pricing" className="px-4 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors whitespace-nowrap">
                                Upgrade to Pro
                            </Link>
                        </div>
                    )}

                    {/* Stats Cards */}
                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                        <div className="card">
                            <div className="text-muted text-sm mb-1">Total Contract Value</div>
                            <div className="text-2xl font-bold">
                                {totalContractValue > 0 ? formatMoney(totalContractValue) : '$0'}
                            </div>
                            <div className="text-sm text-muted">
                                {projects?.length || 0} project(s)
                            </div>
                        </div>
                        <div className="card">
                            <div className="text-muted text-sm mb-1">Total Variations</div>
                            <div className={`text-2xl font-bold ${totalVariations > 0 ? 'text-orange-500' : ''}`}>
                                {totalVariations > 0 ? '+' : ''}{formatMoney(totalVariations)}
                            </div>
                            <div className="text-sm text-muted">{totalVariationsCount} variation(s)</div>
                        </div>
                        <div className="card">
                            <div className="text-muted text-sm mb-1">Open Defects</div>
                            <div className={`text-2xl font-bold ${totalOpenDefects > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {totalOpenDefects}
                            </div>
                            <div className="text-sm text-muted">
                                {totalOpenDefects === 0 ? 'All clear!' : 'Need attention'}
                            </div>
                        </div>
                        <div className="card">
                            <div className="text-muted text-sm mb-1">Projected Total</div>
                            <div className="text-2xl font-bold text-primary">
                                {formatMoney(totalContractValue + totalVariations)}
                            </div>
                            <div className="text-sm text-muted">Contracts + Variations</div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                        {isFree && (projects?.length || 0) >= FREE_PROJECT_LIMIT ? (
                            <Link href="/guardian/pricing" className="card hover:border-primary transition-colors border-dashed opacity-80">
                                <span className="text-3xl mb-3 block">🔒</span>
                                <h3 className="font-bold mb-2">Upgrade for More Projects</h3>
                                <p className="text-muted text-sm">
                                    Free plan allows {FREE_PROJECT_LIMIT} project. Upgrade to Pro for unlimited.
                                </p>
                            </Link>
                        ) : (
                            <Link href="/guardian/projects/new" className="card hover:border-primary transition-colors">
                                <span className="text-3xl mb-3 block">➕</span>
                                <h3 className="font-bold mb-2">Create New Project</h3>
                                <p className="text-muted text-sm">
                                    Start tracking a new home construction project
                                </p>
                            </Link>
                        )}
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
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${
                                                project.status === 'active'
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
