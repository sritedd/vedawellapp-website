/**
 * E2E Test Seeding via Supabase (production/cloud instance)
 *
 * Uses the service role key to bypass RLS and seed test data.
 * Handles auth user creation/cleanup via Supabase Admin API.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load env from .env.local
function loadEnv(): Record<string, string> {
    const envPath = path.join(__dirname, "../../.env.local");
    const envFile = fs.readFileSync(envPath, "utf-8");
    const env: Record<string, string> = {};
    for (const line of envFile.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
            env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
        }
    }
    return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
}

// Admin client — bypasses RLS
function getAdminClient(): SupabaseClient {
    return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

export const TEST_EMAIL = "e2e-test@vedawellapp.com";
export const TEST_PASSWORD = "E2eTestPass!2026";

let testUserId: string | null = null;

/**
 * Ensure the E2E test user exists in Supabase Auth + profiles table.
 * Creates the user if it doesn't exist, or retrieves the existing ID.
 */
export async function ensureTestUser(): Promise<string> {
    if (testUserId) return testUserId;

    const admin = getAdminClient();

    // Check if user already exists
    const { data: existing } = await admin.auth.admin.listUsers();
    const existingUser = existing?.users?.find((u) => u.email === TEST_EMAIL);

    if (existingUser) {
        testUserId = existingUser.id;
    } else {
        // Create test user
        const { data, error } = await admin.auth.admin.createUser({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            email_confirm: true, // auto-confirm
            user_metadata: { full_name: "E2E Test User" },
        });
        if (error) throw new Error(`Failed to create test user: ${error.message}`);
        testUserId = data.user.id;
    }

    // Ensure profile exists with guardian_pro (so no tier limits block us)
    await admin.from("profiles").upsert({
        id: testUserId,
        email: TEST_EMAIL,
        full_name: "E2E Test User",
        role: "homeowner",
        subscription_tier: "guardian_pro",
    }, { onConflict: "id" });

    return testUserId;
}

/**
 * Create a project for the given state, seeding stages from the workflow.
 * Returns the project ID.
 */
export async function createTestProject(
    userId: string,
    stateCode: string,
    projectName: string
): Promise<string> {
    const admin = getAdminClient();

    // Insert project
    const { data: project, error } = await admin.from("projects").insert({
        user_id: userId,
        name: projectName,
        builder_name: `${stateCode} Test Builders Pty Ltd`,
        builder_license_number: `${stateCode}12345C`,
        builder_abn: "12345678901",
        hbcf_policy_number: `POL-${stateCode}-2026-001`,
        contract_value: 550000,
        address: `42 Test Street, ${stateCode}`,
        start_date: "2026-04-01",
        status: "active",
    }).select("id").single();

    if (error) throw new Error(`Failed to create project: ${error.message}`);
    const projectId = project.id;

    // Load workflow data to get state-specific stages
    const workflowPath = path.join(__dirname, "../../src/data/australian-build-workflows.json");
    const workflows = JSON.parse(fs.readFileSync(workflowPath, "utf-8"));

    const stateWorkflow = workflows.workflows?.new_build?.[stateCode];
    const stages: Array<{ id?: string; name: string; checklist?: any[]; inspections?: string[]; certificates?: string[] }> =
        stateWorkflow?.stages || [];

    // Seed stages
    for (let i = 0; i < stages.length; i++) {
        const stageTemplate = stages[i];
        const { data: stageData, error: stageErr } = await admin.from("stages").insert({
            project_id: projectId,
            name: stageTemplate.name,
            status: "pending",
            order_index: i + 1,
        }).select("id").single();

        if (stageErr) {
            console.error(`Stage insert error: ${stageErr.message}`);
            continue;
        }

        // Seed checklist items
        const checklistItems = stageTemplate.checklist || [];
        if (checklistItems.length > 0) {
            await admin.from("checklist_items").insert(
                checklistItems.map((item: any) => ({
                    stage_id: stageData.id,
                    description: item.item,
                    is_completed: false,
                    is_critical: item.critical || false,
                    requires_photo: item.requiresPhoto || false,
                }))
            );
        } else {
            const inspections = stageTemplate.inspections || [];
            if (inspections.length > 0) {
                await admin.from("checklist_items").insert(
                    inspections.map((insp: string) => ({
                        stage_id: stageData.id,
                        description: `Inspection: ${insp}`,
                        is_completed: false,
                        is_critical: true,
                        requires_photo: true,
                    }))
                );
            }
        }

        // Seed certifications
        const certs = stageTemplate.certificates || [];
        for (const cert of certs) {
            await admin.from("certifications").insert({
                project_id: projectId,
                type: cert,
                status: "pending",
                required_for_stage: stageTemplate.id || stageTemplate.name,
            });
        }
    }

    return projectId;
}

