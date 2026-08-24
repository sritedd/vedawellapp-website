/**
 * Guardian Full Workflow E2E Tests — all 8 states/territories
 *
 * Simulates the complete homeowner journey:
 *   Login → Create Project → Walk through stages → Log data → Close project
 *
 * Expected stages are DERIVED from src/data/australian-build-workflows.json at
 * run time rather than hardcoded. Hardcoded copies drifted badly before: VIC was
 * pinned at 2 stages when the JSON had grown to 10, and QLD/WA were described as
 * having no stages at all when both have full workflows. Deriving means the spec
 * can never disagree with the data the app itself seeds from.
 *
 * Uses Supabase cloud for auth + data (service role key bypasses RLS).
 * No mock data in application code.
 *
 * Run (local):  npm run test:e2e
 * Run (prod):   npx playwright test --config=playwright.prod.config.ts guardian-full-workflow
 * One state:    ... guardian-full-workflow -g "NSW"
 */

import { test, expect, Page } from "@playwright/test";
import {
    ensureTestUser,
    createTestProject,
    seedProjectData,
    updateStageStatus,
    completeProject,
    deleteTestProject,
    cleanupE2EProjects,
    getProjectStages,
    TEST_EMAIL,
    TEST_PASSWORD,
} from "./setup/supabase-seed";

// ─── Config ────────────────────────────────────────

import workflowData from "../src/data/australian-build-workflows.json";

/** Stage names for a state's new_build workflow, straight from the app's own data. */
function stagesFor(stateCode: string): string[] {
    const workflows = (workflowData as {
        workflows?: Record<string, Record<string, { stages?: Array<{ name: string }> }>>;
    }).workflows;
    return workflows?.new_build?.[stateCode]?.stages?.map((s) => s.name) ?? [];
}

const STATE_META: Record<string, { name: string; insuranceLabel: string }> = {
    NSW: { name: "New South Wales", insuranceLabel: "HBCF Policy #" },
    VIC: { name: "Victoria", insuranceLabel: "DBI Policy #" },
    QLD: { name: "Queensland", insuranceLabel: "QBCC Insurance #" },
    WA: { name: "Western Australia", insuranceLabel: "Home Warranty Policy #" },
    SA: { name: "South Australia", insuranceLabel: "BIG Policy #" },
    TAS: { name: "Tasmania", insuranceLabel: "Insurance Policy #" },
    ACT: { name: "Australian Capital Territory", insuranceLabel: "Insurance Policy #" },
    NT: { name: "Northern Territory", insuranceLabel: "Insurance Policy #" },
};

const STATE_CONFIGS: Record<string, {
    name: string;
    expectedStages: string[];
    insuranceLabel: string;
}> = Object.fromEntries(
    Object.entries(STATE_META).map(([code, meta]) => [
        code,
        { ...meta, expectedStages: stagesFor(code) },
    ])
);

// ─── Helpers ───────────────────────────────────────

async function login(page: Page) {
    await page.goto("/guardian/login");
    await page.waitForLoadState("networkidle");

    // If already logged in, the page redirects to dashboard
    if (page.url().includes("/dashboard") || page.url().includes("/projects")) {
        return;
    }

    // Wait for hydration before filling — a not-yet-interactive React form
    // silently drops the value and submits empty credentials.
    await page.waitForSelector('input[type="email"]', { state: "visible", timeout: 30_000 });
    await page.waitForTimeout(1_000);

    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // 45 s, not 15 s: against prod a Netlify cold start plus the Supabase auth
    // round trip regularly exceeds 15 s, and a timeout here fails every test in
    // the file while the product is perfectly healthy.
    try {
        await page.waitForURL(/\/guardian\/(dashboard|projects)/, { timeout: 45_000 });
    } catch {
        throw new Error(
            `Login did not complete for ${TEST_EMAIL} within 45 s (landed on ${page.url()}). ` +
            `Check E2E_PRO_PASSWORD in .env.local is current — prod-accounts.mjs rotates it.`
        );
    }
}

