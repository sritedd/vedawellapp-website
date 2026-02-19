// Jest DOM extended matchers
import '@testing-library/jest-dom';

// This adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom

// Mock browser APIs not available in JSDOM
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
