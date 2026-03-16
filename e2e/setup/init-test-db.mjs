#!/usr/bin/env node
/**
 * Initialize the local guardian_test database.
 *
 * Usage: node e2e/setup/init-test-db.mjs
 *
 * Creates the database if it doesn't exist, then runs the schema.
 * Requires PostgreSQL 16 installed locally with password 'postgres'.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PSQL = process.env.PSQL_PATH || "psql";
const PG_PASSWORD = process.env.TEST_DB_PASSWORD || "postgres";
const PG_USER = process.env.TEST_DB_USER || "postgres";
const DB_NAME = process.env.TEST_DB_NAME || "guardian_test";

function run(cmd) {
    try {
        return execSync(cmd, {
            env: { ...process.env, PGPASSWORD: PG_PASSWORD },
            stdio: "pipe",
        }).toString();
    } catch (e) {
        return e.stderr?.toString() || e.message;
    }
}

// 1. Check if database exists
const dbList = run(`${PSQL} -U ${PG_USER} -l`);
if (!dbList.includes(DB_NAME)) {
    console.log(`Creating database ${DB_NAME}...`);
    run(`${PSQL} -U ${PG_USER} -c "CREATE DATABASE ${DB_NAME}"`);
    console.log("Database created.");
} else {
    console.log(`Database ${DB_NAME} already exists.`);
}

// 2. Run schema
const schemaPath = path.join(__dirname, "local-schema.sql");
console.log("Running schema...");
const result = run(`${PSQL} -U ${PG_USER} -d ${DB_NAME} -f "${schemaPath}"`);
console.log(result);
console.log("Done! Run tests with: npm run test:e2e");
