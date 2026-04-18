import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Resend } from "resend";

function createSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function sendInvitationEmail(params: {
  toEmail: string;
  projectName: string;
  inviterName: string;
  role: string;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  try {
    const resend = new Resend(key);
    const dashboardUrl = "https://vedawellapp.com/guardian/dashboard";
    await resend.emails.send({
      from: "HomeGuardian <notifications@vedawellapp.com>",
      to: params.toEmail,
      subject: `You were invited to "${params.projectName}" on HomeGuardian`,
      html: `
        <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
          <h2 style="margin:0 0 12px">You've been invited</h2>
          <p>${params.inviterName || "A HomeGuardian user"} invited you to collaborate on their building project <strong>${params.projectName}</strong> as a <strong>${params.role}</strong>.</p>
          <p>HomeGuardian is an Australian construction monitoring tool — defects, payments, certificates, and site visits all in one place.</p>
          <p style="margin:24px 0">
            <a href="${dashboardUrl}" style="background:#0f766e;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Open your dashboard</a>
          </p>
          <p style="color:#555;font-size:13px">Sign in with this email (${params.toEmail}) to accept or decline the invitation from your dashboard.</p>
          <hr style="border:0;border-top:1px solid #e5e7eb;margin:20px 0" />
          <p style="color:#888;font-size:12px">Didn't expect this? You can safely ignore the email — the inviter won't be notified.</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("[project-members] Resend failed:", e instanceof Error ? e.message : e);
  }
}

/** GET — list members for a project */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabase(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const projectId = new URL(request.url).searchParams.get("projectId");
    if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      const { data: membership } = await supabase
        .from("project_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .eq("status", "accepted")
        .single();

      if (!membership) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const { data: members } = await supabase
      .from("project_members")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    return NextResponse.json({ members: members || [] });
  } catch (err) {
    console.error("[project-members] GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/** POST — invite a member (always pending, requires explicit accept) */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabase(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const { projectId, email: rawEmail, role } = await request.json();
    if (!projectId || !rawEmail) {
      return NextResponse.json({ error: "projectId and email are required" }, { status: 400 });
    }

    const email = String(rawEmail).trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const validRoles = ["collaborator", "viewer"];
    const memberRole = validRoles.includes(role) ? role : "viewer";

    const { data: project } = await supabase
      .from("projects")
      .select("id, name")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Only the project owner can invite members" }, { status: 403 });
    }

    if (email === user.email?.toLowerCase()) {
      return NextResponse.json({ error: "You cannot invite yourself" }, { status: 400 });
    }

    // Soft rate limit: max 10 pending invites per project
    const { count: pendingCount } = await supabase
      .from("project_members")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("status", "pending");
    if ((pendingCount ?? 0) >= 10) {
      return NextResponse.json({ error: "Too many pending invitations (max 10 per project)" }, { status: 429 });
    }

    const { data: existing } = await supabase
      .from("project_members")
      .select("id, status")
      .eq("project_id", projectId)
      .eq("invited_email", email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        error: existing.status === "accepted" ? "This person is already a member" : "Invitation already sent",
      }, { status: 409 });
    }

    // If invitee already has a profile, link the FK so their dashboard surfaces
    // the invite. Status is ALWAYS "pending" — consent is mandatory.
    const { data: invitedProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    const { data: member, error } = await supabase
      .from("project_members")
      .insert({
        project_id: projectId,
        user_id: invitedProfile?.id ?? null,
        invited_email: email,
        role: memberRole,
        invited_by: user.id,
        status: "pending",
        accepted_at: null,
      })
      .select()
      .single();

    if (error) {
      console.error("[project-members] Insert error:", error);
      return NextResponse.json({ error: "Failed to send invitation" }, { status: 500 });
    }

    // Fire-and-forget email notification. Don't block on email failure.
    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    void sendInvitationEmail({
      toEmail: email,
      projectName: project.name || "your building project",
      inviterName: inviterProfile?.full_name || user.email || "",
      role: memberRole,
    });

    return NextResponse.json({ member });
  } catch (err) {
    console.error("[project-members] POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/** PATCH — invited user accepts or declines their own pending invitation */
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabase(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const { memberId, action } = await request.json();
    if (!memberId || !["accept", "decline"].includes(action)) {
      return NextResponse.json({ error: "memberId and action (accept|decline) required" }, { status: 400 });
    }

    const userEmail = user.email?.toLowerCase();
    if (!userEmail) {
      return NextResponse.json({ error: "User email missing" }, { status: 400 });
    }

    // Only the invited user may accept/decline — match by invited_email OR user_id.
    const { data: invite, error: loadErr } = await supabase
      .from("project_members")
      .select("id, invited_email, user_id, status")
      .eq("id", memberId)
      .maybeSingle();

    if (loadErr || !invite) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    const isOwnerOfInvite =
      (invite.user_id && invite.user_id === user.id) ||
      (invite.invited_email && invite.invited_email.toLowerCase() === userEmail);

    if (!isOwnerOfInvite) {
      return NextResponse.json({ error: "You cannot act on this invitation" }, { status: 403 });
    }

    if (invite.status !== "pending") {
      return NextResponse.json({ error: "Invitation is no longer pending" }, { status: 409 });
    }

    const updates =
      action === "accept"
        ? { status: "accepted", accepted_at: new Date().toISOString(), user_id: user.id }
        : { status: "declined", accepted_at: null };

    const { error: updateErr } = await supabase
      .from("project_members")
      .update(updates)
      .eq("id", memberId);

    if (updateErr) {
      console.error("[project-members] PATCH update error:", updateErr);
      return NextResponse.json({ error: "Failed to update invitation" }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: updates.status });
  } catch (err) {
    console.error("[project-members] PATCH error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/** DELETE — owner removes a member */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabase(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const { memberId, projectId } = await request.json();
    if (!memberId || !projectId) {
      return NextResponse.json({ error: "memberId and projectId required" }, { status: 400 });
    }

    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Only the project owner can remove members" }, { status: 403 });
    }

    const { error: delErr } = await supabase
      .from("project_members")
      .delete()
      .eq("id", memberId)
      .eq("project_id", projectId);

    if (delErr) {
      console.error("[project-members] DELETE error:", delErr);
      return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[project-members] DELETE error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
