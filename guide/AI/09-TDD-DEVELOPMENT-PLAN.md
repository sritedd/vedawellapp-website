# Test-Driven Development Plan: Guardian AI Features

> Date: 2026-03-18
> Methodology: Write tests FIRST, then implement until tests pass
> Goal: Zero bugs in AI features from day one

---

## Testing Strategy Overview

```
                    ┌─────────────────────────────┐
                    │   E2E Tests (Playwright)     │  ← Tests full user flows
                    │   e2e/guardian-ai.spec.ts    │     (browser → API → DB → AI)
                    ├─────────────────────────────┤
                    │   Integration Tests (Jest)   │  ← Tests API routes with
                    │   __tests__/api/ai/*.test.ts │     mocked AI providers
                    ├─────────────────────────────┤
                    │   Unit Tests (Jest)           │  ← Tests pure functions:
                    │   __tests__/ai/*.test.ts      │     prompts, cache, parsing
                    └─────────────────────────────┘
```

**Test-first rule**: For every AI feature, we write tests in this order:
1. Unit tests for pure functions (prompts, parsing, caching)
2. Integration tests for API routes (mocked AI provider)
3. E2E tests for full user flows (real browser, mocked AI)

---

## Phase 0: AI Test Infrastructure (Build First)

### 0.1 AI Provider Mock

```typescript
// src/lib/ai/__tests__/mocks/ai-provider.ts
import { MockLanguageModelV1 } from 'ai/test';

/**
 * Mock AI provider for testing.
 * Returns deterministic responses without calling any API.
 */
export function createMockModel(responses: Record<string, string>) {
    return new MockLanguageModelV1({
        doGenerate: async ({ prompt }) => {
            const key = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
            // Find matching response by checking if any key is contained in the prompt
            for (const [trigger, response] of Object.entries(responses)) {
                if (key.includes(trigger)) {
                    return {
                        text: response,
                        finishReason: 'stop',
                        usage: { promptTokens: 10, completionTokens: 20 },
                    };
                }
            }
            return { text: '{}', finishReason: 'stop', usage: { promptTokens: 0, completionTokens: 0 } };
        },
    });
}

/**
 * Standard mock responses for each AI feature
 */
export const MOCK_RESPONSES = {
    defectAssist: JSON.stringify({
        improvedDescription: "Horizontal crack approximately 3mm wide running along the mortar joint at the junction of the external brick veneer wall and the concrete slab, located on the northern elevation near the garage entry.",
        severity: "major",
        category: "structural",
        location: "Northern external wall, ground level",
        recommendedAction: "Engage a structural engineer to assess. This may indicate differential settlement. Do not accept the builder's claim that it is 'normal settling' without independent verification.",
        isUrgent: true,
        australianStandard: "AS 2870-2011 Residential Slabs and Footings",
    }),
    stageAdvice: JSON.stringify({
        advice: "At the frame stage in NSW, your key priorities are...",
        checklistItems: ["Verify all load-bearing walls are plumb", "Check bracing matches engineering plans"],
        documentsToDemand: ["Frame inspection certificate from PCA"],
        commonIssues: ["Undersized lintels above windows"],
    }),
    reportSummary: "This project has 3 open defects including 1 critical structural issue...",
    builderCheck: JSON.stringify({
        licenseStatus: "active",
        reviewSummary: "Mixed reviews with concerns about communication",
        riskScore: 65,
        redFlags: ["Multiple reviews mention delays"],
    }),
};
```

### 0.2 Test Utilities

