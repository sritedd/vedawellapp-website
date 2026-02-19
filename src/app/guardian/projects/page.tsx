import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProjectsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/guardian/login");
    }

    // Fetch projects
    const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return (
        <>
            {/* Guardian Sub-Navigation */}
            <div className="border-b border-border bg-muted/5">
                <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6">
                    <Link href="/guardian/dashboard" className="text-muted hover:text-foreground">
                        Dashboard
                    </Link>
                    <Link href="/guardian/projects" className="font-semibold text-primary">
                        Projects
                    </Link>
                    <Link href="/guardian/journey" className="text-muted hover:text-foreground">
                        📚 Learn
                    </Link>
                </div>
            </div>

            <main className="flex-1 py-12 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold">My Projects</h1>
                        <Link
                            href="/guardian/projects/new"
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                        >
                            + New Project
                        </Link>
                    </div>

                    {!projects || projects.length === 0 ? (
                        <div className="bg-card border border-border rounded-xl p-12 text-center">
                            <span className="text-5xl mb-4 block">🏗️</span>
                            <h3 className="text-xl font-bold mb-2">No Projects Yet</h3>
                            <p className="text-muted mb-6">Start tracking your home build by creating your first project.</p>
                            <Link
                                href="/guardian/projects/new"
                                className="inline-flex px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                            >
                                Create First Project
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {projects.map((project: any) => (
                                <Link
                                    key={project.id}
                                    href={`/guardian/projects/${project.id}`}
                                    className="block p-6 bg-card border border-border rounded-xl hover:border-primary transition-colors group"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                                                {project.name}
                                            </h3>
                                            <p className="text-muted mb-4">{project.builder_name || 'Owner Builder'}</p>

                                            <div className="flex gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    📍 {project.address}
                                                </span>
                                                {project.start_date && (
                                                    <span className="flex items-center gap-1">
                                                        📅 Started: {new Date(project.start_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wider border ${project.status === 'active' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                                project.status === 'completed' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                                    'bg-gray-500/10 text-gray-600 border-gray-500/20'
                                                }`}>
                                                {project.status}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