/**
 * Seed data for a specific tab (defects, variations, comms, materials, visits, checkins).
 */
export async function seedProjectData(projectId: string, stateCode: string): Promise<void> {
    const admin = getAdminClient();

    // Defect
    await admin.from("defects").insert({
        project_id: projectId,
        title: `${stateCode} E2E Defect - Cracked render`,
        description: "Hairline crack on external render near front entry",
        severity: "minor",
        status: "open",
        location: "Front Entry",
    });

    // Variation
    await admin.from("variations").insert({
        project_id: projectId,
        title: `${stateCode} E2E Variation - Extra insulation`,
        description: "Upgrade ceiling batts from R4.0 to R6.0",
        additional_cost: 2800,
        status: "draft",
        reason_category: "design_change",
    });

    // Communication log
    await admin.from("communication_log").insert({
        project_id: projectId,
        type: "call",
        date: "2026-03-15",
        summary: `${stateCode} E2E Comms - Builder progress call`,
        details: "Discussed timeline for next stage",
    });

    // Material
    await admin.from("materials").insert({
        project_id: projectId,
        category: "Roofing",
        name: `${stateCode} E2E Colorbond`,
        brand: "BlueScope",
        color: "Monument",
        location: "Roof",
        verified: false,
    });

    // Site visit
    await admin.from("site_visits").insert({
        project_id: projectId,
        date: "2026-03-20",
        purpose: `${stateCode} E2E site check`,
        observations: "Progress on track",
        workers_on_site: 5,
    });

    // Weekly check-in
    await admin.from("weekly_checkins").insert({
        project_id: projectId,
        week_start: "2026-03-16",
        status: "on_track",
        work_completed: `${stateCode} E2E - Frame bracing done`,
        next_week_plan: "Start roof sheeting",
        workers_on_site: 7,
    });
}

/**
 * Update stage status via admin client.
 */
export async function updateStageStatus(
    projectId: string,
    stageName: string,
    status: "pending" | "in_progress" | "completed"
): Promise<void> {
    const admin = getAdminClient();
    await admin.from("stages").update({
        status,
        completion_date: status === "completed" ? new Date().toISOString().split("T")[0] : null,
    }).eq("project_id", projectId).eq("name", stageName);
}

/**
 * Mark project as completed (all stages done, project closed).
 */
export async function completeProject(projectId: string): Promise<void> {
    const admin = getAdminClient();

    // Complete all stages
    await admin.from("stages").update({
        status: "completed",
        completion_date: new Date().toISOString().split("T")[0],
    }).eq("project_id", projectId);

    // Verify all defects
    await admin.from("defects").update({
        status: "verified",
        verified_date: new Date().toISOString().split("T")[0],
    }).eq("project_id", projectId);

    // Complete the project
    await admin.from("projects").update({
        status: "completed",
        handover_date: new Date().toISOString().split("T")[0],
    }).eq("id", projectId);
}

/**
 * Delete a test project and all related data.
 */
export async function deleteTestProject(projectId: string): Promise<void> {
    const admin = getAdminClient();

    // Cascading deletes handle most things, but clean up explicitly
    const childTables = [
        "site_visits", "materials", "progress_photos", "communication_log",
        "documents", "weekly_checkins", "payment_milestones", "certifications",
        "inspections", "defects", "variations",
    ];

    for (const table of childTables) {
        await admin.from(table).delete().eq("project_id", projectId);
    }

    // Delete checklist items via stages
    const { data: stages } = await admin.from("stages").select("id").eq("project_id", projectId);
    if (stages) {
        for (const s of stages) {
            await admin.from("checklist_items").delete().eq("stage_id", s.id);
        }
    }
    await admin.from("stages").delete().eq("project_id", projectId);
    await admin.from("projects").delete().eq("id", projectId);
}

/**
 * Clean up all E2E test projects by name pattern.
 */
export async function cleanupE2EProjects(): Promise<void> {
    const admin = getAdminClient();
    const { data: projects } = await admin.from("projects")
        .select("id")
        .like("name", "E2E %");

    if (projects) {
        for (const p of projects) {
            await deleteTestProject(p.id);
        }
    }
}

/**
 * Get stages for a project from the DB.
 */
export async function getProjectStages(projectId: string): Promise<Array<{ name: string; status: string }>> {
    const admin = getAdminClient();
    const { data } = await admin.from("stages")
        .select("name, status")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
    return data || [];
}
