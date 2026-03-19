"use client";

import React, { useState } from "react";
import { bypassEmailVerification, resetEmailVerification } from "@/app/guardian/actions";
import { bypassPhoneVerification, resetPhoneVerification } from "@/app/guardian/actions";

interface UserRow {
    id: string;
    email: string | null;
    full_name: string | null;
    subscription_tier: string | null;
    is_admin: boolean;
    trial_ends_at: string | null;
    last_seen_at: string | null;
    created_at: string;
    project_count?: number;
    phone?: string | null;
    phone_verified?: boolean;
    email_verified_override?: boolean;
}

const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export default function AdminUserSearch({ users }: { users: UserRow[] }) {
    const [search, setSearch] = useState("");
    const [tierFilter, setTierFilter] = useState<string>("all");
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [actionMsg, setActionMsg] = useState<{ email: string; text: string } | null>(null);

    const handleAction = async (email: string, action: (e: string) => Promise<{ error?: string | null; success?: boolean }>) => {
        setActionLoading(email);
        setActionMsg(null);
        const result = await action(email);
        setActionLoading(null);
        if (result.error) {
            setActionMsg({ email, text: `Error: ${result.error}` });
        } else {
            setActionMsg({ email, text: "Done! Reload to see changes." });
        }
    };

    const filtered = users.filter((u) => {
        const matchesSearch =
            !search ||
            (u.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
            (u.full_name ?? "").toLowerCase().includes(search.toLowerCase());
        const matchesTier =
            tierFilter === "all" ||
            (tierFilter === "admin" ? u.is_admin : u.subscription_tier === tierFilter);
        return matchesSearch && matchesTier;
    });

    return (
        <div>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by email or name..."
                    className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="px-3 py-2.5 rounded-lg border border-border bg-background text-sm"
                >
                    <option value="all">All tiers</option>
                    <option value="free">Free</option>
                    <option value="trial">Trial</option>
                    <option value="guardian_pro">Pro</option>
                    <option value="admin">Admins</option>
                </select>
            </div>

            <p className="text-xs text-muted mb-2">{filtered.length} user(s) shown</p>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-muted/10 text-muted text-left">
                        <tr>
                            <th className="px-4 py-3 font-medium">Email</th>
                            <th className="px-4 py-3 font-medium">Name</th>
                            <th className="px-4 py-3 font-medium">Tier</th>
                            <th className="px-4 py-3 font-medium">Projects</th>
                            <th className="px-4 py-3 font-medium">Trial ends</th>
                            <th className="px-4 py-3 font-medium">Phone</th>
                            <th className="px-4 py-3 font-medium">Email V.</th>
                            <th className="px-4 py-3 font-medium">Admin</th>
                            <th className="px-4 py-3 font-medium">Signed up</th>
                            <th className="px-4 py-3 font-medium">Last seen</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="px-4 py-6 text-center text-muted">No users match</td>
                            </tr>
                        ) : (
                            filtered.map((u) => {
                                const trialActive = u.trial_ends_at && new Date(u.trial_ends_at) > new Date();
                                const trialExpired = u.trial_ends_at && new Date(u.trial_ends_at) <= new Date();
                                return (<React.Fragment key={u.id}>
                                    <tr className="hover:bg-muted/5">
                                        <td className="px-4 py-3 font-mono text-xs truncate max-w-[200px]">{u.email ?? "—"}</td>
                                        <td className="px-4 py-3 text-xs">{u.full_name ?? "—"}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                u.subscription_tier === "guardian_pro"
                                                    ? "bg-green-500/10 text-green-600"
                                                    : u.subscription_tier === "trial"
                                                    ? trialActive
                                                        ? "bg-blue-500/10 text-blue-600"
                                                        : "bg-red-500/10 text-red-600"
                                                    : "bg-muted/20 text-muted"
                                            }`}>
                                                {u.subscription_tier === "trial" && trialExpired
                                                    ? "trial expired"
                                                    : u.subscription_tier ?? "free"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs font-bold">{u.project_count ?? 0}</td>
                                        <td className="px-4 py-3 text-xs text-muted">
                                            {u.trial_ends_at ? fmt(u.trial_ends_at) : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            {u.phone ? (
                                                <span className="flex items-center gap-1">
                                                    <span className="truncate max-w-[100px]">{u.phone}</span>
                                                    {u.phone_verified ? (
                                                        <span className="text-green-600" title="Verified">&#10003;</span>
                                                    ) : (
                                                        <span className="text-red-500" title="Not verified">&#10007;</span>
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="text-muted">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            {u.email_verified_override ? (
                                                <span className="text-green-600" title="Override active">&#10003; override</span>
                                            ) : (
                                                <span className="text-muted">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {u.is_admin && (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-600">
                                                    admin
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-muted text-xs">{fmt(u.created_at)}</td>
                                        <td className="px-4 py-3 text-muted text-xs">{fmt(u.last_seen_at)}</td>
                                    </tr>
                                    {/* Action row — expandable admin controls */}
                                    {actionMsg?.email === u.email && (
                                        <tr><td colSpan={10} className="px-4 py-2 text-xs text-center text-primary">{actionMsg.text}</td></tr>
                                    )}
                                    {!u.is_admin && u.email && (
                                        <tr className="bg-muted/5">
                                            <td colSpan={10} className="px-4 py-1.5">
                                                <div className="flex flex-wrap gap-2 text-xs">
                                                    {!u.phone_verified && (
                                                        <button
                                                            onClick={() => handleAction(u.email!, bypassPhoneVerification)}
                                                            disabled={actionLoading === u.email}
                                                            className="px-2 py-1 rounded bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 disabled:opacity-50"
                                                        >
                                                            Bypass Phone
                                                        </button>
                                                    )}
                                                    {u.phone_verified && (
                                                        <button
                                                            onClick={() => handleAction(u.email!, resetPhoneVerification)}
                                                            disabled={actionLoading === u.email}
                                                            className="px-2 py-1 rounded bg-red-500/10 text-red-600 hover:bg-red-500/20 disabled:opacity-50"
                                                        >
                                                            Reset Phone
                                                        </button>
                                                    )}
                                                    {!u.email_verified_override && (
                                                        <button
                                                            onClick={() => handleAction(u.email!, bypassEmailVerification)}
                                                            disabled={actionLoading === u.email}
                                                            className="px-2 py-1 rounded bg-green-500/10 text-green-600 hover:bg-green-500/20 disabled:opacity-50"
                                                        >
                                                            Bypass Email
                                                        </button>
                                                    )}
                                                    {u.email_verified_override && (
                                                        <button
                                                            onClick={() => handleAction(u.email!, resetEmailVerification)}
                                                            disabled={actionLoading === u.email}
                                                            className="px-2 py-1 rounded bg-red-500/10 text-red-600 hover:bg-red-500/20 disabled:opacity-50"
                                                        >
                                                            Reset Email Override
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>);
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
