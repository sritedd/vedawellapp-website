"use server";

import { createClient } from "@/lib/supabase/server";
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

    // Delete related data first (cascade may handle this via RLS, but be explicit)
    await supabase.from("checklist_items").delete().in(
        "stage_id",
        (await supabase.from("stages").select("id").eq("project_id", projectId)).data?.map((s: { id: string }) => s.id) || []
    );
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

const ADMIN_EMAILS = ["sridhar.kothandam@gmail.com", "sridharkothandan@vedawellapp.com"];

/** Check if the current user is an admin */
async function requireAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
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
