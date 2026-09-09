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
    getProjectState,
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
    Dashboard: "Home", "What to do now": "Home", "Watch-outs": "Home",
    "Stage Gate": "Build", Stages: "Build", Inspections: "Build", Certificates: "Build",
    "Pre-Handover": "Build", Timeline: "Build", "NCC 2025": "Build",
    "Progress claims": "Pay", "Claim Review": "Pay", Variations: "Pay", Budget: "Pay", "PC/PS Tracker": "Pay",
    Photos: "Evidence", Defects: "Evidence", Documents: "Evidence", Messages: "Evidence",
    "Site Visits": "Evidence", "Check-ins": "Evidence",
    // "More" is a card grid of low-frequency tools, not a tab strip — but it
    // opens the same way, so the same helper works.
    "Cost Check": "More", "Builder Score": "More", "Rate Builder": "More", Materials: "More",
    "Builder Speed": "More", "Evidence pack": "More", "Dispute guide": "More",
    "Contract Review": "More", Checklists: "More", Export: "More", Reports: "More",
    Notifications: "More", Alerts: "More", Settings: "More", "Share Progress": "More",
    Team: "More", "Formal notices": "More", "Activity Log": "More", "Calendar Export": "More",
    "Site Diary": "More", "Parse Contract": "More", "Import Report": "More", "CSV Import": "More",
};

/**
 * Tab labels changed in the 2026-03 five-section restructure but the spec kept
 * asking for the old ones, so those lookups silently returned false and the
 * assertions after them failed against a page that was working fine.
 */
const TAB_ALIASES: Record<string, string> = {
    // 2026-03 five-section labels
    "Comms Log": "Messages",
    "Weekly Check-ins": "Check-ins",
    "Check-Ins": "Check-ins",
    // 2026-09 owner-vocabulary labels (guide/19 §2.2, §2.7, §1.5)
    Comms: "Messages",
    "Pending Actions": "What to do now",
    Payments: "Progress claims",
    "Red Flags": "Watch-outs",
    "Tribunal Pack": "Evidence pack",
    "Escalate Builder": "Formal notices",
    Disputes: "Dispute guide",
};

/**
 * Click a top-level section and CONFIRM it actually took effect.
 *
 * The section strip is server-rendered, so its tabs are present and clickable
 * before React hydrates — an early click lands on a not-yet-live handler and
 * silently does nothing. Under a full 8-state run the machine is loaded enough
 * for that race to open up, which is why a spec that passed state-by-state
 * failed inside the long suite. Fire-and-forget clicking hid it; checking
 * aria-selected and retrying does not.
 */
async function openSection(page: Page, section: string): Promise<boolean> {
    const byRole = page.getByRole("tab", { name: section, exact: true }).first();
    const byText = page.locator(`button:text-is("${section}")`).first();

    for (let attempt = 0; attempt < 3; attempt++) {
        for (const btn of [byRole, byText]) {
            if (!(await btn.isVisible({ timeout: 2000 }).catch(() => false))) continue;
            if ((await btn.getAttribute("aria-selected").catch(() => null)) === "true") return true;

            await btn.click({ timeout: 5000 }).catch(() => { });
            await page.waitForTimeout(500);

            const after = await btn.getAttribute("aria-selected").catch(() => null);
            if (after === "true") return true;
            // No aria-selected on this element at all — the click is unverifiable,
            // so accept it rather than burning the retry budget re-clicking a
            // control that will never report its state.
            if (after === null) return true;
        }
        await page.waitForTimeout(600);
    }
    return false;
}

/**
 * Open a tab, or THROW naming the tab that could not be opened.
 *
 * This returned a boolean that all 13 call sites discarded, so a failed
 * navigation left the test asserting against whatever page it happened to be on
 * — reporting "expect(locator).toBeVisible() failed" for a perfectly healthy app
 * that simply was not showing the requested tab. The assertion named the missing
 * element instead of the navigation that never happened, which is why these
 * failures were unreadable. Fail where the problem actually is.
 */
async function goToTab(page: Page, rawLabel: string): Promise<void> {
    const tabLabel = TAB_ALIASES[rawLabel] ?? rawLabel;
    const section = TAB_SECTION[tabLabel];

    for (let attempt = 0; attempt < 2; attempt++) {
        if (section) await openSection(page, section);

        // Exact match first so "Stages" doesn't match "Stage Gate".
        for (const locator of [
            page.getByRole("tab", { name: tabLabel, exact: true }).first(),
            page.locator(`button:text-is("${tabLabel}")`).first(),
            page.locator(`button:has-text("${tabLabel}")`).first(),
        ]) {
            if (await locator.isVisible({ timeout: 2000 }).catch(() => false)) {
                await locator.click({ timeout: 5000 });
                await page.waitForTimeout(800);
                return;
            }
        }
    }

    throw new Error(
        `goToTab: could not open tab "${rawLabel}"` +
        (section ? ` (inside section "${section}")` : "") +
        `. URL=${page.url()}`
    );
}

/**
 * Open a project by name, or THROW listing what the project page actually showed.
 *
 * Returning null on failure meant the caller sailed on and asserted against the
 * project LIST page, so a missing fixture surfaced as "element not visible"
 * rather than "the project isn't there". Both of the hardest-to-read failures in
 * the 8-state run were this.
 */
