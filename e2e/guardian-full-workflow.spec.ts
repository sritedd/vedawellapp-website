/**
 * Guardian Full Workflow E2E Tests — All 4 State Codes
 *
 * Simulates the complete homeowner journey:
 *   Login → Create Project → Walk through stages → Log data → Close project
 *
 * Tests each state: NSW (8 stages), VIC (2 stages), QLD (no stages), WA (no stages)
 * Uses Supabase cloud for auth + data (service role key bypasses RLS).
 * No mock data in application code.
 *
 * Run: npm run test:e2e
 * Run one state: npx @playwright/test test guardian-full-workflow -g "NSW"
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

const STATE_CONFIGS: Record<string, {
    name: string;
    expectedStages: string[];
    insuranceLabel: string;
}> = {
    NSW: {
        name: "New South Wales",
        expectedStages: [
            "Site Start",
            "Slab / Footings",
            "Frame Stage",
            "Lockup / Enclosed",
            "Pre-Plasterboard",
            "Fixing Stage",
            "Practical Completion (PC)",
            "Warranty Period",
        ],
        insuranceLabel: "HBCF Policy #",
    },
    VIC: {
        name: "Victoria",
        expectedStages: [
            "Planning Permit",
            "Building Permit",
        ],
        insuranceLabel: "DBI Policy #",
    },
    QLD: {
        name: "Queensland",
        expectedStages: [
            "Site Start",
            "Base / Slab",
            "Frame Stage",
            "Enclosed / Lockup",
            "Fixing Stage",
            "Practical Completion",
            "Warranty Period",
        ],
        insuranceLabel: "QBCC Insurance #",
    },
    WA: {
        name: "Western Australia",
        expectedStages: [
            "Site Start",
            "Slab Stage",
            "Plate Height / Wall Frame",
            "Roof On",
            "Lockup & Weatherproof",
            "Fixing Stage",
            "Practical Completion (PCI)",
            "Warranty Period",
        ],
        insuranceLabel: "Home Warranty Policy #",
    },
};

// ─── Helpers ───────────────────────────────────────

async function login(page: Page) {
    await page.goto("/guardian/login");
    await page.waitForLoadState("networkidle");

    // If already logged in, the page redirects to dashboard
    if (page.url().includes("/dashboard") || page.url().includes("/projects")) {
        return;
    }

    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for redirect away from login
    await page.waitForURL(/\/(dashboard|projects)/, { timeout: 15000 });
}

async function goToTab(page: Page, tabLabel: string): Promise<boolean> {
    const tabBtn = page.locator(`button:has-text("${tabLabel}")`).first();
    if (await tabBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await tabBtn.click();
        await page.waitForTimeout(500);
        return true;
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

            if (config.expectedStages.length > 0) {
                for (const stageName of config.expectedStages) {
                    await expect(
                        page.locator(`text=${stageName}`).first(),
                        `Stage "${stageName}" not found for ${stateCode}`
                    ).toBeVisible({ timeout: 5000 });
                }
            } else {
                // QLD/WA: empty is expected — just verify no crash
                const content = await page.locator(".min-h-\\[500px\\]").textContent();
                expect(content).toBeDefined();
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

            const content = await page.locator(".min-h-\\[500px\\]").textContent();
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
            const content = await page.locator(".min-h-\\[500px\\]").textContent();
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
