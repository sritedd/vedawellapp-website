import { NextRequest, NextResponse } from "next/server";
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

        if (!confirmEmail || confirmEmail !== user.email) {
            return NextResponse.json(
                { error: "Email confirmation does not match your account email" },
                { status: 400 }
            );
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

            // Delete from all project-scoped tables
            const tables = [
                "contract_review_items",
                "builder_reviews",
                "pre_handover_items",
                "progress_photos",
                "communication_log",
                "documents",
                "inspections",
                "weekly_checkins",
                "payments",
                "variations",
                "defects",
                "certifications",
                "site_visits",
                "stages",
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

        // 3. Log the deletion event (before deleting profile)
        try {
            await serviceSupabase
                .from("account_deletion_log")
                .insert({
                    user_id: user.id,
                    email: user.email,
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