```typescript
// src/lib/ai/__tests__/utils/test-helpers.ts

/** Create a fake Supabase client for testing */
export function createTestSupabase(overrides: Record<string, any> = {}) {
    return {
        from: (table: string) => ({
            select: () => ({ data: overrides[table] || [], error: null }),
            insert: () => ({ data: null, error: null }),
            eq: () => ({ data: overrides[table]?.[0] || null, error: null, single: () => ({ data: overrides[table]?.[0] || null, error: null }) }),
        }),
        auth: {
            getUser: () => ({ data: { user: { id: 'test-user-id', email: 'test@example.com' } } }),
        },
        rpc: () => ({ data: overrides.rpc || [], error: null }),
    };
}

/** Create a test project fixture */
export function createTestProject(overrides = {}) {
    return {
        id: 'test-project-id',
        name: 'Test Build',
        builder_name: 'Test Builder Pty Ltd',
        builder_abn: '12345678901',
        contract_value: 450000,
        state: 'NSW',
        status: 'active',
        address: '123 Test St, Sydney NSW 2000',
        ...overrides,
    };
}

/** Create a test defect fixture */
export function createTestDefect(overrides = {}) {
    return {
        id: 'test-defect-id',
        title: 'Crack in wall',
        description: 'crack near window',
        severity: 'minor',
        status: 'open',
        location: '',
        stage: 'frame',
        ...overrides,
    };
}
```

---

## Phase 1: Defect Description Assistant

### Step 1: Write Unit Tests

```typescript
// src/lib/ai/__tests__/prompts.test.ts

import { buildDefectAssistPrompt, parseDefectResponse, validateDefectAnalysis } from '../prompts';

describe('Defect Assist Prompts', () => {
    test('buildDefectAssistPrompt includes user description', () => {
        const prompt = buildDefectAssistPrompt('crack in wall near window', 'frame', 'NSW');
        expect(prompt).toContain('crack in wall near window');
        expect(prompt).toContain('frame');
        expect(prompt).toContain('NSW');
    });

    test('buildDefectAssistPrompt includes Australian context', () => {
        const prompt = buildDefectAssistPrompt('water stain on ceiling', 'lockup', 'NSW');
        expect(prompt).toContain('Australian');
        expect(prompt).toContain('homeowner');
    });

    test('parseDefectResponse handles valid JSON', () => {
        const response = JSON.stringify({
            improvedDescription: 'A properly described defect',
            severity: 'major',
            category: 'waterproofing',
            location: 'Bathroom ceiling',
            recommendedAction: 'Get waterproofing certificate',
            isUrgent: true,
        });
        const result = parseDefectResponse(response);
        expect(result.severity).toBe('major');
        expect(result.isUrgent).toBe(true);
    });

    test('parseDefectResponse handles malformed JSON gracefully', () => {
        const result = parseDefectResponse('not json at all');
        expect(result).toEqual({
            improvedDescription: '',
            severity: 'minor',
            category: 'general',
            location: '',
            recommendedAction: 'Please describe the defect in more detail.',
            isUrgent: false,
        });
    });

    test('validateDefectAnalysis rejects invalid severity', () => {
        const invalid = { severity: 'extreme', category: 'structural' };
        const result = validateDefectAnalysis(invalid);
        expect(result.severity).toBe('minor'); // Falls back to default
    });

    test('validateDefectAnalysis accepts valid severities', () => {
        for (const sev of ['critical', 'major', 'minor', 'cosmetic']) {
            const result = validateDefectAnalysis({ severity: sev, category: 'test' });
            expect(result.severity).toBe(sev);
        }
    });
});
```

### Step 2: Write Integration Tests

```typescript
// src/lib/ai/__tests__/api/describe-defect.test.ts

import { createMockModel, MOCK_RESPONSES } from '../mocks/ai-provider';
import { describeDefect } from '../../describe-defect';
import { createTestProject, createTestDefect } from '../utils/test-helpers';

// Mock the AI provider module
jest.mock('../../provider', () => ({
    smartModel: createMockModel({ 'crack': MOCK_RESPONSES.defectAssist }),
}));

describe('POST /api/guardian/ai/describe-defect', () => {
    test('returns structured defect analysis for valid input', async () => {
        const result = await describeDefect({
            rawDescription: 'crack in wall near window',
            stage: 'frame',
            state: 'NSW',
        });

        expect(result).toHaveProperty('improvedDescription');
        expect(result).toHaveProperty('severity');
        expect(result).toHaveProperty('category');
        expect(result).toHaveProperty('recommendedAction');
        expect(['critical', 'major', 'minor', 'cosmetic']).toContain(result.severity);
    });

    test('handles empty description gracefully', async () => {
        const result = await describeDefect({
            rawDescription: '',
            stage: 'frame',
            state: 'NSW',
        });

        expect(result.improvedDescription).toBe('');
        expect(result.severity).toBe('minor');
    });

    test('includes Australian standard reference when applicable', async () => {
        const result = await describeDefect({
            rawDescription: 'large crack in foundation slab',
            stage: 'slab',
            state: 'NSW',
        });

        // Should reference relevant AS standard
        expect(result.australianStandard).toBeDefined();
    });
});
```

