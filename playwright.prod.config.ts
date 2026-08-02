import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for running E2E specs against the LIVE production site.
 *
 * Differences from playwright.config.ts (localhost):
 * - baseURL points at prod (override with E2E_BASE_URL)
 * - No webServer block — we never boot a dev server for a prod run
 * - No globalSetup/globalTeardown — those manage the local `guardian_test`
 *   Postgres, which is irrelevant (and misleading) when driving the live site
 * - Retries=1 — prod has real network jitter; a single retry separates flake
 *   from failure without masking real bugs
 *
 * Run: npx playwright test --config=playwright.prod.config.ts guardian-full-workflow
 *
 * NOTE: guardian-smoke.spec.ts is EXCLUDED — it seeds a local Postgres that the
 * deployed app cannot read. It only makes sense against a locally-configured app.
 */
export default defineConfig({
    testDir: "./e2e",
    testIgnore: ["**/guardian-smoke.spec.ts"],
    fullyParallel: false, // sequential — tests share the prod DB test-user state
    forbidOnly: true,
    retries: 1,
    workers: 1,
    reporter: [["html", { open: "never" }], ["list"]],
    use: {
        baseURL: process.env.E2E_BASE_URL || "https://vedawellapp.com",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
});