/**
 * The project page uses a two-level nav (2026-03 restructure): five top sections
 * — Home / Build / Issues / Evidence / More — each revealing its own sub-tabs.
 * Clicking a sub-tab like "Stages" only works once its parent section is open,
 * so map each sub-tab to its section and click the parent first. Before this,
 * every sub-tab lookup silently returned false and the assertions that followed
 * failed against a page that was actually working.
 */
const TAB_SECTION: Record<string, string> = {
    Dashboard: "Home", "Pending Actions": "Home",
    "Stage Gate": "Build", Timeline: "Build", Stages: "Build",
    Inspections: "Build", Certificates: "Build", "NCC 2025": "Build",
    Defects: "Issues", Variations: "Issues", "Red Flags": "Issues",
    Disputes: "Issues", "Pre-Handover": "Issues",
    Photos: "Evidence", Documents: "Evidence", Comms: "Evidence",
    "Check-ins": "Evidence", "Site Visits": "Evidence",
    // "More" is a card grid of low-frequency tools, not a tab strip — but it
    // opens the same way, so the same helper works.
    Payments: "More", Budget: "More", "Cost Check": "More", "Builder Score": "More",
    "Rate Builder": "More", Materials: "More", "Builder Speed": "More",
    "Tribunal Pack": "More", "Contract Review": "More", Checklists: "More",
    Export: "More", Reports: "More", Notifications: "More", Alerts: "More",
    Settings: "More", "Share Progress": "More", Team: "More",
    "Escalate Builder": "More", "Claim Review": "More", "Activity Log": "More",
    "Calendar Export": "More", "Site Diary": "More", "Parse Contract": "More",
};

/**
 * Tab labels changed in the 2026-03 five-section restructure but the spec kept
 * asking for the old ones, so those lookups silently returned false and the
 * assertions after them failed against a page that was working fine.
 */
const TAB_ALIASES: Record<string, string> = {
    "Comms Log": "Comms",
    "Weekly Check-ins": "Check-ins",
    "Check-Ins": "Check-ins",
};

async function goToTab(page: Page, rawLabel: string): Promise<boolean> {
    const tabLabel = TAB_ALIASES[rawLabel] ?? rawLabel;
    const section = TAB_SECTION[tabLabel];
    if (section) {
        const sectionBtn = page.locator(`button:text-is("${section}")`).first();
        if (await sectionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await sectionBtn.click();
            await page.waitForTimeout(600);
        }
    }

    // Exact match first so "Stages" doesn't match "Stage Gate".
    for (const locator of [
        page.locator(`button:text-is("${tabLabel}")`).first(),
        page.locator(`button:has-text("${tabLabel}")`).first(),
    ]) {
        if (await locator.isVisible({ timeout: 2500 }).catch(() => false)) {
            await locator.click();
            await page.waitForTimeout(800);
            return true;
        }
    }
    return false;
}

async function navigateToProject(page: Page, projectName: string): Promise<string | null> {
    await page.goto("/guardian/projects");
    await page.waitForLoadState("networkidle");

    const projectLink = page.locator(`a:has-text("${projectName}")`).first();
    if (!(await projectLink.isVisible({ timeout: 5000 }).catch(() => false))) {
        return null;
    }
    await projectLink.click();
    await page.waitForURL("**/guardian/projects/**", { timeout: 10000 });

    return page.url().split("/projects/")[1]?.split("?")[0]?.split("/")[0] || null;
}

// ─── Full workflow per state ───────────────────────

