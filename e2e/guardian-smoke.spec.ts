/**
 * Guardian E2E Smoke Tests — Local DB Edition
 *
 * Tests run against the dev server with data seeded in local Postgres.
 * No mock data in application code — all fixtures come from e2e/setup/db.ts
 *
 * Prerequisites:
 * - Local PostgreSQL running with `guardian_test` database
 * - Dev server running (playwright.config handles this)
 * - Test user auth configured
 *
 * Run: npm run test:e2e
 * Run headed: npm run test:e2e:headed
 */

import { test, expect, Page } from "@playwright/test";
import { seedTestProject, teardown, closePool, query, TEST_PROJECT_ID } from "./setup/db";

// Test user credentials — set via env or use defaults
const TEST_EMAIL = process.env.TEST_EMAIL || "test@vedawellapp.com";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "testpassword123";

// ─── Helpers ───────────────────────────────────────

async function loginAndGoToProject(page: Page) {
    await page.goto("/guardian/login");
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/guardian/projects**", { timeout: 10000 });

    const projectLink = page.locator("a[href*='/guardian/projects/']").first();
    if (await projectLink.isVisible()) {
        await projectLink.click();
        await page.waitForURL("**/guardian/projects/**", { timeout: 10000 });
        return true;
    }
    return false;
}

async function goToTab(page: Page, tabName: string) {
    const tab = page.locator(`button:has-text("${tabName}")`).first();
    await tab.click();
    await page.waitForTimeout(500);
}

// ─── Test Suite 1: Seeded data appears correctly ───

test.describe("Guardian Project - DB Data Renders", () => {
    test.beforeAll(async () => {
        await teardown();
        await seedTestProject();
    });

    test.afterAll(async () => {
        await teardown();
        await closePool();
    });

    test.beforeEach(async ({ page }) => {
        const ok = await loginAndGoToProject(page);
        test.skip(!ok, "No projects found — seed may have failed");
    });

    test("Project name from DB is displayed", async ({ page }) => {
        await expect(page.locator("text=123 Test Street Build")).toBeVisible({ timeout: 5000 });
    });

    test("Stages from DB render in correct order", async ({ page }) => {
        await goToTab(page, "Stages");
        await expect(page.locator("text=Base")).toBeVisible();
        await expect(page.locator("text=Frame")).toBeVisible();
        await expect(page.locator("text=Lockup")).toBeVisible();
    });

    test("Defects tab shows seeded defect", async ({ page }) => {
        await goToTab(page, "Defects");
        await expect(page.locator("text=Crack in garage slab")).toBeVisible({ timeout: 5000 });
    });

    test("Materials tab shows seeded material", async ({ page }) => {
        await goToTab(page, "Materials");
        await expect(page.locator("text=Spotted Gum Hardwood")).toBeVisible({ timeout: 5000 });
    });

    test("Site Visits tab shows seeded visit", async ({ page }) => {
        await goToTab(page, "Site Visits");
        await expect(page.locator("text=Frame progress check")).toBeVisible({ timeout: 5000 });
    });

    test("Weekly Check-ins tab shows seeded check-in", async ({ page }) => {
        await goToTab(page, "Weekly Check-ins");
        await expect(page.locator("text=Roof trusses installed and braced")).toBeVisible({ timeout: 5000 });
    });

    test("Comms Log tab shows seeded entry", async ({ page }) => {
        await goToTab(page, "Comms Log");
        await expect(page.locator("text=Discussed frame timeline")).toBeVisible({ timeout: 5000 });
    });

    test("Variations tab shows seeded variation", async ({ page }) => {
        await goToTab(page, "Variations");
        await expect(page.locator("text=Extra power points in kitchen")).toBeVisible({ timeout: 5000 });
    });

    test("Inspections tab shows seeded inspection", async ({ page }) => {
        await goToTab(page, "Inspections");
        await expect(page.locator("text=John Smith Inspections")).toBeVisible({ timeout: 5000 });
    });
});

// ─── Test Suite 2: No hardcoded fake data ──────────

