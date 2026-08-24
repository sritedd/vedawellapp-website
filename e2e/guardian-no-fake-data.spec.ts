/**
 * Guardian — "no fabricated data" guard.
 *
 * Ports the genuinely-unique assertions out of the retired
 * `guardian-smoke.spec.ts`, which could never pass: it seeded a LOCAL Postgres
 * and then asserted the cloud-backed UI showed that data. This version seeds the
 * same Supabase instance the app actually reads.
 *
 * What it protects: an EMPTY project must render empty states, never invented
 * rows. That regression class is well attested here — the 2026-03 bug plan was
 * largely hardcoded mock data leaking into components (ProjectOverview,
 * StageChecklist, InspectionTimeline, StageGate, CommunicationLog). Coverage of
 * seeded-data rendering lives in guardian-full-workflow.spec.ts and is not
 * duplicated here.
 *
 * Run (prod): npx playwright test --config=playwright.prod.config.ts guardian-no-fake-data
 */

import { test, expect, Page } from "@playwright/test";
import {
    ensureTestUser,
    createTestProject,
    deleteTestProject,
    TEST_EMAIL,
    TEST_PASSWORD,
} from "./setup/supabase-seed";

const PROJECT_NAME = "E2E EmptyProject Guard";

/** Text that would indicate fabricated content rather than a real empty state. */
const FABRICATION_MARKERS = [
    "Metricon", "John Smith", "Jane Doe", "Acme", "Lorem ipsum",
    "example.com", "test@test", "Sample ", "Placeholder", "Dummy",
];

let projectId: string | null = null;

test.beforeAll(async () => {
    const userId = await ensureTestUser();
    projectId = await createTestProject(userId, "NSW", PROJECT_NAME);
});

test.afterAll(async () => {
    if (projectId) await deleteTestProject(projectId);
});

async function login(page: Page) {
    await page.goto("/guardian/login", { waitUntil: "domcontentloaded" });
    await page.waitForSelector('input[type="email"]', { state: "visible", timeout: 30_000 });
    await page.waitForTimeout(1_000);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/guardian\/(dashboard|projects)/, { timeout: 45_000 });
}

async function openSection(page: Page, section: string, tab: string) {
    const sec = page.locator(`button:text-is("${section}")`).first();
    if (await sec.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await sec.click();
        await page.waitForTimeout(700);
    }
    const t = page.locator(`button:text-is("${tab}")`).first();
    if (await t.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await t.click();
        await page.waitForTimeout(1_200);
    }
}

test.describe("Empty project renders empty states, not fabricated data", () => {
    // Tabs that historically shipped hardcoded sample rows.
    const TABS: Array<[string, string]> = [
        ["Home", "Pending Actions"],
        ["Evidence", "Site Visits"],
        ["Evidence", "Check-ins"],
        ["Evidence", "Comms"],
        ["Issues", "Defects"],
        ["Issues", "Variations"],
    ];

    for (const [section, tab] of TABS) {
        test(`${section} > ${tab} shows no invented rows`, async ({ page }) => {
            test.skip(!projectId, "No project");
            await login(page);
            await page.goto(`/guardian/projects/${projectId}`);
            await page.waitForLoadState("domcontentloaded");
            await page.waitForTimeout(2_500);

            await openSection(page, section, tab);

            const body = await page.locator("main").last().innerText();

            for (const marker of FABRICATION_MARKERS) {
                expect(
                    body.includes(marker),
                    `"${marker}" appeared on an EMPTY project's ${section} > ${tab} — ` +
                    `that is fabricated content, not a real empty state.`
                ).toBe(false);
            }
        });
    }

    test("loading states resolve — no perpetual spinner", async ({ page }) => {
        test.skip(!projectId, "No project");
        await login(page);
        await page.goto(`/guardian/projects/${projectId}`);
        await page.waitForLoadState("domcontentloaded");
        // Generous: prod cold start plus several client fetches.
        await page.waitForTimeout(12_000);

        const stillLoading = await page.locator("main").last().innerText();
        expect(
            /\bLoading\.\.\./i.test(stillLoading),
            "Something was still showing 'Loading...' 12 s after load — a fetch never resolved."
        ).toBe(false);
    });
});
