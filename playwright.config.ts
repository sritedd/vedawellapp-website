import { defineConfig, devices } from "@playwright/test";

/**
 * Localhost config — runs the app locally but against the SAME cloud Supabase
 * the specs seed.
 *
 * The old local-Postgres harness (globalSetup/globalTeardown + e2e/setup/db.ts)
 * was removed: it seeded a `guardian_test` database that the app never reads,
 * so every assertion built on it was unpassable by construction. The seed
 * helpers in e2e/setup/supabase-seed.ts write to the real instance instead.
 *
 * For prod runs use playwright.prod.config.ts.
 */
export default defineConfig({
    testDir: "./e2e",
    fullyParallel: false, // sequential — specs share test-account state
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: "html",
    // Matches the prod config's budget. Login alone (Supabase auth round trip)
    // can outlast the 30 s default, and a test killed mid-login reports a
    // misleading failure for a login that actually succeeded.
    timeout: 120_000,
    expect: { timeout: 15_000 },
    use: {
        baseURL: "http://localhost:3000",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
    webServer: {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