### Step 3: Write E2E Test

```typescript
// e2e/guardian-ai.spec.ts (partial — defect assistant section)

import { test, expect } from '@playwright/test';

test.describe('AI Defect Description Assistant', () => {
    test.beforeEach(async ({ page }) => {
        // Login as test user
        await page.goto('/guardian/login');
        await page.fill('[name="email"]', 'e2e-test@vedawellapp.com');
        await page.fill('[name="password"]', 'E2eTestPass!2026');
        await page.click('button[type="submit"]');
        await page.waitForURL('/guardian/dashboard');
    });

    test('AI Assist button appears on defect form', async ({ page }) => {
        // Navigate to project defects tab
        await page.goto('/guardian/projects/test-project-id?tab=defects');
        await page.click('text=Add Defect');

        // AI Assist button should be visible
        await expect(page.locator('button:has-text("AI Assist")')).toBeVisible();
    });

    test('AI Assist fills in defect details', async ({ page }) => {
        await page.goto('/guardian/projects/test-project-id?tab=defects');
        await page.click('text=Add Defect');

        // Type a rough description
        await page.fill('[name="description"]', 'crack in wall near window');

        // Click AI Assist
        await page.click('button:has-text("AI Assist")');

        // Wait for AI response (should update fields)
        await page.waitForSelector('[data-ai-complete="true"]', { timeout: 15000 });

        // Description should be improved (longer than original)
        const description = await page.inputValue('[name="description"]');
        expect(description.length).toBeGreaterThan('crack in wall near window'.length);

        // Severity should be auto-selected
        const severity = await page.inputValue('[name="severity"]');
        expect(['critical', 'major', 'minor', 'cosmetic']).toContain(severity);
    });

    test('AI Assist shows error state on failure', async ({ page }) => {
        // This test uses a non-existent project to trigger error
        await page.goto('/guardian/projects/nonexistent?tab=defects');

        // Should show error gracefully, not crash
        await expect(page.locator('text=Something went wrong')).not.toBeVisible();
    });
});
```

### Step 4: Implement (make tests pass)

Now implement `src/lib/ai/prompts.ts`, `src/app/api/guardian/ai/describe-defect/route.ts`, and `src/components/guardian/AIDefectAssist.tsx` until all tests pass.

---

## Phase 2: AI Stage Advisor

### Tests First

```typescript
// src/lib/ai/__tests__/stage-advice.test.ts

describe('Stage Advice', () => {
    test('buildStageAdvicePrompt includes state-specific info for NSW', () => {
        const prompt = buildStageAdvicePrompt('frame', 'NSW');
        expect(prompt).toContain('NSW');
        expect(prompt).toContain('PCA'); // Principal Certifying Authority
        expect(prompt).toContain('Home Building Act');
    });

    test('buildStageAdvicePrompt includes state-specific info for VIC', () => {
        const prompt = buildStageAdvicePrompt('frame', 'VIC');
        expect(prompt).toContain('VIC');
        expect(prompt).toContain('VBA'); // Victorian Building Authority
    });

    test('returns structured advice with checklist items', async () => {
        const result = await getStageAdvice('frame', 'NSW');
        expect(result.checklistItems).toBeInstanceOf(Array);
        expect(result.checklistItems.length).toBeGreaterThan(0);
        expect(result.documentsToDemand).toBeInstanceOf(Array);
        expect(result.commonIssues).toBeInstanceOf(Array);
    });

    test('caches identical stage+state requests', async () => {
        const result1 = await getStageAdvice('frame', 'NSW');
        const result2 = await getStageAdvice('frame', 'NSW');
        expect(result1).toEqual(result2);
        // Second call should NOT hit AI provider (cached)
    });

    test('different states produce different advice', async () => {
        const nsw = await getStageAdvice('frame', 'NSW');
        const vic = await getStageAdvice('frame', 'VIC');
        expect(nsw.advice).not.toEqual(vic.advice);
    });
});
```

