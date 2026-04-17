// Jest DOM extended matchers
import '@testing-library/jest-dom';

// Block heavy modules from loading in tests. Components that touch
// Supabase or the AI SDK pull a large dep graph that triggers worker
// OOM in Guardian component suites. Tests don't actually call the
// real client — return a no-op chainable stub.
jest.mock('@/lib/supabase/client', () => {
    const chain = {
        from: () => chain,
        select: () => chain,
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => chain,
        upsert: () => chain,
        delete: () => chain,
        eq: () => chain,
        in: () => chain,
        gte: () => chain,
        lte: () => chain,
        order: () => chain,
        limit: () => chain,
        single: () => Promise.resolve({ data: null, error: null }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        then: (resolve) => resolve({ data: [], error: null }),
        channel: () => ({ on: () => ({ subscribe: () => ({ unsubscribe: jest.fn() }) }) }),
        removeChannel: jest.fn(),
        auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
        storage: { from: () => ({ upload: jest.fn(), list: jest.fn(), remove: jest.fn() }) },
    };
    return { createClient: () => chain };
});

// This adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom

// Mock browser APIs not available in JSDOM
global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock window.open for print functionality
const mockPrintWindow = {
    document: {
        write: jest.fn(),
        close: jest.fn(),
    },
    print: jest.fn(),
    close: jest.fn(),
};
global.open = jest.fn(() => mockPrintWindow);

// Mock clipboard API
Object.assign(navigator, {
    clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
    },
});

// Suppress console errors during tests (optional)
const originalError = console.error;
beforeAll(() => {
    console.error = (...args) => {
        if (
            typeof args[0] === 'string' &&
            args[0].includes('Warning: ReactDOM.render is no longer supported')
        ) {
            return;
        }
        originalError.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalError;
});
