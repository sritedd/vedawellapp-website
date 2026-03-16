/**
 * E2E Test Database Helpers
 *
 * Seeds and tears down test data in the local guardian_test Postgres database.
 * No mock data in application code — all test fixtures live here.
 */

import pg from "pg";

const DB_CONFIG = {
    host: process.env.TEST_DB_HOST || "localhost",
    port: parseInt(process.env.TEST_DB_PORT || "5432"),
    database: process.env.TEST_DB_NAME || "guardian_test",
    user: process.env.TEST_DB_USER || "postgres",
    password: process.env.TEST_DB_PASSWORD || "postgres",
};

// Fixed UUIDs for predictable test data
export const TEST_USER_ID = "00000000-0000-0000-0000-000000000001";
export const TEST_PROJECT_ID = "00000000-0000-0000-0000-000000000010";
export const TEST_STAGE_IDS = {
    base: "00000000-0000-0000-0000-000000000100",
    frame: "00000000-0000-0000-0000-000000000101",
    lockup: "00000000-0000-0000-0000-000000000102",
    fixout: "00000000-0000-0000-0000-000000000103",
    practical: "00000000-0000-0000-0000-000000000104",
};

let pool: pg.Pool | null = null;

function getPool(): pg.Pool {
    if (!pool) {
        pool = new pg.Pool(DB_CONFIG);
    }
    return pool;
}

export async function closePool(): Promise<void> {
    if (pool) {
        await pool.end();
        pool = null;
    }
}

/** Run raw SQL against the test database */
export async function query(sql: string, params?: unknown[]): Promise<pg.QueryResult> {
    const p = getPool();
    return p.query(sql, params);
}

/** Drop all data (order matters due to FK constraints) */
export async function teardown(): Promise<void> {
    const tables = [
        "site_visits",
        "materials",
        "progress_photos",
        "communication_log",
        "documents",
        "weekly_checkins",
        "payment_milestones",
        "certifications",
        "inspections",
        "checklist_items",
        "defects",
        "variations",
        "stages",
        "projects",
        "profiles",
    ];
    for (const t of tables) {
        await query(`DELETE FROM ${t}`);
    }
}

/**
 * Seed a realistic test project with related data.
 * This is the ONLY place test fixtures are defined — not in app code.
 */
export async function seedTestProject(): Promise<{
    userId: string;
    projectId: string;
    stageIds: typeof TEST_STAGE_IDS;
}> {
    // 1. Create test user profile
    await query(
        `INSERT INTO profiles (id, email, full_name, role, subscription_tier)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [TEST_USER_ID, "test@vedawellapp.com", "Test User", "homeowner", "guardian_pro"]
    );

    // 2. Create test project
    await query(
        `INSERT INTO projects (id, user_id, name, builder_name, contract_value, start_date, status, address)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [
            TEST_PROJECT_ID,
            TEST_USER_ID,
            "123 Test Street Build",
            "Acme Builders Pty Ltd",
            450000,
            "2026-01-15",
            "active",
            "123 Test Street, Sydney NSW 2000",
        ]
    );

    // 3. Create stages
    const stageNames = ["Base", "Frame", "Lockup", "Fix-out", "Practical Completion"];
    const stageIds = Object.values(TEST_STAGE_IDS);
    for (let i = 0; i < stageNames.length; i++) {
        const status = i === 0 ? "completed" : i === 1 ? "in_progress" : "pending";
        await query(
            `INSERT INTO stages (id, project_id, name, status, order_index)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO NOTHING`,
            [stageIds[i], TEST_PROJECT_ID, stageNames[i], status, i + 1]
        );
    }

    // 4. Checklist items for base stage
    const baseItems = [
        "Site survey completed",
        "Excavation done",
        "Footings poured",
        "Slab poured",
    ];
    for (const desc of baseItems) {
        await query(
            `INSERT INTO checklist_items (stage_id, description, is_completed, completed_at)
             VALUES ($1, $2, true, NOW())`,
            [TEST_STAGE_IDS.base, desc]
        );
    }

    // 5. Checklist items for frame stage (partially done)
    const frameItems = [
        { desc: "Wall frames erected", done: true },
        { desc: "Roof trusses installed", done: true },
        { desc: "Roof sheeting complete", done: false },
        { desc: "Window frames installed", done: false },
    ];
    for (const item of frameItems) {
        await query(
            `INSERT INTO checklist_items (stage_id, description, is_completed, completed_at)
             VALUES ($1, $2, $3, $4)`,
            [TEST_STAGE_IDS.frame, item.desc, item.done, item.done ? new Date().toISOString() : null]
        );
    }

    // 6. A defect
    await query(
        `INSERT INTO defects (project_id, title, description, severity, status, location, stage)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
            TEST_PROJECT_ID,
            "Crack in garage slab",
            "Hairline crack observed near expansion joint",
            "minor",
            "open",
            "Garage",
            "Base",
        ]
    );

    // 7. An inspection
    await query(
        `INSERT INTO inspections (project_id, stage, scheduled_date, result, inspector_name)
         VALUES ($1, $2, $3, $4, $5)`,
        [TEST_PROJECT_ID, "footing", "2026-02-01", "passed", "John Smith Inspections"]
    );

    // 8. A communication log entry
    await query(
        `INSERT INTO communication_log (project_id, type, date, summary, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [
            TEST_PROJECT_ID,
            "call",
            "2026-02-15",
            "Discussed frame timeline",
            "Builder confirmed frame stage will be done by end of March",
        ]
    );

    // 9. A material
    await query(
        `INSERT INTO materials (project_id, category, name, brand, color, location, verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [TEST_PROJECT_ID, "Flooring", "Spotted Gum Hardwood", "Boral Timber", "Natural", "Living Room", true]
    );

    // 10. A site visit
    await query(
        `INSERT INTO site_visits (project_id, date, purpose, observations, workers_on_site)
         VALUES ($1, $2, $3, $4, $5)`,
        [TEST_PROJECT_ID, "2026-02-20", "Frame progress check", "Trusses installed, roofing next week", 6]
    );

    // 11. A weekly check-in
    await query(
        `INSERT INTO weekly_checkins (project_id, week_start, status, weather, workers_on_site, work_completed, next_week_plan)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
            TEST_PROJECT_ID,
            "2026-02-17",
            "on_track",
            "sunny",
            8,
            "Roof trusses installed and braced",
            "Begin roof sheeting and sarking",
        ]
    );

    // 12. A variation
    await query(
        `INSERT INTO variations (project_id, title, description, additional_cost, status, reason_category)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
            TEST_PROJECT_ID,
            "Extra power points in kitchen",
            "Add 4 additional GPOs to kitchen island bench",
            1200,
            "approved",
            "design_change",
        ]
    );

    // 13. A certification
    await query(
        `INSERT INTO certifications (project_id, type, status, required_for_stage)
         VALUES ($1, $2, $3, $4)`,
        [TEST_PROJECT_ID, "Soil Test Report", "verified", "Base"]
    );

    // 14. A payment milestone
    await query(
        `INSERT INTO payment_milestones (project_id, stage_name, amount, status)
         VALUES ($1, $2, $3, $4)`,
        [TEST_PROJECT_ID, "Base", 90000, "paid"]
    );

    return {
        userId: TEST_USER_ID,
        projectId: TEST_PROJECT_ID,
        stageIds: TEST_STAGE_IDS,
    };
}