---

## Phase 3: AI Cache System

### Tests First

```typescript
// src/lib/ai/__tests__/cache.test.ts

import { AICache } from '../cache';

describe('AI Cache', () => {
    let cache: AICache;

    beforeEach(() => {
        cache = new AICache(createTestSupabase({
            ai_cache: [{ cache_key: 'existing-key', response: { text: 'cached' }, expires_at: new Date(Date.now() + 86400000).toISOString() }],
        }));
    });

    test('returns cached response for known key', async () => {
        const result = await cache.get('existing-key');
        expect(result).toEqual({ text: 'cached' });
    });

    test('returns null for unknown key', async () => {
        const result = await cache.get('unknown-key');
        expect(result).toBeNull();
    });

    test('returns null for expired cache entry', async () => {
        const expiredCache = new AICache(createTestSupabase({
            ai_cache: [{ cache_key: 'expired', response: { text: 'old' }, expires_at: new Date(Date.now() - 1000).toISOString() }],
        }));
        const result = await expiredCache.get('expired');
        expect(result).toBeNull();
    });

    test('generates consistent cache keys', () => {
        const key1 = AICache.makeKey('stage-advice', { stage: 'frame', state: 'NSW' });
        const key2 = AICache.makeKey('stage-advice', { stage: 'frame', state: 'NSW' });
        const key3 = AICache.makeKey('stage-advice', { stage: 'frame', state: 'VIC' });
        expect(key1).toBe(key2);
        expect(key1).not.toBe(key3);
    });

    test('set stores with correct TTL', async () => {
        await cache.set('new-key', { text: 'new' }, 3600);
        // Verify insert was called (via mock)
    });
});
```

---

## Phase 4: Builder Intelligence

### Tests First

```typescript
// src/lib/ai/__tests__/builder-check.test.ts

describe('Builder Intelligence', () => {
    test('validateABN rejects invalid ABN format', () => {
        expect(validateABN('')).toBe(false);
        expect(validateABN('123')).toBe(false);
        expect(validateABN('abcdefghijk')).toBe(false);
    });

    test('validateABN accepts valid 11-digit ABN', () => {
        expect(validateABN('51824753556')).toBe(true);
    });

    test('calculateRiskScore returns 0-100', () => {
        const score = calculateRiskScore({
            licenseActive: true,
            abnActive: true,
            gstRegistered: true,
            averageRating: 4.5,
            reviewCount: 20,
            complaintCount: 0,
            negativeKeywords: [],
        });
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
    });

    test('calculateRiskScore penalizes expired license heavily', () => {
        const active = calculateRiskScore({ licenseActive: true, abnActive: true, averageRating: 4.0, reviewCount: 10, complaintCount: 0, negativeKeywords: [], gstRegistered: true });
        const expired = calculateRiskScore({ licenseActive: false, abnActive: true, averageRating: 4.0, reviewCount: 10, complaintCount: 0, negativeKeywords: [], gstRegistered: true });
        expect(expired).toBeLessThan(active - 30);
    });

    test('calculateRiskScore flags keyword mentions', () => {
        const clean = calculateRiskScore({ licenseActive: true, abnActive: true, averageRating: 4.0, reviewCount: 10, complaintCount: 0, negativeKeywords: [], gstRegistered: true });
        const flagged = calculateRiskScore({ licenseActive: true, abnActive: true, averageRating: 4.0, reviewCount: 10, complaintCount: 0, negativeKeywords: ['defect', 'delay', 'warranty'], gstRegistered: true });
        expect(flagged).toBeLessThan(clean);
    });
});
```

