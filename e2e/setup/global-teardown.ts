/**
 * Playwright Global Teardown
 * Cleans up test data after all tests complete.
 */

import pg from "pg";

const DB_CONFIG = {
    host: process.env.TEST_DB_HOST || "localhost",
    port: parseInt(process.env.TEST_DB_PORT || "5432"),
    database: process.env.TEST_DB_NAME || "guardian_test",
    user: process.env.TEST_DB_USER || "postgres",
    password: process.env.TEST_DB_PASSWORD || "postgres",
};

export default async function globalTeardown() {
    const pool = new pg.Pool(DB_CONFIG);
    try {
        const tables = [
            "site_visits", "materials", "progress_photos", "communication_log",
            "documents", "weekly_checkins", "payment_milestones", "certifications",
            "inspections", "checklist_items", "defects", "variations", "stages",
            "projects", "profiles",
        ];
        for (const t of tables) {
            await pool.query(`DELETE FROM ${t}`);
        }
        console.log("[global-teardown] Cleaned up test data");
    } finally {
        await pool.end();
    }
}
