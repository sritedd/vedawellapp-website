import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import AdminUserManager from "@/components/guardian/AdminUserManager";
import AdminAnnouncementManager from "@/components/guardian/AdminAnnouncementManager";
import AdminUserSearch from "@/components/guardian/AdminUserSearch";
import AdminSupportInbox from "@/components/guardian/AdminSupportInbox";
import { getAdminConversations } from "@/app/guardian/actions";

function StatCard({ label, value, sub, color = "" }: { label: string; value: string | number; sub?: string; color?: string }) {
    return (
        <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-sm text-muted mb-1">{label}</p>
            <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
            {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
        </div>
    );
}

function MiniBar({ value, max, color = "bg-primary" }: { value: number; max: number; color?: string }) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div className="h-2 bg-border rounded-full overflow-hidden w-full">
            <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
        </div>
    );
}

export default async function AdminPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
        redirect("/guardian/dashboard");
    }

    // ── Profiles stats ──────────────────────────────────────────────
    const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

    const { count: proUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("subscription_tier", "guardian_pro");

    const { count: trialUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("subscription_tier", "trial");

    const { count: activeUsers7d } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("last_seen_at", new Date(Date.now() - 7 * 864e5).toISOString());

    const { count: activeUsers30d } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("last_seen_at", new Date(Date.now() - 30 * 864e5).toISOString());

    // ── Email subscribers ────────────────────────────────────────────
    const { count: emailSubs } = await supabase
        .from("email_subscribers")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

    // ── Signup trend (last 30 days) ──────────────────────────────────
    const thirtyDaysAgo = new Date(Date.now() - 30 * 864e5).toISOString();
    const { data: recentSignups } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: true });

    // Group signups by date
    const signupsByDate: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 864e5);
        signupsByDate[d.toISOString().slice(0, 10)] = 0;
    }
    for (const s of recentSignups ?? []) {
        const dateKey = new Date(s.created_at).toISOString().slice(0, 10);
        if (dateKey in signupsByDate) signupsByDate[dateKey]++;
    }
    const signupDays = Object.entries(signupsByDate);
    const maxSignups = Math.max(...signupDays.map(([, v]) => v), 1);

    // ── Guardian feature stats ───────────────────────────────────────
    const { count: totalProjects } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true });

    const { data: projectsByStatus } = await supabase
        .from("projects")
        .select("status");

    const statusCounts: Record<string, number> = {};
    for (const p of projectsByStatus ?? []) {
        statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1;
    }

    const { data: projectValues } = await supabase
        .from("projects")
        .select("contract_value");
    const totalContractValue = (projectValues ?? []).reduce((sum: number, p: { contract_value: number | null }) => sum + (p.contract_value || 0), 0);

    const { count: totalDefects } = await supabase
        .from("defects")
        .select("*", { count: "exact", head: true });

    const { count: openDefects } = await supabase
        .from("defects")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");

    const { data: defectsBySeverity } = await supabase
        .from("defects")
        .select("severity")
        .eq("status", "open");

    const sevCounts: Record<string, number> = {};
    for (const d of defectsBySeverity ?? []) {
        sevCounts[d.severity] = (sevCounts[d.severity] ?? 0) + 1;
    }

    const { count: totalVariations } = await supabase
        .from("variations")
        .select("*", { count: "exact", head: true });

    const { count: approvedVariations } = await supabase
        .from("variations")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved");

    const { count: totalCertifications } = await supabase
        .from("certifications")
        .select("*", { count: "exact", head: true });

    const { count: totalInspections } = await supabase
        .from("inspections")
        .select("*", { count: "exact", head: true });

    const { count: totalDocuments } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true });

    // ── Conversion funnel ────────────────────────────────────────────
    const { count: usersWithProjects } = await supabase
        .from("projects")
        .select("user_id", { count: "exact", head: true });
    // Approximate unique users with projects
    const { data: uniqueProjectUsers } = await supabase
        .from("projects")
        .select("user_id");
    const uniqueProjectUserCount = new Set((uniqueProjectUsers ?? []).map((p: { user_id: string }) => p.user_id)).size;

    const funnelSteps = [
        { label: "Email Subscribers", value: emailSubs ?? 0, color: "bg-blue-500" },
        { label: "Registered Users", value: totalUsers ?? 0, color: "bg-indigo-500" },
        { label: "Created Project", value: uniqueProjectUserCount, color: "bg-purple-500" },
        { label: "Guardian Pro", value: (proUsers ?? 0) + (trialUsers ?? 0), color: "bg-green-500" },
    ];
    const funnelMax = Math.max(...funnelSteps.map(s => s.value), 1);

    // ── Active announcement ──────────────────────────────────────────
    let activeAnnouncement: { id: string; message: string; type: string; created_at: string } | null = null;
    try {
        const { data: annData } = await supabase
            .from("announcements")
            .select("id, message, type, created_at")
            .eq("active", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
        activeAnnouncement = annData;
    } catch { /* table may not exist */ }

    // ── All users (for management) ──────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let allUsersWithProjects: any[] = [];
    try {
        const { data: allUsers } = await supabase
            .from("profiles")
            .select("id, email, full_name, subscription_tier, is_admin, trial_ends_at, last_seen_at, created_at")
            .order("created_at", { ascending: false })
            .limit(100);

        const { data: projectCounts } = await supabase
            .from("projects")
            .select("user_id");

        const projectCountMap: Record<string, number> = {};
        for (const p of projectCounts ?? []) {
            projectCountMap[p.user_id] = (projectCountMap[p.user_id] ?? 0) + 1;
        }

        allUsersWithProjects = (allUsers ?? []).map((u: { id: string; email: string | null; full_name: string | null; subscription_tier: string | null; is_admin: boolean; trial_ends_at: string | null; last_seen_at: string | null; created_at: string }) => ({
            ...u,
            project_count: projectCountMap[u.id] ?? 0,
        }));
    } catch { /* column may not exist if migration not run */ }

    // ── Support conversations ──────────────────────────────────────
    let supportConversations: Awaited<ReturnType<typeof getAdminConversations>>["conversations"] = [];
    try {
        const result = await getAdminConversations();
        supportConversations = result.conversations;
    } catch { /* table may not exist */ }

    // ── Top email subscriber sources ─────────────────────────────────
    let topSources: [string, number][] = [];
    try {
        const { data: subSources } = await supabase
            .from("email_subscribers")
            .select("source")
            .eq("status", "active")
            .order("source");

        const sourceCounts: Record<string, number> = {};
        for (const { source } of subSources ?? []) {
            sourceCounts[source] = (sourceCounts[source] ?? 0) + 1;
        }
        topSources = Object.entries(sourceCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);
    } catch { /* table may not exist */ }

    // ── Tool usage leaderboard ───────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let topTools: any[] | null = null;
    try {
        const { data: toolData } = await supabase
            .from("tool_usage")
            .select("tool_slug, use_count, last_used_at")
            .order("use_count", { ascending: false })
            .limit(15);
        topTools = toolData;
    } catch { /* table may not exist */ }

    const fmt = (d: string | null) =>
        d ? new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

    const fmtMoney = (v: number) => v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(0)}K` : `$${v.toFixed(0)}`;

    const mrr = (proUsers ?? 0) * 14.99;

    return (
        <div className="py-10 px-6">
            <div className="max-w-6xl mx-auto space-y-10">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold">Admin Dashboard</h1>
                        <p className="text-muted text-sm mt-1">VedaWell — live Supabase data</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/api/admin/export?type=users"
                            className="text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-muted/10 transition-colors font-medium"
                        >
                            Export Users CSV
                        </Link>
                        <Link
                            href="/api/admin/export?type=subscribers"
                            className="text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-muted/10 transition-colors font-medium"
                        >
                            Export Subscribers CSV
                        </Link>
                        <span className="text-xs bg-yellow-500/10 text-yellow-600 border border-yellow-500/30 px-3 py-1.5 rounded-full font-semibold">
                            Admin
                        </span>
                    </div>
                </div>

                {/* ═══ Revenue ═══ */}
                <section>
                    <h2 className="text-lg font-bold mb-4">Revenue</h2>
                    <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-4">
                        <StatCard label="Guardian Pro" value={proUsers ?? 0} sub="paying subscribers" color="text-green-600" />
                        <StatCard label="On Trial" value={trialUsers ?? 0} sub="free trial active" color="text-blue-600" />
                        <StatCard label="Est. MRR (AUD)" value={`$${mrr.toFixed(2)}`} sub={`${proUsers ?? 0} x $14.99`} color="text-primary" />
                        <StatCard label="Est. ARR (AUD)" value={`$${(mrr * 12).toFixed(0)}`} sub="annualised" />
                        <StatCard label="Free Users" value={(totalUsers ?? 0) - (proUsers ?? 0) - (trialUsers ?? 0)} sub="on free tier" />
                    </div>
                </section>

                {/* ═══ Users ═══ */}
                <section>
                    <h2 className="text-lg font-bold mb-4">Users</h2>
                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="Total Registered" value={totalUsers ?? 0} sub="all time" />
                        <StatCard label="Active (7 days)" value={activeUsers7d ?? 0} sub="visited dashboard" />
                        <StatCard label="Active (30 days)" value={activeUsers30d ?? 0} sub="visited dashboard" />
                        <StatCard label="Email Subscribers" value={emailSubs ?? 0} sub="active newsletter" />
                    </div>
                </section>

                {/* ═══ Signup Trend (30 days) ═══ */}
                <section>
                    <h2 className="text-lg font-bold mb-2">Signup Trend</h2>
                    <p className="text-muted text-xs mb-3">Last 30 days — {(recentSignups ?? []).length} total signups</p>
                    <div className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-end gap-[2px] h-24">
                            {signupDays.map(([date, count]) => (
                                <div key={date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                    <div
                                        className="w-full bg-primary/80 rounded-t-sm min-h-[2px] transition-all hover:bg-primary"
                                        style={{ height: `${Math.max((count / maxSignups) * 100, 2)}%` }}
                                    />
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                                        {date.slice(5)}: {count}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] text-muted">
                            <span>{signupDays[0]?.[0]?.slice(5)}</span>
                            <span>{signupDays[Math.floor(signupDays.length / 2)]?.[0]?.slice(5)}</span>
                            <span>{signupDays[signupDays.length - 1]?.[0]?.slice(5)}</span>
                        </div>
                    </div>
                </section>

                {/* ═══ Conversion Funnel ═══ */}
                <section>
                    <h2 className="text-lg font-bold mb-4">Conversion Funnel</h2>
                    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                        {funnelSteps.map((step, i) => {
                            const prevValue = i > 0 ? funnelSteps[i - 1].value : null;
                            const convRate = prevValue && prevValue > 0 ? ((step.value / prevValue) * 100).toFixed(1) : null;
                            return (
                                <div key={step.label}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium">{step.label}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold">{step.value}</span>
                                            {convRate && (
                                                <span className="text-xs text-muted">({convRate}% from above)</span>
                                            )}
                                        </div>
                                    </div>
                                    <MiniBar value={step.value} max={funnelMax} color={step.color} />
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ═══ Guardian Feature Analytics ═══ */}
                <section>
                    <h2 className="text-lg font-bold mb-4">Guardian Feature Usage</h2>
                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <StatCard label="Total Projects" value={totalProjects ?? 0} sub={`${fmtMoney(totalContractValue)} contract value`} color="text-primary" />
                        <StatCard label="Defects Logged" value={totalDefects ?? 0} sub={`${openDefects ?? 0} open`} color={openDefects ? "text-red-600" : ""} />
                        <StatCard label="Variations" value={totalVariations ?? 0} sub={`${approvedVariations ?? 0} approved`} />
                        <StatCard label="Documents" value={totalDocuments ?? 0} sub={`${totalCertifications ?? 0} certs, ${totalInspections ?? 0} inspections`} />
                    </div>

                    {/* Project status breakdown */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-card border border-border rounded-xl p-5">
                            <h3 className="text-sm font-bold mb-3">Projects by Status</h3>
                            {Object.keys(statusCounts).length === 0 ? (
                                <p className="text-muted text-sm">No projects yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
                                        <div key={status} className="flex items-center justify-between">
                                            <span className="text-sm capitalize">{status}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold">{count}</span>
                                                <div className="w-20">
                                                    <MiniBar value={count} max={totalProjects ?? 1} color={
                                                        status === "active" ? "bg-green-500" :
                                                        status === "completed" ? "bg-blue-500" :
                                                        status === "paused" ? "bg-yellow-500" :
                                                        "bg-muted"
                                                    } />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-card border border-border rounded-xl p-5">
                            <h3 className="text-sm font-bold mb-3">Open Defects by Severity</h3>
                            {Object.keys(sevCounts).length === 0 ? (
                                <p className="text-muted text-sm">No open defects</p>
                            ) : (
                                <div className="space-y-2">
                                    {["critical", "major", "minor"].filter(s => sevCounts[s]).map(severity => (
                                        <div key={severity} className="flex items-center justify-between">
                                            <span className={`text-sm capitalize font-medium ${
                                                severity === "critical" ? "text-red-600" :
                                                severity === "major" ? "text-orange-600" :
                                                "text-yellow-600"
                                            }`}>{severity}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold">{sevCounts[severity]}</span>
                                                <div className="w-20">
                                                    <MiniBar value={sevCounts[severity]} max={openDefects ?? 1} color={
                                                        severity === "critical" ? "bg-red-500" :
                                                        severity === "major" ? "bg-orange-500" :
                                                        "bg-yellow-500"
                                                    } />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* ═══ Announcements ═══ */}
                <section>
                    <h2 className="text-lg font-bold mb-2">Announcements & Maintenance</h2>
                    <p className="text-muted text-sm mb-4">Set a banner visible to all Guardian users, or run maintenance tasks.</p>
                    {activeAnnouncement && (
                        <div className={`mb-4 p-3 rounded-lg text-sm font-medium border ${
                            activeAnnouncement.type === "warning"
                                ? "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                                : activeAnnouncement.type === "success"
                                ? "bg-green-500/10 text-green-700 border-green-500/20"
                                : "bg-blue-500/10 text-blue-700 border-blue-500/20"
                        }`}>
                            Active: &quot;{activeAnnouncement.message}&quot;
                            <span className="text-xs ml-2 opacity-70">({activeAnnouncement.type})</span>
                        </div>
                    )}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <AdminAnnouncementManager />
                    </div>
                </section>

                {/* ═══ User Management ═══ */}
                <section>
                    <h2 className="text-lg font-bold mb-2">User Management</h2>
                    <p className="text-muted text-sm mb-4">Grant free trials, upgrade users, or revoke access by email.</p>
                    <div className="bg-card border border-border rounded-xl p-6">
                        <AdminUserManager />
                    </div>
                </section>

                {/* ═══ All Users Table (searchable) ═══ */}
                <section>
                    <h2 className="text-lg font-bold mb-4">All Users ({allUsersWithProjects.length})</h2>
                    <div className="bg-card border border-border rounded-xl p-4">
                        <AdminUserSearch users={allUsersWithProjects} />
                    </div>
                </section>

                {/* ═══ Support Inbox ═══ */}
                <section>
                    <h2 className="text-lg font-bold mb-2">
                        Support Inbox
                        {supportConversations.length > 0 && (
                            <span className="ml-2 text-sm font-normal text-muted">
                                {supportConversations.length} conversation(s)
                                {supportConversations.reduce((s, c) => s + c.unread_count, 0) > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                                        {supportConversations.reduce((s, c) => s + c.unread_count, 0)} new
                                    </span>
                                )}
                            </span>
                        )}
                    </h2>
                    <p className="text-muted text-sm mb-4">View and reply to user support messages.</p>
                    <AdminSupportInbox initial={supportConversations} />
                </section>

                {/* ═══ Tool Usage Leaderboard ═══ */}
                <section>
                    <h2 className="text-lg font-bold mb-2">Tool Usage Leaderboard</h2>
                    <p className="text-muted text-sm mb-4">Populated once <code className="bg-muted/20 px-1 rounded">trackToolUse</code> events fire. Run schema_v4_analytics.sql migration first.</p>
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/10 text-muted text-left">
                                <tr>
                                    <th className="px-4 py-3 font-medium">#</th>
                                    <th className="px-4 py-3 font-medium">Tool</th>
                                    <th className="px-4 py-3 font-medium">Uses</th>
                                    <th className="px-4 py-3 font-medium">Last used</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {(topTools ?? []).length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-6 text-center text-muted">
                                            No tool usage data yet
                                        </td>
                                    </tr>
                                ) : (
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    (topTools ?? []).map((t: any, i: number) => (
                                        <tr key={t.tool_slug} className="hover:bg-muted/5">
                                            <td className="px-4 py-3 text-muted">{i + 1}</td>
                                            <td className="px-4 py-3 font-medium">{t.tool_slug}</td>
                                            <td className="px-4 py-3 font-bold">{t.use_count.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-muted">{fmt(t.last_used_at)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* ═══ Email Subscriber Sources ═══ */}
                <section>
                    <h2 className="text-lg font-bold mb-4">Email Subscriber Sources</h2>
                    {topSources.length === 0 ? (
                        <p className="text-muted text-sm">No subscribers yet.</p>
                    ) : (
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/10 text-muted text-left">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Source</th>
                                        <th className="px-4 py-3 font-medium">Subscribers</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {topSources.map(([source, count]) => (
                                        <tr key={source} className="hover:bg-muted/5">
                                            <td className="px-4 py-3 font-mono text-xs">{source}</td>
                                            <td className="px-4 py-3 font-bold">{count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
