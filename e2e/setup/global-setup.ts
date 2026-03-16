/**
 * Playwright Global Setup
 *
 * Runs once before all tests:
 * 1. Initializes the local guardian_test schema
 * 2. Seeds test data
 */

import fs from "fs";
import path from "path";
import pg from "pg";

const DB_CONFIG = {
    host: process.env.TEST_DB_HOST || "localhost",
    port: parseInt(process.env.TEST_DB_PORT || "5432"),
    database: process.env.TEST_DB_NAME || "guardian_test",
    user: process.env.TEST_DB_USER || "postgres",
    password: process.env.TEST_DB_PASSWORD || "postgres",
};

export default async function globalSetup() {
    const pool = new pg.Pool(DB_CONFIG);

    try {
        // 1. Run the schema SQL
        const schemaPath = path.join(__dirname, "local-schema.sql");
        const schemaSql = fs.readFileSync(schemaPath, "utf-8");
        await pool.query(schemaSql);
        console.log("[global-setup] Schema initialized");

        // 2. Clean existing data
        const tables = [
            "site_visits", "materials", "progress_photos", "communication_log",
            "documents", "weekly_checkins", "payment_milestones", "certifications",
            "inspections", "checklist_items", "defects", "variations", "stages",
            "projects", "profiles",
        ];
        for (const t of tables) {
            await pool.query(`DELETE FROM ${t}`);
        }
        console.log("[global-setup] Tables cleaned");

        // 3. Seed is done per-test via the db helper (so tests stay isolated)
        console.log("[global-setup] Ready for tests");
    } catch (err) {
        console.error("[global-setup] Failed:", err);
        throw err;
    } finally {
        await pool.end();
    }
}
