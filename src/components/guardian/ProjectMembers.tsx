"use client";

import { useState, useEffect, useCallback } from "react";

interface Member {
  id: string;
  invited_email: string;
  role: string;
  status: string;
  accepted_at: string | null;
  created_at: string;
}

const ROLE_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  owner: { label: "Owner", color: "bg-primary/10 text-primary", desc: "Full control" },
  collaborator: { label: "Collaborator", color: "bg-green-500/10 text-green-700", desc: "Can add & edit" },
  viewer: { label: "Viewer", color: "bg-blue-500/10 text-blue-700", desc: "Read-only" },
};

export default function ProjectMembers({ projectId }: { projectId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/guardian/project-members?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error("[ProjectMembers] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setSending(true);
    setMessage(null);

    try {
      const res = await fetch("/api/guardian/project-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, email: inviteEmail.trim(), role: inviteRole }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: `Invited ${inviteEmail}` });
        setInviteEmail("");
        fetchMembers();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to invite" });
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong" });
    } finally {
      setSending(false);
    }
  };

  const handleRemove = async (memberId: string, email: string) => {
    if (!confirm(`Remove ${email} from this project?`)) return;

    try {
      const res = await fetch("/api/guardian/project-members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, projectId }),
      });

      if (res.ok) {
        fetchMembers();
        setMessage({ type: "success", text: `Removed ${email}` });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to remove member" });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-lg mb-1">Team Members</h3>
        <p className="text-sm text-muted">
          Invite your partner, family, or solicitor to view or collaborate on this project.
        </p>
      </div>

      {/* Invite Form */}
      <form onSubmit={handleInvite} className="card space-y-3">
        <h4 className="font-medium text-sm">Invite Someone</h4>
        <div className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Email address"
            required
            className="flex-1 px-3 py-2 text-sm rounded border border-border bg-background"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="px-3 py-2 text-sm rounded border border-border bg-background"
          >
            <option value="viewer">Viewer (read-only)</option>
            <option value="collaborator">Collaborator (add & edit)</option>
          </select>
          <button
            type="submit"
            disabled={sending || !inviteEmail.trim()}
            className="px-4 py-2 text-sm font-medium rounded bg-primary text-white hover:opacity-90 disabled:opacity-50"
          >
            {sending ? "Sending..." : "Invite"}
          </button>
        </div>

        {message && (
          <p className={`text-sm px-3 py-2 rounded ${
            message.type === "success" ? "bg-green-500/10 text-green-700" : "bg-red-500/10 text-red-600"
          }`}>
            {message.text}
          </p>
        )}
      </form>

      {/* Members List */}
      {members.length === 0 ? (
        <p className="text-sm text-muted text-center py-4">
          No team members yet. Invite someone to get started.
        </p>
      ) : (
        <div className="space-y-2">
          {members.map((member) => {
            const roleInfo = ROLE_LABELS[member.role] || ROLE_LABELS.viewer;
            return (
              <div key={member.id} className="card flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted/20 flex items-center justify-center text-sm font-bold uppercase">
                    {member.invited_email.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{member.invited_email}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleInfo.color}`}>
                        {roleInfo.label}
                      </span>
                      <span className={`text-xs ${
                        member.status === "accepted" ? "text-green-600" :
                        member.status === "pending" ? "text-yellow-600" : "text-red-600"
                      }`}>
                        {member.status === "accepted" ? "Active" :
                         member.status === "pending" ? "Pending invite" : "Declined"}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(member.id, member.invited_email)}
                  className="text-xs text-muted hover:text-red-600 px-2 py-1 rounded border border-transparent hover:border-red-200 transition-colors"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Roles explanation */}
      <div className="text-xs text-muted space-y-1 p-3 bg-muted/5 rounded border border-border">
        <div><strong>Viewer</strong> — Can see all project data (defects, payments, photos) but cannot edit.</div>
        <div><strong>Collaborator</strong> — Can add defects, log communications, upload photos. Cannot delete the project or manage members.</div>
        <div><strong>Owner</strong> — Full control (that&apos;s you).</div>
      </div>
    </div>
  );
}
