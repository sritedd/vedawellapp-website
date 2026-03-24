import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

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

/** GET — list members for a project */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabase(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const projectId = new URL(request.url).searchParams.get("projectId");
    if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

    // Verify user owns the project or is a member
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      // Check if they're a member
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

/** POST — invite a member */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabase(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const { projectId, email, role } = await request.json();
    if (!projectId || !email) {
      return NextResponse.json({ error: "projectId and email are required" }, { status: 400 });
    }

    const validRoles = ["collaborator", "viewer"];
    const memberRole = validRoles.includes(role) ? role : "viewer";

    // Verify ownership
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Only the project owner can invite members" }, { status: 403 });
    }

    // Prevent self-invite
    if (email.toLowerCase() === user.email?.toLowerCase()) {
      return NextResponse.json({ error: "You cannot invite yourself" }, { status: 400 });
    }

    // Check if already invited
    const { data: existing } = await supabase
      .from("project_members")
      .select("id, status")
      .eq("project_id", projectId)
      .eq("invited_email", email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json({
        error: existing.status === "accepted" ? "This person is already a member" : "Invitation already sent",
      }, { status: 409 });
    }

    // Look up if the invited email has a profile
    const { data: invitedProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    const { data: member, error } = await supabase
      .from("project_members")
      .insert({
        project_id: projectId,
        user_id: invitedProfile?.id || null,
        invited_email: email.toLowerCase(),
        role: memberRole,
        invited_by: user.id,
        status: invitedProfile ? "accepted" : "pending",
        accepted_at: invitedProfile ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      console.error("[project-members] Insert error:", error);
      return NextResponse.json({ error: "Failed to send invitation" }, { status: 500 });
    }

    return NextResponse.json({ member });
  } catch (err) {
    console.error("[project-members] POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/** DELETE — remove a member */
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

    // Verify ownership
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Only the project owner can remove members" }, { status: 403 });
    }

    await supabase.from("project_members").delete().eq("id", memberId).eq("project_id", projectId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[project-members] DELETE error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