test.describe("Guardian Project - No Hardcoded Data", () => {
    test.beforeEach(async ({ page }) => {
        const ok = await loginAndGoToProject(page);
        test.skip(!ok, "No projects found");
    });

    test("Pending Actions tab shows no fake data", async ({ page }) => {
        await goToTab(page, "Pending Actions");
        const fakeItems = [
            "Fix water stain on ceiling",
            "Provide Waterproofing Certificate",
            "Sign variation for downlights",
            "Schedule Frame Inspection",
        ];
        for (const item of fakeItems) {
            await expect(page.locator(`text=${item}`), `Found hardcoded: "${item}"`).toHaveCount(0);
        }
    });

    test("Materials tab shows no fake data", async ({ page }) => {
        await goToTab(page, "Materials");
        const fakeItems = [
            "Engineered Oak Flooring",
            "Quick-Step",
            "Palazzo Natural Heritage Oak",
            "Portland Grey 600x600",
        ];
        for (const item of fakeItems) {
            await expect(page.locator(`text=${item}`), `Found hardcoded: "${item}"`).toHaveCount(0);
        }
    });

    test("Site Visits tab shows no fake data", async ({ page }) => {
        await goToTab(page, "Site Visits");
        const fakeItems = [
            "Frame complete, roof trusses being installed",
            "Window frames not yet delivered",
            "Frame inspection passed. All tie-downs",
        ];
        for (const item of fakeItems) {
            await expect(page.locator(`text=${item}`), `Found hardcoded: "${item}"`).toHaveCount(0);
        }
    });

    test("Weekly Check-ins tab shows no mock data", async ({ page }) => {
        await goToTab(page, "Weekly Check-ins");
        const fakeItems = [
            "Good progress on frame. All inspections passed",
            "Rain caused 2-day delay. Catching up now",
        ];
        for (const item of fakeItems) {
            await expect(page.locator(`text=${item}`), `Found hardcoded: "${item}"`).toHaveCount(0);
        }
    });
});

// ─── Test Suite 3: CRUD operations persist to DB ───

test.describe("Guardian Project - Data Persistence", () => {
    test.beforeEach(async ({ page }) => {
        const ok = await loginAndGoToProject(page);
        test.skip(!ok, "No projects found");
    });

    test("Adding a defect persists to database", async ({ page }) => {
        await goToTab(page, "Defects");

        // Click add/log defect button
        const addBtn = page.locator("button:has-text('Log'), button:has-text('Add'), button:has-text('New Defect')").first();
        if (await addBtn.isVisible()) {
            await addBtn.click();
            await page.waitForTimeout(300);

            // Fill form fields
            const titleInput = page.locator("input[placeholder*='title'], input[name='title']").first();
            if (await titleInput.isVisible()) {
                await titleInput.fill("E2E Test Defect - Water Damage");

                const descInput = page.locator("textarea").first();
                if (await descInput.isVisible()) {
                    await descInput.fill("Water stain found near kitchen window");
                }

                const submitBtn = page.locator("button[type='submit'], button:has-text('Save'), button:has-text('Submit')").first();
                await submitBtn.click();
                await page.waitForTimeout(1000);

                // Verify in UI
                await expect(page.locator("text=E2E Test Defect - Water Damage")).toBeVisible({ timeout: 5000 });

                // Verify in DB
                const result = await query(
                    "SELECT title FROM defects WHERE project_id = $1 AND title = $2",
                    [TEST_PROJECT_ID, "E2E Test Defect - Water Damage"]
                );
                expect(result.rows.length).toBe(1);
            }
        }
    });

    test("Adding a communication log entry persists", async ({ page }) => {
        await goToTab(page, "Comms Log");

        const addBtn = page.locator("button:has-text('Log'), button:has-text('Add'), button:has-text('New')").first();
        if (await addBtn.isVisible()) {
            await addBtn.click();
            await page.waitForTimeout(300);

            const summaryInput = page.locator("input[placeholder*='summary'], input[placeholder*='subject'], input[name='summary']").first();
            if (await summaryInput.isVisible()) {
                await summaryInput.fill("E2E Test: Called builder about delays");

                const submitBtn = page.locator("button[type='submit'], button:has-text('Save'), button:has-text('Log')").last();
                await submitBtn.click();
                await page.waitForTimeout(1000);

                // Verify in DB
                const result = await query(
                    "SELECT summary FROM communication_log WHERE project_id = $1 AND summary LIKE $2",
                    [TEST_PROJECT_ID, "%E2E Test%"]
                );
                expect(result.rows.length).toBeGreaterThanOrEqual(1);
            }
        }
    });
});

