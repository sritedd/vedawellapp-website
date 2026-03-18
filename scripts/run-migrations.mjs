/**
 * Run pending Supabase migrations via the Management API.
 *
 * Usage: node scripts/run-migrations.mjs
 *
 * Reads SUPABASE_SECRET_KEY and NEXT_PUBLIC_SUPABASE_URL from .env.local
 * Runs migration files in order: v13, v14, v15, v16
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

// Load .env.local
const envFile = fs.readFileSync(path.join(rootDir, ".env.local"), "utf-8");
const env = {};
for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
        env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
    }
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_DATABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || SUPABASE_URL.startsWith("postgresql://")) {
    console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL must be the HTTP API URL (https://xxx.supabase.co), not a postgres connection string");
    process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
    console.error("ERROR: SUPABASE_SECRET_KEY not found in .env.local");
    process.exit(1);
}

// Migration files to run in order
const migrations = [
    "schema_v13_storage_buckets.sql",
    "schema_v14_defect_columns.sql",
    "schema_v15_bugfixes.sql",
    "schema_v16_materials_visits.sql",
];

async function runSQL(sql, filename) {
    // Use the Supabase REST API's rpc endpoint to run raw SQL
    // This requires a Postgres function, so instead we'll use the
    // Supabase Management API or pg_net. Simplest: use the /rest/v1/rpc endpoint
    // with a custom function, OR use the SQL query endpoint.

    // Actually, the simplest way is to use Supabase's pg REST endpoint
    // POST to /pg/query with the service role key
    const res = await fetch(`${SUPABASE_URL}/pg/query`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
            "apikey": SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({ query: sql }),
    });

    if (!res.ok) {
        // Try alternative: use the Supabase SQL API endpoint
        const res2 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
                "apikey": SERVICE_ROLE_KEY,
                "Prefer": "return=representation",
            },
            body: JSON.stringify({ sql_text: sql }),
        });

        if (!res2.ok) {
            const text = await res2.text();
            throw new Error(`Failed to run ${filename}: ${res2.status} ${text}`);
        }
        return await res2.json();
    }

    return await res.json();
}

async function main() {
    console.log(`Supabase URL: ${SUPABASE_URL}`);
    console.log(`Running ${migrations.length} migrations...\n`);

    // First, create the exec_sql helper function if it doesn't exist
    // This is needed because Supabase REST API doesn't have a raw SQL endpoint
    const createExecSQL = `
        CREATE OR REPLACE FUNCTION exec_sql(sql_text TEXT)
        RETURNS JSONB
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
            EXECUTE sql_text;
            RETURN jsonb_build_object('status', 'ok');
        EXCEPTION WHEN OTHERS THEN
            RETURN jsonb_build_object('status', 'error', 'message', SQLERRM);
        END;
        $$;
    `;

    // Try to create the helper via the standard rpc mechanism
    // First check if we can reach the API
    const healthCheck = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        headers: { "apikey": SERVICE_ROLE_KEY },
    });

    if (!healthCheck.ok) {
        console.error("Cannot reach Supabase API. Check your URL and key.");
        process.exit(1);
    }

    console.log("Supabase API reachable.\n");

    // We need to run SQL. The cleanest approach on a remote Supabase
    // without psql is the Supabase Management API.
    // Project ref is extracted from URL: https://{ref}.supabase.co
    const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (!projectRef) {
        console.error("Cannot extract project ref from URL:", SUPABASE_URL);
        process.exit(1);
    }

    console.log(`Project ref: ${projectRef}\n`);

    // Use the Supabase Management API to run SQL
    // This requires a Supabase access token (not service role key)
    // Let's check if we have one
    const accessToken = env.SUPABASE_ACCESS_TOKEN;

    if (!accessToken) {
        console.log("═══════════════════════════════════════════");
        console.log("No SUPABASE_ACCESS_TOKEN found in .env.local");
        console.log("");
        console.log("To run migrations automatically, you need a");
        console.log("Supabase access token. Generate one at:");
        console.log("  https://supabase.com/dashboard/account/tokens");
        console.log("");
        console.log("Then add to .env.local:");
        console.log("  SUPABASE_ACCESS_TOKEN=sbp_xxxxx");
        console.log("");
        console.log("OR run manually in the SQL Editor:");
        console.log("  https://supabase.com/dashboard/project/" + projectRef + "/sql");
        console.log("═══════════════════════════════════════════");
        console.log("");
        console.log("Generating combined migration file instead...\n");

        // Concatenate all migration files into one
        let combined = "-- Combined migrations: v13, v14, v15, v16\n";
        combined += "-- Generated: " + new Date().toISOString() + "\n";
        combined += "-- Paste this into the Supabase SQL Editor\n\n";

        for (const file of migrations) {
            const filePath = path.join(rootDir, "supabase", file);
            if (fs.existsSync(filePath)) {
                const sql = fs.readFileSync(filePath, "utf-8");
                combined += `-- ════════════════════════════════════════\n`;
                combined += `-- ${file}\n`;
                combined += `-- ════════════════════════════════════════\n\n`;
                combined += sql + "\n\n";
                console.log(`  Included: ${file}`);
            } else {
                console.log(`  SKIPPED (not found): ${file}`);
            }
        }

        const outPath = path.join(rootDir, "supabase", "combined_v13_v16.sql");
        fs.writeFileSync(outPath, combined, "utf-8");
        console.log(`\nCombined SQL written to: supabase/combined_v13_v16.sql`);
        console.log(`\nPaste it into: https://supabase.com/dashboard/project/${projectRef}/sql`);
        return;
    }

    // We have an access token — run via Management API
    for (const file of migrations) {
        const filePath = path.join(rootDir, "supabase", file);
        if (!fs.existsSync(filePath)) {
            console.log(`SKIP: ${file} (not found)`);
            continue;
        }

        const sql = fs.readFileSync(filePath, "utf-8");
        console.log(`Running: ${file}...`);

        const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ query: sql }),
        });

        if (!res.ok) {
            const body = await res.text();
            console.error(`  FAILED: ${res.status} ${body}`);
            console.error(`  Fix the error and re-run. Migrations are safe to re-run.`);
            process.exit(1);
        }

        const result = await res.json();
        console.log(`  OK`);
    }

    console.log("\nAll migrations complete!");
}

main().catch((err) => {
    console.error("Fatal error:", err.message);
    process.exit(1);
});
