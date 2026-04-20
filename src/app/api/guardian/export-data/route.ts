import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch profile — explicit allowlist of user-facing fields.
        // Excludes credentials (`phone_otp_hash`, `phone_otp_expires_at`,
        // `phone_otp_attempts`), payment system identifiers
        // (`stripe_customer_id`), and operational flags the user shouldn't
        // see in their export. GDPR data-portability covers what the user
        // provided + their account state, not internal infrastructure.
        const { data: profile } = await supabase
            .from("profiles")
            .select(`
                id, email, full_name, phone, role, state,
                subscription_tier, trial_ends_at, subscription_updated_at,
                phone_verified, phone_verified_at,
                identity_verified, identity_verified_at,
                email_verified, mfa_enabled, mfa_verified_at,
                referral_code, referral_count, referred_by,
                last_seen_at, last_page_view_at,
                created_at, updated_at
            `)
            .eq("id", user.id)
            .single();

        // Fetch all user projects
        const { data: projects } = await supabase
            .from("projects")
            .select("*")
            .eq("user_id", user.id);

        const projectsWithData = await Promise.all(
            (projects ?? []).map(async (project: { id: string }) => {
                // Fetch stage IDs first (needed for checklist_items)
                const { data: stages } = await supabase
                    .from("stages")
                    .select("*")
                    .eq("project_id", project.id);

                const stageIds = (stages ?? []).map((s: { id: string }) => s.id);

                // Fetch all project-related data in parallel
                const [
                    checklistItems,
                    defects,
                    variations,
                    inspections,
                    certifications,
                    documents,
                    communicationLog,
                    payments,
                    progressPhotos,
                    siteVisits,
                    weeklyCheckins,
                    preHandoverItems,
                    contractReviewItems,
                    builderReviews,
                ] = await Promise.all([
                    stageIds.length > 0
                        ? supabase.from("checklist_items").select("*").in("stage_id", stageIds)
                        : { data: [] },
                    supabase.from("defects").select("*").eq("project_id", project.id),
                    supabase.from("variations").select("*").eq("project_id", project.id),
                    supabase.from("inspections").select("*").eq("project_id", project.id),
                    supabase.from("certifications").select("*").eq("project_id", project.id),
                    supabase.from("documents").select("*").eq("project_id", project.id),
                    supabase.from("communication_log").select("*").eq("project_id", project.id),
                    supabase.from("payments").select("*").eq("project_id", project.id),
                    supabase.from("progress_photos").select("*").eq("project_id", project.id),
                    supabase.from("site_visits").select("*").eq("project_id", project.id),
                    supabase.from("weekly_checkins").select("*").eq("project_id", project.id),
                    supabase.from("pre_handover_items").select("*").eq("project_id", project.id),
                    supabase.from("contract_review_items").select("*").eq("project_id", project.id),
                    supabase.from("builder_reviews").select("*").eq("project_id", project.id),
                ]);

                return {
                    project,
                    stages: stages ?? [],
                    checklist_items: checklistItems.data ?? [],
                    defects: defects.data ?? [],
                    variations: variations.data ?? [],
                    inspections: inspections.data ?? [],
                    certifications: certifications.data ?? [],
                    documents: documents.data ?? [],
                    communication_log: communicationLog.data ?? [],
                    payments: payments.data ?? [],
                    progress_photos: progressPhotos.data ?? [],
                    site_visits: siteVisits.data ?? [],
                    weekly_checkins: weeklyCheckins.data ?? [],
                    pre_handover_items: preHandoverItems.data ?? [],
                    contract_review_items: contractReviewItems.data ?? [],
                    builder_reviews: builderReviews.data ?? [],
                };
            })
        );

        const exportData = {
            exportDate: new Date().toISOString(),
            profile: profile ?? { id: user.id, email: user.email },
            projects: projectsWithData,
        };

        return NextResponse.json(exportData);
    } catch (err) {
        console.error("Data export error:", err);
        return NextResponse.json(
            { error: "Failed to export data" },
            { status: 500 }
        );
    }
}
