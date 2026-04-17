import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";

function getServiceSupabase() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => [], setAll: () => { } } }
    );
}

export async function POST(req: NextRequest) {
    try {
        // Authenticate via user's session
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { confirmEmail } = await req.json();

        if (!confirmEmail || confirmEmail.toLowerCase() !== user.email?.toLowerCase()) {
            return NextResponse.json(
                { error: "Email confirmation does not match your account email" },
                { status: 400 }
            );
        }

        // SERVER-SIDE MFA ENFORCEMENT: If user has MFA enabled, require aal2 session
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const hasVerifiedTotp = factors?.totp?.some(
            (f: { status: string }) => f.status === "verified"
        );
        if (hasVerifiedTotp) {
            const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            if (aal?.currentLevel !== "aal2") {
                return NextResponse.json(
                    { error: "MFA verification required for account deletion" },
                    { status: 403 }
                );
            }
        }

        const serviceSupabase = getServiceSupabase();

        // Fetch all user projects
        const { data: projects } = await serviceSupabase
            .from("projects")
            .select("id")
            .eq("user_id", user.id);

        const projectIds = (projects ?? []).map((p: { id: string }) => p.id);
        const projectCount = projectIds.length;

        // 1. Delete storage files for all projects
        for (const projectId of projectIds) {
            for (const bucket of ["evidence", "documents", "certificates"]) {
                try {
                    const { data: files } = await serviceSupabase.storage
                        .from(bucket)
                        .list(projectId, { limit: 1000 });
                    if (files && files.length > 0) {
                        const filePaths = files.map((f: { name: string }) => `${projectId}/${f.name}`);
                        await serviceSupabase.storage.from(bucket).remove(filePaths);
                    }
                    for (const subdir of ["photos", "defects", "certs", "signatures"]) {
                        const { data: subFiles } = await serviceSupabase.storage
                            .from(bucket)
                            .list(`${projectId}/${subdir}`, { limit: 1000 });
                        if (subFiles && subFiles.length > 0) {
                            const subPaths = subFiles.map((f: { name: string }) => `${projectId}/${subdir}/${f.name}`);
                            await serviceSupabase.storage.from(bucket).remove(subPaths);
                        }
                    }
                } catch (e) {
                    console.warn(`Storage cleanup (${bucket}/${projectId}):`, e);
                }
            }
        }

        // 2. Delete all project-related data
        for (const projectId of projectIds) {
            // Get stage IDs for checklist_items
            const { data: stageIds } = await serviceSupabase
                .from("stages")
                .select("id")
                .eq("project_id", projectId);

            if (stageIds && stageIds.length > 0) {
                await serviceSupabase
                    .from("checklist_items")
                    .delete()
                    .in("stage_id", stageIds.map((s: { id: string }) => s.id));
            }

            // Delete from all project-scoped tables. ON DELETE CASCADE on
            // projects(id) is the safety net; this manual sweep ensures the
            // rows are gone even if the projects DELETE is delayed or the
            // RLS context loses the user mid-operation.
            const tables = [
                "activity_log",
                "ai_conversations",
                "allowances",
                "builder_reviews",
                "certifications",
                "communication_log",
                "contract_review_items",
                "defects",
                "documents",
                "escalations",
                "inspections",
                "materials",
                "payments",
                "pre_handover_items",
                "progress_photos",
                "project_members",
                "site_visits",
                "stages",
                "variations",
                "weekly_checkins",
            ];

            for (const table of tables) {
                try {
                    await serviceSupabase.from(table).delete().eq("project_id", projectId);
                } catch (e) {
                    console.warn(`Delete ${table} for project ${projectId}:`, e);
                }
            }
        }

        // Delete the projects themselves
        if (projectIds.length > 0) {
            await serviceSupabase
                .from("projects")
                .delete()
                .eq("user_id", user.id);
        }

        // Delete support messages
        try {
            await serviceSupabase
                .from("support_messages")
                .delete()
                .eq("user_id", user.id);
        } catch (e) {
            console.warn("Delete support_messages:", e);
        }

        // Unsubscribe newsletter row (keyed on email, not user_id, so it
        // doesn't auto-cascade when the auth user is deleted)
        if (user.email) {
            try {
                await serviceSupabase
                    .from("email_subscribers")
                    .update({ status: "unsubscribed" })
                    .eq("email", user.email.toLowerCase());
            } catch (e) {
                console.warn("Unsubscribe email_subscribers:", e);
            }
        }

        // 3. Log the deletion event (before deleting profile).
        // Email is hashed (SHA-256) so the audit trail proves a deletion
        // happened without retaining identifiable PII.
        try {
            const emailHash = user.email
                ? crypto.createHash("sha256").update(user.email.toLowerCase()).digest("hex")
                : "unknown";
            await serviceSupabase
                .from("account_deletion_log")
                .insert({
                    user_id: user.id,
                    email: emailHash,
                    project_count: projectCount,
                });
        } catch (e) {
            console.warn("Failed to log deletion:", e);
        }

        // 4. Delete profile
        await serviceSupabase
            .from("profiles")
            .delete()
            .eq("id", user.id);

        // 5. Delete auth user
        const { error: authDeleteError } = await serviceSupabase.auth.admin.deleteUser(user.id);

        if (authDeleteError) {
            console.error("Failed to delete auth user:", authDeleteError);
            return NextResponse.json(
                { error: "Account data deleted but auth cleanup failed. Contact support." },
                { status: 500 }
            );
        }

        console.log(`Account deleted: ${user.email} (${user.id}), ${projectCount} projects`);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Account deletion error:", err);
        return NextResponse.json(
            { error: "Failed to delete account" },
            { status: 500 }
        );
    }
}
