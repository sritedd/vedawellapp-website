"use server";

import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { isAdminEmail } from "@/lib/admin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/** Call at the top of every authenticated Guardian server component to record last activity.
 *  Throttled: only writes if last_seen_at is more than 15 minutes old to avoid write amplification. */
export async function touchLastSeen(userId: string) {
    const supabase = await createClient();

    // Only update if last_seen_at is older than 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    await supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", userId)
        .or(`last_seen_at.is.null,last_seen_at.lt.${fifteenMinutesAgo}`);
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

    // SERVER-SIDE MFA ENFORCEMENT: If user has MFA enabled, require aal2 session
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const hasVerifiedTotp = factors?.totp?.some(
        (f: { status: string }) => f.status === "verified"
    );
    if (hasVerifiedTotp) {
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aal?.currentLevel !== "aal2") {
            return { error: "MFA verification required. Please verify your authenticator code first." };
        }
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
    const cleanupErrors: string[] = [];

    for (const bucket of ["evidence", "documents", "certificates"]) {
        try {
            const { data: files } = await supabase.storage
                .from(bucket)
                .list(projectId, { limit: 1000 });
            if (files && files.length > 0) {
                const filePaths = files.map((f: { name: string }) => `${projectId}/${f.name}`);
                await supabase.storage.from(bucket).remove(filePaths);
            }
            // Also check subdirectories (photos, defects, certs)
            for (const subdir of ["photos", "defects", "certs", "signatures"]) {
                const { data: subFiles } = await supabase.storage
                    .from(bucket)
                    .list(`${projectId}/${subdir}`, { limit: 1000 });
                if (subFiles && subFiles.length > 0) {
                    const subPaths = subFiles.map((f: { name: string }) => `${projectId}/${subdir}/${f.name}`);
                    await supabase.storage.from(bucket).remove(subPaths);
                }
            }
        } catch (e) {
            cleanupErrors.push(`Storage cleanup (${bucket}): ${e}`);
        }
    }

    // Delete related data (best-effort — continue even if some fail)
    const tables = [
        { name: "ai_conversations", method: "direct" as const },
        { name: "contract_review_items", method: "direct" as const },
        { name: "builder_reviews", method: "direct" as const },
        { name: "pre_handover_items", method: "direct" as const },
        { name: "checklist_items", method: "nested" as const },
        { name: "progress_photos", method: "direct" as const },
        { name: "communication_log", method: "direct" as const },
        { name: "documents", method: "direct" as const },
        { name: "inspections", method: "direct" as const },
        { name: "weekly_checkins", method: "direct" as const },
        { name: "payments", method: "direct" as const },
        { name: "stages", method: "direct" as const },
        { name: "variations", method: "direct" as const },
        { name: "defects", method: "direct" as const },
        { name: "certifications", method: "direct" as const },
    ];

    for (const table of tables) {
        try {
            if (table.method === "nested" && table.name === "checklist_items") {
                const { data: stageIds } = await supabase.from("stages").select("id").eq("project_id", projectId);
                if (stageIds && stageIds.length > 0) {
                    await supabase.from("checklist_items").delete().in(
                        "stage_id",
                        stageIds.map((s: { id: string }) => s.id)
                    );
                }
            } else {
                await supabase.from(table.name).delete().eq("project_id", projectId);
            }
        } catch (e) {
            cleanupErrors.push(`Delete ${table.name}: ${e}`);
        }
    }

    if (cleanupErrors.length > 0) {
        console.warn("Project cleanup warnings:", cleanupErrors);
    }

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

/** Get service-role Supabase client for admin operations (bypasses RLS) */
function getServiceSupabase() {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin actions");
    }
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey,
        { cookies: { getAll: () => [], setAll: () => { } } }
    );
}

/** Check if the current user is an admin, return service-role client for mutations + admin user */
async function requireAdmin() {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user || !isAdminEmail(user.email)) {
        return { supabase: null, user: null, error: "Unauthorized" };
    }
    // Return service-role client so admin mutations bypass RLS restrictions (schema_v26)
    // Also return user so callers don't need to call auth.getUser() on service-role (which returns null)
    return { supabase: getServiceSupabase(), user, error: null };
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