---

## Phase 5: Construction Chatbot

### Tests First

```typescript
// src/lib/ai/__tests__/chat.test.ts

describe('Construction Chat', () => {
    test('buildChatSystemPrompt includes project context', () => {
        const project = createTestProject({ state: 'NSW', status: 'active' });
        const prompt = buildChatSystemPrompt(project, 'frame', []);
        expect(prompt).toContain('NSW');
        expect(prompt).toContain('frame');
        expect(prompt).toContain('HomeOwner Guardian');
    });

    test('buildChatSystemPrompt includes defect summary when defects exist', () => {
        const defects = [
            createTestDefect({ severity: 'critical', status: 'open' }),
            createTestDefect({ severity: 'minor', status: 'rectified' }),
        ];
        const prompt = buildChatSystemPrompt(createTestProject(), 'frame', defects);
        expect(prompt).toContain('1 open defect');
        expect(prompt).toContain('critical');
    });

    test('system prompt prohibits legal advice', () => {
        const prompt = buildChatSystemPrompt(createTestProject(), 'frame', []);
        expect(prompt).toContain('not a solicitor');
        expect(prompt).toContain('not legal advice');
    });

    test('system prompt stays within Australian construction context', () => {
        const prompt = buildChatSystemPrompt(createTestProject(), 'frame', []);
        expect(prompt).toContain('Australian');
        expect(prompt).toContain('National Construction Code');
    });
});
```

### E2E Chat Test

```typescript
// e2e/guardian-ai.spec.ts (chat section)

test.describe('AI Construction Chatbot', () => {
    test('chat widget opens and accepts messages', async ({ page }) => {
        await page.goto('/guardian/projects/test-project-id');

        // Open chat
        await page.click('[data-testid="guardian-chat-toggle"]');
        await expect(page.locator('[data-testid="guardian-chat-panel"]')).toBeVisible();

        // Type and send message
        await page.fill('[data-testid="chat-input"]', 'What should I check at frame stage?');
        await page.click('[data-testid="chat-send"]');

        // Wait for streaming response
        await page.waitForSelector('[data-testid="chat-message-assistant"]', { timeout: 15000 });

        // Response should contain relevant advice
        const response = await page.textContent('[data-testid="chat-message-assistant"]');
        expect(response).toBeTruthy();
        expect(response!.length).toBeGreaterThan(50);
    });

    test('chat maintains conversation history', async ({ page }) => {
        await page.goto('/guardian/projects/test-project-id');
        await page.click('[data-testid="guardian-chat-toggle"]');

        // Send first message
        await page.fill('[data-testid="chat-input"]', 'Hi');
        await page.click('[data-testid="chat-send"]');
        await page.waitForSelector('[data-testid="chat-message-assistant"]');

        // Send second message
        await page.fill('[data-testid="chat-input"]', 'What about waterproofing?');
        await page.click('[data-testid="chat-send"]');

        // Should have 2 user messages + 2 assistant messages
        const messages = await page.locator('[data-testid^="chat-message-"]').count();
        expect(messages).toBe(4);
    });

    test('chat shows pro-only gate for free users', async ({ page }) => {
        // Login as free-tier user
        await page.goto('/guardian/login');
        await page.fill('[name="email"]', 'free-user@test.com');
        await page.fill('[name="password"]', 'TestPass!2026');
        await page.click('button[type="submit"]');

        await page.goto('/guardian/projects/test-project-id');
        await page.click('[data-testid="guardian-chat-toggle"]');

        // Should show upgrade prompt instead of chat input
        await expect(page.locator('text=Upgrade to Guardian Pro')).toBeVisible();
    });
});
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test-ai.yml
name: AI Feature Tests

on:
  push:
    paths:
      - 'src/lib/ai/**'
      - 'src/app/api/guardian/ai/**'
      - 'src/components/guardian/AI*'
      - 'src/components/guardian/GuardianChat*'
      - 'src/components/guardian/BuilderIntelligence*'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npx jest --testPathPattern="src/lib/ai/__tests__" --coverage

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npx jest --testPathPattern="__tests__/api/ai" --coverage

  build-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npm run build
```

