"use server";

import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/** Call at the top of every authenticated Guardian server component to record last activity */
export async function touchLastSeen(userId: string) {
    const supabase = await createClient();
    await supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", userId);
}

export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();

    // Clear dev_mode cookie if it exists
    const cookieStore = await cookies();
    cookieStore.delete("dev_mode");

    redirect("/guardian/login");
}

/** Delete a project and all associated data. Only the project owner can delete. */
export async function deleteProject(projectId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    // Verify ownership before deletion
    const { data: project } = await supabase
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .eq("user_id", user.id)
        .single();

    if (!project) {
        return { error: "Project not found or access denied" };
    }

    // Clean up storage files for this project (evidence, documents, certificates)
    for (const bucket of ["evidence", "documents", "certificates"]) {
        const { data: files } = await supabase.storage
            .from(bucket)
            .list(projectId, { limit: 1000 });
        if (files && files.length > 0) {
            // List files recursively (including subdirectories)
            const filePaths = files.map((f: { name: string }) => `${projectId}/${f.name}`);
            await supabase.storage.from(bucket).remove(filePaths);
        }
        // Also check subdirectories (photos, defects, certs)
        for (const subdir of ["photos", "defects", "certs"]) {
            const { data: subFiles } = await supabase.storage
                .from(bucket)
                .list(`${projectId}/${subdir}`, { limit: 1000 });
            if (subFiles && subFiles.length > 0) {
                const subPaths = subFiles.map((f: { name: string }) => `${projectId}/${subdir}/${f.name}`);
                await supabase.storage.from(bucket).remove(subPaths);
            }
        }
    }

    // Delete related data (most have ON DELETE CASCADE, but be explicit for safety)
    await supabase.from("checklist_items").delete().in(
        "stage_id",
        (await supabase.from("stages").select("id").eq("project_id", projectId)).data?.map((s: { id: string }) => s.id) || []
    );
    await supabase.from("progress_photos").delete().eq("project_id", projectId);
    await supabase.from("communication_log").delete().eq("project_id", projectId);
    await supabase.from("documents").delete().eq("project_id", projectId);
    await supabase.from("inspections").delete().eq("project_id", projectId);
    await supabase.from("weekly_checkins").delete().eq("project_id", projectId);
    await supabase.from("stages").delete().eq("project_id", projectId);
    await supabase.from("variations").delete().eq("project_id", projectId);
    await supabase.from("defects").delete().eq("project_id", projectId);
    await supabase.from("certifications").delete().eq("project_id", projectId);

    // Delete the project itself
    const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId)
        .eq("user_id", user.id);

    if (error) {
        return { error: error.message };
    }

    redirect("/guardian/projects");
}

/** Update project details. Only the project owner can update. */
export async function updateProject(projectId: string, updates: {
    name?: string;
    address?: string;
    builder_name?: string;
    builder_license_number?: string;
    builder_abn?: string;
    hbcf_policy_number?: string;
    insurance_expiry_date?: string;
    contract_value?: number;
    start_date?: string;
    status?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    // Only allow whitelisted fields to be updated
    const allowedFields: Record<string, any> = {};
    const whitelist = [
        "name", "address", "builder_name", "builder_license_number",
        "builder_abn", "hbcf_policy_number", "insurance_expiry_date",
        "contract_value", "start_date", "status"
    ];

    for (const key of whitelist) {
        if (key in updates && updates[key as keyof typeof updates] !== undefined) {
            allowedFields[key] = updates[key as keyof typeof updates];
        }
    }

    if (Object.keys(allowedFields).length === 0) {
        return { error: "No valid fields to update" };
    }

    const { error } = await supabase
        .from("projects")
        .update(allowedFields)
        .eq("id", projectId)
        .eq("user_id", user.id);

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

// ── Admin helpers ──────────────────────────────────────────────────

/** Check if the current user is an admin */
async function requireAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isAdminEmail(user.email)) {
        return { supabase: null, error: "Unauthorized" };
    }
    return { supabase, error: null };
}

/** Admin: Grant a free trial to a user by email */
export async function grantTrial(userEmail: string, days: number) {
    const { supabase, error } = await requireAdmin();
    if (error || !supabase) return { error };

    const trialEnd = new Date(Date.now() + days * 864e5).toISOString();

    const { error: updateError } = await supabase
        .from("profiles")
        .update({
            subscription_tier: "trial",
            trial_ends_at: trialEnd,
            subscription_updated_at: new Date().toISOString(),
        })
        .eq("email", userEmail);

    if (updateError) return { error: updateError.message };
    return { success: true, trialEnd };
}

/** Admin: Revoke trial / set user back to free */
export async function revokeTrial(userEmail: string) {
    const { supabase, error } = await requireAdmin();
    if (error || !supabase) return { error };

    const { error: updateError } = await supabase
        .from("profiles")
        .update({
            subscription_tier: "free",
            trial_ends_at: null,
            subscription_updated_at: new Date().toISOString(),
        })
        .eq("email", userEmail);

    if (updateError) return { error: updateError.message };
    return { success: true };
}