/** Admin: Bypass verification for a user (mark identity as verified) */
export async function bypassPhoneVerification(userEmail: string) {
    const { supabase, error } = await requireAdmin();
    if (error || !supabase) return { error };

    const { error: updateError } = await supabase
        .from("profiles")
        .update({
            identity_verified: true,
            identity_verified_at: new Date().toISOString(),
        })
        .eq("email", userEmail);

    if (updateError) return { error: updateError.message };
    return { success: true };
}

/** Admin: Reset verification for a user (force re-verify) */
export async function resetPhoneVerification(userEmail: string) {
    const { supabase, error } = await requireAdmin();
    if (error || !supabase) return { error };

    const { error: updateError } = await supabase
        .from("profiles")
        .update({
            phone_verified: false,
            phone_verified_at: null,
            identity_verified: false,
            identity_verified_at: null,
            phone_otp_hash: null,
            phone_otp_expires_at: null,
            phone_otp_attempts: 0,
        })
        .eq("email", userEmail);

    if (updateError) return { error: updateError.message };
    return { success: true };
}

/** Admin: Clear phone number from a user's profile (allows re-registration) */
export async function clearUserPhone(userEmail: string) {
    const { supabase, error } = await requireAdmin();
    if (error || !supabase) return { error };

    const { error: updateError } = await supabase
        .from("profiles")
        .update({
            phone: null,
            phone_verified: false,
            phone_verified_at: null,
            identity_verified: false,
            identity_verified_at: null,
            phone_otp_hash: null,
            phone_otp_expires_at: null,
            phone_otp_attempts: 0,
        })
        .eq("email", userEmail);

    if (updateError) return { error: updateError.message };
    return { success: true };
}

/** Admin: Bypass email verification for a user (sets override flag in profiles) */
export async function bypassEmailVerification(userEmail: string) {
    const { supabase, error } = await requireAdmin();
    if (error || !supabase) return { error };

    const { error: updateError } = await supabase
        .from("profiles")
        .update({ email_verified_override: true })
        .eq("email", userEmail);

    if (updateError) return { error: updateError.message };
    return { success: true };
}

/** Admin: Reset email verification override for a user */
export async function resetEmailVerification(userEmail: string) {
    const { supabase, error } = await requireAdmin();
    if (error || !supabase) return { error };

    const { error: updateError } = await supabase
        .from("profiles")
        .update({ email_verified_override: false })
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

    // Keep trial_ends_at so start-trial can detect prior usage and block re-claims
    const { data, error: cleanupError } = await supabase
        .from("profiles")
        .update({
            subscription_tier: "free",
            subscription_updated_at: new Date().toISOString(),
        })
        .eq("subscription_tier", "trial")
        .lt("trial_ends_at", new Date().toISOString())
        .select("email");

    if (cleanupError) return { error: cleanupError.message };
    return { success: true, count: data?.length ?? 0 };
}

// ── Support messaging ─────────────────────────────────────────────

/** User: Send a support message (rate limited: max 5 per minute) */
export async function sendSupportMessage(message: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const trimmed = message.trim();
    if (!trimmed || trimmed.length > 2000) return { error: "Message must be 1-2000 characters" };

    // Rate limit: max 5 messages per minute per user
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count } = await supabase
        .from("support_messages")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_admin_reply", false)
        .gte("created_at", oneMinuteAgo);

    if ((count ?? 0) >= 5) {
        return { error: "Too many messages. Please wait a minute before sending another." };
    }

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let profiles: any[] | null = null;
    if (userIds.length > 0) {
        const { data: profileData } = await supabase
            .from("profiles")
            .select("id, email, full_name")
            .in("id", userIds);
        profiles = profileData;
    }

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
    const { supabase, user: adminUser, error } = await requireAdmin();
    if (error || !supabase || !adminUser) return { error };

    const trimmed = message.trim();
    if (!trimmed || trimmed.length > 2000) return { error: "Message must be 1-2000 characters" };

    const { error: insertError } = await supabase
        .from("support_messages")
        .insert({
            user_id: userId,
            message: trimmed,
            is_admin_reply: true,
            admin_id: adminUser.id,
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
