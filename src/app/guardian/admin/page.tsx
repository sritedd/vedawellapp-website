import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Only these emails can access the admin page
const ADMIN_EMAILS = ["sridhar.kothandam@gmail.com", "support@vedawellapp.com"];

function StatCard({ label, value, sub, color = "" }: { label: string; value: string | number; sub?: string; color?: string }) {
    return (
        <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-sm text-muted mb-1">{label}</p>
            <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
            {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
        </div>
    );
}

export default async function AdminPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
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

    // ── Recent sign-ups (last 10) ────────────────────────────────────
    const { data: recentUsers } = await supabase
        .from("profiles")
        .select("id, email, subscription_tier, last_seen_at, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

    // ── Top email subscriber sources ─────────────────────────────────
    const { data: subSources } = await supabase
        .from("email_subscribers")
        .select("source")
        .eq("status", "active")
        .order("source");

    const sourceCounts: Record<string, number> = {};
    for (const { source } of subSources ?? []) {
        sourceCounts[source] = (sourceCounts[source] ?? 0) + 1;
    }
    const topSources = Object.entries(sourceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    // ── Tool usage leaderboard ───────────────────────────────────────
    const { data: topTools } = await supabase
        .from("tool_usage")
        .select("tool_slug, use_count, last_used_at")
        .order("use_count", { ascending: false })
        .limit(15);

    const fmt = (d: string | null) =>
        d ? new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

    const mrr = (proUsers ?? 0) * 14.99;

    return (
        <div className="py-10 px-6">
            <div className="max-w-6xl mx-auto space-y-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold">Admin Dashboard</h1>
                        <p className="text-muted text-sm mt-1">VedaWell — live Supabase data</p>
                    </div>
                    <span className="text-xs bg-yellow-500/10 text-yellow-600 border border-yellow-500/30 px-3 py-1 rounded-full font-semibold">
                        Private — Admin only
                    </span>
                </div>

                {/* Revenue snapshot */}
                <section>
                    <h2 className="text-lg font-bold mb-4">Revenue</h2>
                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="Guardian Pro Users" value={proUsers ?? 0} sub="paying subscribers" color="text-green-600" />
                        <StatCard label="Est. MRR (AUD)" value={`$${mrr.toFixed(2)}`} sub={`${proUsers ?? 0} × $14.99`} color="text-primary" />
                        <StatCard label="Est. ARR (AUD)" value={`$${(mrr * 12).toFixed(0)}`} sub="annualised" />
                        <StatCard label="Free Users" value={(totalUsers ?? 0) - (proUsers ?? 0)} sub="on free tier" />
                    </div>
                </section>

                {/* User activity */}
                <section>
                    <h2 className="text-lg font-bold mb-4">Users</h2>
                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="Total Registered" value={totalUsers ?? 0} sub="all time" />
                        <StatCard label="Active (7 days)" value={activeUsers7d ?? 0} sub="visited dashboard" />
                        <StatCard label="Active (30 days)" value={activeUsers30d ?? 0} sub="visited dashboard" />
                        <StatCard label="Email Subscribers" value={emailSubs ?? 0} sub="active newsletter" />
                    </div>
                </section>

                {/* Recent sign-ups */}
                <section>
                    <h2 className="text-lg font-bold mb-4">Recent Sign-ups</h2>
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/10 text-muted text-left">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Email</th>
                                    <th className="px-4 py-3 font-medium">Tier</th>
                                    <th className="px-4 py-3 font-medium">Signed up</th>
                                    <th className="px-4 py-3 font-medium">Last seen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {(recentUsers ?? []).length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-6 text-center text-muted">No users yet</td>
                                    </tr>
                                ) : (
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    (recentUsers ?? []).map((u: any) => (
                                        <tr key={u.id} className="hover:bg-muted/5">
                                            <td className="px-4 py-3 font-mono text-xs truncate max-w-[200px]">{u.email ?? "—"}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                    u.subscription_tier === "guardian_pro"
                                                        ? "bg-green-500/10 text-green-600"
                                                        : "bg-muted/20 text-muted"
                                                }`}>
                                                    {u.subscription_tier ?? "free"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-muted">{fmt(u.created_at)}</td>
                                            <td className="px-4 py-3 text-muted">{fmt(u.last_seen_at)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Tool usage leaderboard */}
                <section>
                    <h2 className="text-lg font-bold mb-2">Tool Usage Leaderboard</h2>
                    <p className="text-muted text-sm mb-4">Populated once <code className="bg-muted/20 px-1 rounded">GA4 tool_used</code> events are wired up. Run the schema_v4_analytics.sql migration first.</p>
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
                                            No tool usage data yet — wire up the <code className="bg-muted/20 px-1 rounded">trackToolUse</code> events
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

                {/* Email subscriber sources */}
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
