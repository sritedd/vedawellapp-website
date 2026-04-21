const nextJest = require('next/jest');

const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files
    dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jest-environment-jsdom',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    testMatch: [
        '**/__tests__/**/*.[jt]s?(x)',
        '**/?(*.)+(spec|test).[jt]s?(x)',
    ],
    // e2e/ holds Playwright specs — they import @playwright/test and fail to
    // load under Jest. Playwright runs them via `npx playwright test`.
    testPathIgnorePatterns: ['/node_modules/', '/e2e/', '/.next/'],
};

module.exports = createJestConfig(customJestConfig);