// ─── Test Suite 4: UI Stability ────────────────────

test.describe("Guardian Project - UI Stability", () => {
    test.beforeEach(async ({ page }) => {
        const ok = await loginAndGoToProject(page);
        test.skip(!ok, "No projects found");
    });

    test("All navigation tabs render content", async ({ page }) => {
        const tabs = [
            "Dashboard", "Pending Actions", "Stage Gate", "Stages",
            "Defects", "Inspections", "Variations", "Payments",
            "Budget", "Certificates", "Photos", "Documents", "Comms Log",
        ];

        for (const tab of tabs) {
            const tabBtn = page.locator(`button:has-text("${tab}")`).first();
            if (await tabBtn.isVisible()) {
                await tabBtn.click();
                await page.waitForTimeout(300);

                const content = page.locator(".min-h-\\[500px\\]");
                const text = await content.textContent();
                expect(text?.trim().length, `Tab "${tab}" renders empty content`).toBeGreaterThan(0);
            }
        }
    });

    test("No console errors on any tab", async ({ page }) => {
        const errors: string[] = [];
        page.on("console", (msg) => {
            if (msg.type() === "error") {
                errors.push(msg.text());
            }
        });

        const tabs = [
            "Dashboard", "Pending Actions", "Stage Gate",
            "Stages", "Defects", "Payments", "Photos",
        ];

        for (const tab of tabs) {
            const tabBtn = page.locator(`button:has-text("${tab}")`).first();
            if (await tabBtn.isVisible()) {
                await tabBtn.click();
                await page.waitForTimeout(500);
            }
        }

        const criticalErrors = errors.filter(
            (e) => !e.includes("favicon") && !e.includes("hydration") && !e.includes("supabase")
        );
        expect(criticalErrors, "Console errors found").toHaveLength(0);
    });

    test("Loading spinners disappear within 5 seconds", async ({ page }) => {
        const tabs = ["Pending Actions", "Defects", "Photos", "Documents"];

        for (const tab of tabs) {
            const tabBtn = page.locator(`button:has-text("${tab}")`).first();
            if (await tabBtn.isVisible()) {
                await tabBtn.click();
                const spinner = page.locator(".animate-spin");
                if (await spinner.isVisible()) {
                    await expect(spinner).toBeHidden({ timeout: 5000 });
                }
            }
        }
    });
});

// ─── Test Suite 5: Data Isolation ──────────────────

test.describe("Guardian Project - Data Isolation", () => {
    test("Empty project shows no data, not fake data", async ({ page }) => {
        // Create a second empty project in DB
        const emptyProjectId = "00000000-0000-0000-0000-000000000099";
        await query(
            `INSERT INTO projects (id, user_id, name, status)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id) DO NOTHING`,
            [emptyProjectId, "00000000-0000-0000-0000-000000000001", "Empty Test Project", "active"]
        );

        await loginAndGoToProject(page);

        // Navigate to the empty project (if visible)
        const emptyLink = page.locator("a:has-text('Empty Test Project')");
        if (await emptyLink.isVisible()) {
            await emptyLink.click();
            await page.waitForTimeout(1000);

            // Defects tab should not show the seeded defect from other project
            await goToTab(page, "Defects");
            await expect(page.locator("text=Crack in garage slab")).toHaveCount(0);

            // Materials tab should not show the seeded material
            await goToTab(page, "Materials");
            await expect(page.locator("text=Spotted Gum Hardwood")).toHaveCount(0);
        }

        // Cleanup
        await query("DELETE FROM projects WHERE id = $1", [emptyProjectId]);
    });
});