/** Admin: Manually set a user's tier (e.g. guardian_pro) */
export async function setUserTier(userEmail: string, tier: "free" | "guardian_pro" | "trial") {
    const { supabase, error } = await requireAdmin();
    if (error || !supabase) return { error };

    const updates: Record<string, any> = {
        subscription_tier: tier,
        subscription_updated_at: new Date().toISOString(),
    };
    if (tier !== "trial") {
        updates.trial_ends_at = null;
    }

    const { error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("email", userEmail);

    if (updateError) return { error: updateError.message };
    return { success: true };
}

/** Admin: Create an announcement banner visible to all Guardian users */
export async function createAnnouncement(message: string, type: "info" | "warning" | "success") {
    const { supabase, error } = await requireAdmin();
    if (error || !supabase) return { error };

    // Deactivate all existing announcements first
    await supabase.from("announcements").update({ active: false }).eq("active", true);

    const { error: insertError } = await supabase
        .from("announcements")
        .insert({ message, type, active: true });

    if (insertError) return { error: insertError.message };
    return { success: true };
}

/** Admin: Dismiss/deactivate the current announcement */
export async function dismissAnnouncement() {
    const { supabase, error } = await requireAdmin();
    if (error || !supabase) return { error };

    const { error: updateError2 } = await supabase
        .from("announcements")
        .update({ active: false })
        .eq("active", true);

    if (updateError2) return { error: updateError2.message };
    return { success: true };
}

/** Admin: Downgrade all expired trials to free tier */
export async function cleanupExpiredTrials() {
    const { supabase, error } = await requireAdmin();
    if (error || !supabase) return { error };

    const { data, error: cleanupError } = await supabase
        .from("profiles")
        .update({
            subscription_tier: "free",
            trial_ends_at: null,
            subscription_updated_at: new Date().toISOString(),
        })
        .eq("subscription_tier", "trial")
        .lt("trial_ends_at", new Date().toISOString())
        .select("email");

    if (cleanupError) return { error: cleanupError.message };
    return { success: true, count: data?.length ?? 0 };
}

// ── Support messaging ─────────────────────────────────────────────

/** User: Send a support message */
export async function sendSupportMessage(message: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const trimmed = message.trim();
    if (!trimmed || trimmed.length > 2000) return { error: "Message must be 1-2000 characters" };

    const { error } = await supabase
        .from("support_messages")
        .insert({ user_id: user.id, message: trimmed, is_admin_reply: false });

    if (error) return { error: error.message };
    return { success: true };
}

/** User: Get own support messages */
export async function getMyMessages() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated", messages: [] };

    const { data, error } = await supabase
        .from("support_messages")
        .select("id, message, is_admin_reply, read_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

    if (error) return { error: error.message, messages: [] };

    // Mark unread admin replies as read
    const unreadIds = (data ?? [])
        .filter((m: { is_admin_reply: boolean; read_at: string | null }) => m.is_admin_reply && !m.read_at)
        .map((m: { id: string }) => m.id);
    if (unreadIds.length > 0) {
        await supabase
            .from("support_messages")
            .update({ read_at: new Date().toISOString() })
            .in("id", unreadIds);
    }

    return { messages: data ?? [] };
}

/** Admin: Get all conversations grouped by user */
export async function getAdminConversations() {
    const { supabase, error } = await requireAdmin();
    if (error || !supabase) return { error, conversations: [] };

    const { data, error: fetchError } = await supabase
        .from("support_messages")
        .select("id, user_id, message, is_admin_reply, read_at, created_at")
        .order("created_at", { ascending: true });

    if (fetchError) return { error: fetchError.message, conversations: [] };

    type SupportMsg = { id: string; user_id: string; message: string; is_admin_reply: boolean; read_at: string | null; created_at: string };

    // Get user profiles for display
    const userIds = [...new Set((data ?? []).map((m: SupportMsg) => m.user_id))];
    const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);

    const profileMap: Record<string, { email: string | null; full_name: string | null }> = {};
    for (const p of profiles ?? []) {
        profileMap[p.id] = { email: p.email, full_name: p.full_name };
    }

    // Group messages by user
    const grouped: Record<string, {
        user_id: string;
        email: string | null;
        full_name: string | null;
        messages: SupportMsg[];
        unread_count: number;
        last_message_at: string;
    }> = {};

    for (const m of (data ?? []) as SupportMsg[]) {
        if (!grouped[m.user_id]) {
            grouped[m.user_id] = {
                user_id: m.user_id,
                email: profileMap[m.user_id]?.email ?? null,
                full_name: profileMap[m.user_id]?.full_name ?? null,
                messages: [],
                unread_count: 0,
                last_message_at: m.created_at,
            };
        }
        grouped[m.user_id].messages!.push(m);
        grouped[m.user_id].last_message_at = m.created_at;
        // Count unread user messages (not admin replies)
        if (!m.is_admin_reply && !m.read_at) {
            grouped[m.user_id].unread_count++;
        }
    }

    // Sort by most recent message
    const conversations = Object.values(grouped)
        .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

    return { conversations };
}

/** Admin: Reply to a user's support thread */
export async function adminReply(userId: string, message: string) {
    const { supabase, error } = await requireAdmin();
    if (error || !supabase) return { error };

    const trimmed = message.trim();
    if (!trimmed || trimmed.length > 2000) return { error: "Message must be 1-2000 characters" };

    const { data: { user } } = await supabase.auth.getUser();

    const { error: insertError } = await supabase
        .from("support_messages")
        .insert({
            user_id: userId,
            message: trimmed,
            is_admin_reply: true,
            admin_id: user!.id,
        });

    if (insertError) return { error: insertError.message };

    // Mark all user messages in this thread as read
    await supabase
        .from("support_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("is_admin_reply", false)
        .is("read_at", null);

    return { success: true };
}