---

## Development Checklist (Per Feature)

For each AI feature, follow this exact sequence:

- [ ] Write unit tests for pure functions (prompts, parsing, validation)
- [ ] Write integration tests for API route (mocked AI provider)
- [ ] Write E2E test for user flow (mocked or real AI)
- [ ] Run tests — verify they FAIL (red)
- [ ] Implement the feature
- [ ] Run tests — verify they PASS (green)
- [ ] Run `npm run build` — verify no TypeScript errors
- [ ] Run full E2E suite — verify no regressions
- [ ] Add `data-testid` attributes to all interactive elements
- [ ] Test with free-tier user — verify Pro gate works
- [ ] Test error states — API failure, timeout, malformed response
- [ ] Test empty states — no project, no defects, no stages
- [ ] Commit with descriptive message

---

## Sprint Plan

### Week 1: Foundation + Quick Wins
| Day | Task | Tests | Implementation |
|-----|------|-------|----------------|
| Mon | AI test infrastructure | Mock provider, test utils, fixtures | `provider.ts`, `cache.ts` |
| Tue | Defect Description Assistant | 6 unit + 3 integration + 3 E2E | API route + component |
| Wed | AI Report Summary | 3 unit + 2 integration | Extend export-pdf route |
| Thu | AI Stage Advisor | 5 unit + 3 integration + 2 E2E | API route + component |
| Fri | Proactive Notifications | 4 unit + 2 integration | Extend notifications cron |

### Week 2: Complex Features
| Day | Task | Tests | Implementation |
|-----|------|-------|----------------|
| Mon | pgvector setup + knowledge seed | Schema v20, seed script | SQL + script |
| Tue | Construction Chatbot (backend) | 5 unit + 3 integration | Chat API route with RAG |
| Wed | Construction Chatbot (frontend) | 3 E2E | GuardianChat component |
| Thu | Builder Intelligence | 6 unit + 3 integration + 2 E2E | API route + component |
| Fri | Integration testing + bug fixes | Run full suite, fix failures | Polish |

### Week 3: Photo Analysis + Polish
| Day | Task | Tests | Implementation |
|-----|------|-------|----------------|
| Mon | Defect Photo Analysis | 4 unit + 2 integration + 2 E2E | Vision API route |
| Tue | Error handling hardening | Edge case tests | Timeouts, retries, fallbacks |
| Wed | Performance testing | Load tests, response time checks | Caching, debouncing |
| Thu | Full regression suite | All 53 existing E2E + ~25 new AI E2E | Fix any regressions |
| Fri | Deploy + monitor | Production smoke tests | Netlify deploy, check logs |

---

## Error Handling Contract

Every AI feature MUST handle these failure modes:

| Failure | Behavior | Test |
|---------|----------|------|
| AI API timeout (>10s) | Show "Taking longer than usual..." then fallback | E2E timeout test |
| AI API error (500) | Show "AI unavailable, try manually" — form still works | Integration error test |
| AI API rate limit (429) | Queue and retry after 1s, max 2 retries | Unit retry test |
| Malformed AI response | Parse with fallback defaults, log error | Unit parse test |
| No API key configured | Feature hidden entirely (not broken) | Unit env check test |
| User on free tier | Show upgrade prompt instead of AI feature | E2E tier gate test |
| Empty input | Return immediately with validation message | Unit validation test |
| Network offline | Show cached response or "offline" message | E2E offline test |

---

## Success Metrics

After all phases complete, these must be true:

- [ ] `npm run build` passes with zero errors
- [ ] All 53 existing E2E tests still pass (zero regressions)
- [ ] All ~25 new AI E2E tests pass
- [ ] All ~45 new unit/integration tests pass
- [ ] Free-tier users see upgrade prompts (not broken features)
- [ ] AI features work when API keys are missing (graceful degradation)
- [ ] AI response caching reduces API calls by >50%
- [ ] Average AI response time <3 seconds
- [ ] Monthly AI cost <$100 at 500 users