for (const [stateCode, config] of Object.entries(STATE_CONFIGS)) {
    test.describe(`Full Workflow — ${stateCode} (${config.name})`, () => {
        const projectName = `E2E ${stateCode} Build`;
        let projectId: string | null = null;

        test.beforeAll(async () => {
            // Ensure test user in Supabase Auth + profiles
            await ensureTestUser();
            // Clean any leftover E2E projects for this state
            await cleanupE2EProjects();
            // Create the test project with state-specific stages
            projectId = await createTestProject(await ensureTestUser(), stateCode, projectName);
        });

        test.afterAll(async () => {
            if (projectId) {
                await deleteTestProject(projectId);
            }
        });

        // ── Step 1: Login ──────────────────────────

        test(`${stateCode}: Login and reach dashboard`, async ({ page }) => {
            await login(page);
            const url = page.url();
            expect(
                url.includes("/guardian/dashboard") || url.includes("/guardian/projects"),
                `Expected dashboard or projects page, got: ${url}`
            ).toBe(true);
        });

        // ── Step 2: Project exists and is visible ──

        test(`${stateCode}: Project visible in project list`, async ({ page }) => {
            await login(page);
            await page.goto("/guardian/projects");
            await page.waitForLoadState("networkidle");

            await expect(
                page.locator(`text=${projectName}`).first()
            ).toBeVisible({ timeout: 5000 });
        });

        // ── Step 3: Verify stages seeded ───────────

        test(`${stateCode}: Stages seeded correctly from workflow`, async ({ page }) => {
            await login(page);
            const pid = await navigateToProject(page, projectName);
            expect(pid).toBeTruthy();

            await goToTab(page, "Stages");

            // Every state has a new_build workflow, so this list is never empty.
            // Guard anyway: an empty list would mean the JSON lost a state, which
            // is a data regression worth failing loudly on.
            expect(
                config.expectedStages.length,
                `${stateCode} has no new_build stages in australian-build-workflows.json`
            ).toBeGreaterThan(0);

            for (const stageName of config.expectedStages) {
                await expect(
                    page.locator(`text=${stageName}`).first(),
                    `Stage "${stageName}" not found for ${stateCode}`
                ).toBeVisible({ timeout: 5000 });
            }

            // Cross-check via API
            if (projectId) {
                const dbStages = await getProjectStages(projectId);
                expect(dbStages.length).toBe(config.expectedStages.length);
                for (let i = 0; i < config.expectedStages.length; i++) {
                    expect(dbStages[i].name).toBe(config.expectedStages[i]);
                    expect(dbStages[i].status).toBe("pending");
                }
            }
        });

        // ── Step 4: Stage transitions ──────────────

        if (STATE_CONFIGS[stateCode].expectedStages.length > 0) {
            test(`${stateCode}: Progress through stages`, async ({ page }) => {
                if (!projectId) { test.skip(true, "No project"); return; }

                const stages = config.expectedStages;
                for (let i = 0; i < Math.min(stages.length, 3); i++) {
                    await updateStageStatus(projectId, stages[i], "in_progress");
                    await updateStageStatus(projectId, stages[i], "completed");
                }

                // Verify UI
                await login(page);
                await navigateToProject(page, projectName);
                await goToTab(page, "Stages");

                // Completed stages should still show
                for (let i = 0; i < Math.min(stages.length, 3); i++) {
                    await expect(
                        page.locator(`text=${stages[i]}`).first()
                    ).toBeVisible({ timeout: 5000 });
                }

                // DB check
                const dbStages = await getProjectStages(projectId);
                for (let i = 0; i < Math.min(stages.length, 3); i++) {
                    expect(dbStages[i].status).toBe("completed");
                }
            });
        }

        // ── Step 5: Seed data and verify on tabs ───

        test(`${stateCode}: Defect, variation, comms visible on tabs`, async ({ page }) => {
            if (!projectId) { test.skip(true, "No project"); return; }

            // Seed via Supabase admin
            await seedProjectData(projectId, stateCode);

            await login(page);
            await navigateToProject(page, projectName);

            // Defects
            await goToTab(page, "Defects");
            await page.waitForTimeout(1000);
            // Reload to pick up seeded data
            await page.reload();
            await page.waitForLoadState("networkidle");
            await goToTab(page, "Defects");
            await expect(
                page.locator(`text=${stateCode} E2E Defect`).first()
            ).toBeVisible({ timeout: 10000 });

            // Variations
            await goToTab(page, "Variations");
            await expect(
                page.locator(`text=${stateCode} E2E Variation`).first()
            ).toBeVisible({ timeout: 10000 });

            // Comms Log
            await goToTab(page, "Comms Log");
            await expect(
                page.locator(`text=${stateCode} E2E Comms`).first()
            ).toBeVisible({ timeout: 10000 });
        });

        // ── Step 6: Stage Gate ─────────────────────

        test(`${stateCode}: Stage Gate renders`, async ({ page }) => {
            await login(page);
            await navigateToProject(page, projectName);
            await goToTab(page, "Stage Gate");
            await page.waitForTimeout(1000);

            // The old ".min-h-[500px]" wrapper stopped existing in the 2026-03
            // restructure, so that selector matched nothing and this assertion was
            // effectively testing undefined rather than the rendered panel.
            const content = await page.locator("main").last().textContent();
            expect(content?.length).toBeGreaterThan(0);
        });

        // ── Step 7: Materials, Visits, Check-ins ───

        test(`${stateCode}: Material, site visit, check-in on tabs`, async ({ page }) => {
            // Data was seeded in step 5 via seedProjectData
            await login(page);
            await navigateToProject(page, projectName);

            await goToTab(page, "Materials");
            await page.reload();
            await page.waitForLoadState("networkidle");
            await goToTab(page, "Materials");
            await expect(
                page.locator(`text=${stateCode} E2E Colorbond`).first()
            ).toBeVisible({ timeout: 10000 });

            await goToTab(page, "Site Visits");
            await expect(
                page.locator(`text=${stateCode} E2E site check`).first()
            ).toBeVisible({ timeout: 10000 });

            await goToTab(page, "Weekly Check-ins");
            await expect(
                page.locator(`text=${stateCode} E2E - Frame bracing done`).first()
            ).toBeVisible({ timeout: 10000 });
        });

        // ── Step 8: Complete and close project ─────

        test(`${stateCode}: Complete all stages and close project`, async ({ page }) => {
            if (!projectId) { test.skip(true, "No project"); return; }

            await completeProject(projectId);

            await login(page);
            await navigateToProject(page, projectName);

            // Dashboard should render
            await goToTab(page, "Dashboard");
            // The old ".min-h-[500px]" wrapper stopped existing in the 2026-03
            // restructure, so that selector matched nothing and this assertion was
            // effectively testing undefined rather than the rendered panel.
            const content = await page.locator("main").last().textContent();
            expect(content?.length).toBeGreaterThan(0);

            // DB verification
            const dbStages = await getProjectStages(projectId);
            for (const s of dbStages) {
                expect(s.status).toBe("completed");
            }
        });

        // ── Step 9: No console errors ──────────────

        test(`${stateCode}: No console errors during workflow`, async ({ page }) => {
            const errors: string[] = [];
            page.on("console", (msg) => {
                if (msg.type() === "error") errors.push(msg.text());
            });

            await login(page);
            await navigateToProject(page, projectName);

            const keyTabs = ["Dashboard", "Stages", "Defects", "Inspections", "Variations", "Budget"];
            for (const tab of keyTabs) {
                await goToTab(page, tab);
                await page.waitForTimeout(300);
            }

            const criticalErrors = errors.filter(
                (e) =>
                    !e.includes("favicon") &&
                    !e.includes("hydration") &&
                    !e.includes("Failed to fetch") &&
                    !e.includes("Failed to load resource") &&
                    !e.includes("Content Security Policy") &&
                    !(e.includes("403") && (e.includes("storage") || e.includes("favicon"))) &&
                    !(e.includes("404") && (e.includes("favicon") || e.includes(".ico") || e.includes("analytics")))
            );
            expect(criticalErrors, `Console errors in ${stateCode}`).toHaveLength(0);
        });
    });
}
