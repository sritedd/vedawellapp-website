import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/utils/format";
import { logout } from "@/app/guardian/actions";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/guardian/login");
    }

    // Fetch project stats
    const { data: projects } = await supabase
        .from('projects')
        .select('id, contract_value')
        .eq('user_id', user.id);

    const projectId = projects?.[0]?.id;
    const contractValue = projects?.[0]?.contract_value || 0;

    // Fetch variations total
    let variationsTotal = 0;
    let variationsCount = 0;
    if (projectId) {
        const { data: variations } = await supabase
            .from('variations')
            .select('additional_cost')
            .eq('project_id', projectId);
        variationsTotal = variations?.reduce((sum: number, v: any) => sum + (v.additional_cost || 0), 0) || 0;
        variationsCount = variations?.length || 0;
    }

    // Fetch defects count
    let openDefects = 0;
    if (projectId) {
        const { data: defects } = await supabase
            .from('defects')
            .select('id')
            .eq('project_id', projectId)
            .eq('status', 'open');
        openDefects = defects?.length || 0;
    }

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
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-muted text-sm">{user.email}</span>
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
                    <h1 className="text-3xl font-bold mb-8">🏠 HomeOwner Guardian Dashboard</h1>

                    {/* Stats Cards */}
                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                        <div className="card">
                            <div className="text-muted text-sm mb-1">Contract Value</div>
                            <div className="text-2xl font-bold">
                                {contractValue > 0 ? formatMoney(contractValue) : '$0'}
                            </div>
                            <div className="text-sm text-muted">
                                {projects?.length || 0} project(s)
                            </div>
                        </div>
                        <div className="card">
                            <div className="text-muted text-sm mb-1">Variations</div>
                            <div className={`text-2xl font-bold ${variationsTotal > 0 ? 'text-orange-500' : ''}`}>
                                {variationsTotal > 0 ? '+' : ''}{formatMoney(variationsTotal)}
                            </div>
                            <div className="text-sm text-muted">{variationsCount} variation(s)</div>
                        </div>
                        <div className="card">
                            <div className="text-muted text-sm mb-1">Open Defects</div>
                            <div className={`text-2xl font-bold ${openDefects > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {openDefects}
                            </div>
                            <div className="text-sm text-muted">
                                {openDefects === 0 ? 'All clear!' : 'Need attention'}
                            </div>
                        </div>
                        <div className="card">
                            <div className="text-muted text-sm mb-1">Projected Total</div>
                            <div className="text-2xl font-bold text-primary">
                                {formatMoney(contractValue + variationsTotal)}
                            </div>
                            <div className="text-sm text-muted">Contract + Variations</div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                        <Link href="/guardian/projects/new" className="card hover:border-primary transition-colors">
                            <span className="text-3xl mb-3 block">➕</span>
                            <h3 className="font-bold mb-2">Create New Project</h3>
                            <p className="text-muted text-sm">
                                Start tracking a new home construction project
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

                    {/* Getting Started OR Project Summary */}
                    {!projectId ? (
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
                        <div className="card">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">Your Active Project</h2>
                                <Link
                                    href={`/guardian/projects/${projectId}`}
                                    className="text-primary hover:underline text-sm"
                                >
                                    View Details →
                                </Link>
                            </div>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="p-4 bg-muted/10 rounded-lg">
                                    <div className="text-sm text-muted">Status</div>
                                    <div className="font-bold">Active</div>
                                </div>
                                <div className="p-4 bg-muted/10 rounded-lg">
                                    <div className="text-sm text-muted">Current Stage</div>
                                    <div className="font-bold">Frame Stage</div>
                                </div>
                                <div className="p-4 bg-muted/10 rounded-lg">
                                    <div className="text-sm text-muted">Next Milestone</div>
                                    <div className="font-bold">Pre-Plasterboard</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