async function navigateToProject(page: Page, projectName: string): Promise<string> {
    await page.goto("/guardian/projects");
    await page.waitForLoadState("networkidle");

    const projectLink = page.locator(`a:has-text("${projectName}")`).first();
    if (!(await projectLink.isVisible({ timeout: 5000 }).catch(() => false))) {
        const listed = (await page.locator('a[href*="/guardian/projects/"]').allInnerTexts())
            .map((t) => t.replace(/s+/g, " ").trim())
            .filter(Boolean);
        throw new Error(
            `navigateToProject: "${projectName}" is not in the project list. ` +
            `Listed: ${listed.length ? listed.join(" | ") : "(none — the list is empty)"}. ` +
            `Setup either did not create it, or something deleted it mid-run.`
        );
    }
    await projectLink.click();
    await page.waitForURL("**/guardian/projects/**", { timeout: 10000 });

    return page.url().split("/projects/")[1]?.split("?")[0]?.split("/")[0] || "";
}

// ─── Full workflow per state ───────────────────────

for (const [stateCode, config] of Object.entries(STATE_CONFIGS)) {
    test.describe(`Full Workflow — ${stateCode} (${config.name})`, () => {
        const projectName = `E2E ${stateCode} Build`;
        let projectId: string | null = null;

        test.beforeAll(async () => {
            // Ensure test user in Supabase Auth + profiles
            await ensureTestUser();
            // Scoped to THIS state. An unscoped cleanup here also deletes the
            // other seven describe blocks' projects, including live ones.
            await cleanupE2EProjects(`E2E ${stateCode} `);
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

        // ── Step 2b: The fixture is REALLY this state ──

        /**
         * Guards the assumption every other test in this block rests on.
         *
         * `projects.state` is `TEXT DEFAULT 'NSW'`. When the seed helper omitted
         * the field, all 8 describe blocks produced NSW projects — stage NAMES
         * were still per-state, so the suite reported 8-state coverage and went
         * green while every state-dependent branch ran as NSW. A DB check alone
         * would not have caught it either, so this also asserts a state-dependent
         * branch actually rendered.
         */
        test(`${stateCode}: Project is really a ${stateCode} project`, async ({ page }) => {
            if (!projectId) { test.skip(true, "No project"); return; }

            expect(await getProjectState(projectId)).toBe(stateCode);

            await login(page);
            await navigateToProject(page, projectName);

            // Mirrors getLicenseVerificationUrl() in lib/guardian/calculations.ts —
            // the single map every "Verify License" link reads from. All 8 states
            // are listed on purpose: a fallback here would let a missing state pass
            // by landing on someone else's regulator, which is exactly B-13.
            const REGISTER_HOST: Record<string, string> = {
                NSW: "verify.licence.nsw.gov.au",
                VIC: "bpc.vic.gov.au",
                QLD: "my.qbcc.qld.gov.au",
                WA: "wa.gov.au",
                SA: "secure.cbs.sa.gov.au",
                TAS: "cbos.tas.gov.au",
                ACT: "accesscanberra.act.gov.au",
                NT: "nt.gov.au",
            };
            const expectedHost = REGISTER_HOST[stateCode];
            expect(expectedHost, `no expected register host for ${stateCode}`).toBeTruthy();

            // Rendered as: <a href="…register">License: NSW12345C</a>
            const licenceLink = page.locator('a:has-text("License:")').first();
            await expect(licenceLink).toBeVisible({ timeout: 15_000 });
            expect(
                await licenceLink.getAttribute("href"),
                `${stateCode} should link to its own licence register`
            ).toContain(expectedHost);
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
            // effectively testing undefined. `main` alone is ambiguous too — the
            // app layout has one AND the project page has one — so target the
            // project panel by its aria-label and WAIT for it to actually render
            // rather than sampling whatever is there the instant the tab is clicked.
            const panel = page.locator('main[aria-label="Project content"]');
            await expect(panel).toBeVisible({ timeout: 20_000 });
            await expect
                .poll(async () => (await panel.innerText()).trim().length, { timeout: 20_000 })
                .toBeGreaterThan(0);
        });

        // ── Step 7: Materials, Visits, Check-ins ───

        test(`${stateCode}: Material, site visit, check-in on tabs`, async ({ page }) => {
            if (!projectId) { test.skip(true, "No project"); return; }
            // Seed our OWN fixture rather than relying on an earlier test having
            // run. Depending on execution order meant this test could not be run
            // in isolation (`-g` on just this name found no data and failed for a
            // reason that had nothing to do with the feature), and any reordering
            // or a skip upstream would break it silently.
            await seedProjectData(projectId, stateCode);
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
            // effectively testing undefined. `main` alone is ambiguous too — the
            // app layout has one AND the project page has one — so target the
            // project panel by its aria-label and WAIT for it to actually render
            // rather than sampling whatever is there the instant the tab is clicked.
            const panel = page.locator('main[aria-label="Project content"]');
            await expect(panel).toBeVisible({ timeout: 20_000 });
            await expect
                .poll(async () => (await panel.innerText()).trim().length, { timeout: 20_000 })
                .toBeGreaterThan(0);

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
