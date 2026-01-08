import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/guardian/login");
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* Navigation */}
            <nav className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold">
                        <span>🛠️</span>
                        <span>VedaWell Tools</span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link href="/guardian/dashboard" className="font-semibold text-primary">
                            Dashboard
                        </Link>
                        <span className="text-muted text-sm">{user.email}</span>
                    </div>
                </div>
            </nav>

            {/* Dashboard Content */}
            <main className="flex-1 bg-background">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <h1 className="text-3xl font-bold mb-8">🏠 HomeOwner Guardian Dashboard</h1>

                    {/* Stats Cards */}
                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                        <div className="card">
                            <div className="text-muted text-sm mb-1">Contract Value</div>
                            <div className="text-2xl font-bold">$0</div>
                            <div className="text-sm text-muted">No project yet</div>
                        </div>
                        <div className="card">
                            <div className="text-muted text-sm mb-1">Variations</div>
                            <div className="text-2xl font-bold text-warning">$0</div>
                            <div className="text-sm text-muted">0 variations</div>
                        </div>
                        <div className="card">
                            <div className="text-muted text-sm mb-1">Inspections</div>
                            <div className="text-2xl font-bold">0/0</div>
                            <div className="text-sm text-muted">None scheduled</div>
                        </div>
                        <div className="card">
                            <div className="text-muted text-sm mb-1">Defects</div>
                            <div className="text-2xl font-bold text-success">0</div>
                            <div className="text-sm text-muted">Open issues</div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        <Link href="/guardian/projects/new" className="card hover:border-primary transition-colors">
                            <span className="text-3xl mb-3 block">➕</span>
                            <h3 className="font-bold mb-2">Create New Project</h3>
                            <p className="text-muted text-sm">
                                Start tracking a new home construction project
                            </p>
                        </Link>
                        <Link href="/guardian/checklists" className="card hover:border-primary transition-colors">
                            <span className="text-3xl mb-3 block">📋</span>
                            <h3 className="font-bold mb-2">Pre-Drywall Checklist</h3>
                            <p className="text-muted text-sm">
                                Document insulation and rough-in before plasterboard
                            </p>
                        </Link>
                        <Link href="/guardian/variations" className="card hover:border-primary transition-colors">
                            <span className="text-3xl mb-3 block">💰</span>
                            <h3 className="font-bold mb-2">Log Variation</h3>
                            <p className="text-muted text-sm">
                                Record a variation order with digital signature
                            </p>
                        </Link>
                    </div>

                    {/* Getting Started */}
                    <div className="card border-primary/30 bg-primary/5">
                        <h2 className="text-xl font-bold mb-4">🚀 Getting Started</h2>
                        <ol className="list-decimal list-inside space-y-2 text-muted">
                            <li>Create a new project with your builder and contract details</li>
                            <li>Upload your building contract (we&apos;ll extract key dates and inclusions)</li>
                            <li>Start tracking inspections, variations, and defects</li>
                            <li>Generate reports for Fair Trading or NCAT if needed</li>
                        </ol>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-border py-8 px-6 text-center text-muted">
                <p>© 2026 VedaWell Tools. Free & Open Source.</p>
            </footer>
        </div>
    );
}
