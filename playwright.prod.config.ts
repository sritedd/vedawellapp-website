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
// Specs that call the API directly (guardian-ai) build absolute URLs from
// E2E_BASE_URL rather than the fixture baseURL. Default it here so this config is
// self-sufficient: the 2026-09-09 run without it posted to localhost:3000 and
// reported eight product "failures" that were ECONNREFUSED.
process.env.E2E_BASE_URL ||= "https://vedawellapp.com";

export default defineConfig({
    testDir: "./e2e",
    testIgnore: ["**/guardian-smoke.spec.ts"],
    fullyParallel: false, // sequential — tests share the prod DB test-user state
    forbidOnly: true,
    retries: 1,
    workers: 1,
    // Per-test budget. The 30 s default is too small for prod: these tests log in
    // (Netlify cold start + Supabase auth round trip), navigate to the project
    // list, open a project, then switch tabs — each a real network hop. Tests
    // sitting near 30 s passed or failed at random, which read as product
    // flakiness but was purely the budget.
    //
    // Must stay comfortably ABOVE the 45 s login wait inside the specs, or the
    // test is killed mid-wait and reports a misleading "login did not complete"
    // for a login that actually succeeded.
    timeout: 120_000,
    expect: { timeout: 15_000 },
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
        {
            // The money loop is used on site, on a phone — that is the whole point
            // of the camera-first capture — but every test ran at desktop width
            // (guide/19 §2.9). Scoped to NSW's loop tests so it adds a couple of
            // minutes, not a second full suite. A mobile VIEWPORT on chromium
            // rather than a device preset: layout is what breaks, and this needs
            // no extra browser download in CI.
            name: "mobile-loop",
            use: {
                ...devices["Desktop Chrome"],
                viewport: { width: 375, height: 812 },
                hasTouch: true,
            },
            grep: /NSW: (Login and reach dashboard|Project is really|Stage Gate renders|Defect, variation|Complete all stages)/,
            // Both projects build the same "E2E NSW Build" fixture, and each
            // describe's beforeAll cleans that name — so if they interleaved they
            // would delete each other's project mid-run, which is exactly how the
            // 8-state suite used to fail. `dependencies` is the documented
            // guarantee that chromium finishes first. (Running --project=mobile-loop
            // alone therefore pulls the desktop suite with it; that is the trade.)
            dependencies: ["chromium"],
        },
    ],
});
