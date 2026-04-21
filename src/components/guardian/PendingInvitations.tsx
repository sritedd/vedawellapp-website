"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/guardian/Toast";

interface PendingInvite {
  id: string;
  project_id: string;
  role: string;
  invited_email: string;
  created_at: string;
  projects: { name: string | null } | null;
}

export default function PendingInvitations() {
  const { toast } = useToast();
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      setLoading(false);
      return;
    }

    const email = user.email.toLowerCase();
    const { data, error } = await supabase
      .from("project_members")
      .select("id, project_id, role, invited_email, created_at, projects:projects(name)")
      .eq("status", "pending")
      .or(`user_id.eq.${user.id},invited_email.eq.${email}`);

    if (error) {
      console.error("[PendingInvitations] load error:", error.message);
      setLoading(false);
      return;
    }

    setInvites((data ?? []) as unknown as PendingInvite[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const respond = async (memberId: string, action: "accept" | "decline") => {
    setBusyId(memberId);
    try {
      const res = await fetch("/api/guardian/project-members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data?.error || "Could not update invitation.", "error");
        return;
      }
      setInvites((prev) => prev.filter((i) => i.id !== memberId));
    } finally {
      setBusyId(null);
    }
  };

  if (loading || invites.length === 0) return null;

  return (
    <div className="card border-yellow-500/30 bg-yellow-500/5">
      <h3 className="font-bold text-sm mb-3">
        Pending Invitations ({invites.length})
      </h3>
      <div className="space-y-2">
        {invites.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center justify-between gap-3 py-2 border-b border-border/40 last:border-0"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">
                {inv.projects?.name || "A building project"}
              </div>
              <div className="text-xs text-muted">
                Invited as <strong>{inv.role}</strong>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => respond(inv.id, "accept")}
                disabled={busyId === inv.id}
                className="px-3 py-1.5 text-xs font-medium rounded bg-primary text-white hover:opacity-90 disabled:opacity-50"
              >
                Accept
              </button>
              <button
                onClick={() => respond(inv.id, "decline")}
                disabled={busyId === inv.id}
                className="px-3 py-1.5 text-xs font-medium rounded border border-border hover:bg-muted/10 disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
