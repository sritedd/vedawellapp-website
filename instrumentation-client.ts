import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Error sampling — capture all errors
    sampleRate: 1.0,

    // Performance tracing — 10% in production
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Session Replay — capture 10% of sessions, 100% of sessions with errors
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
        Sentry.replayIntegration(),
        Sentry.browserTracingIntegration(),
    ],

    // Don't send errors in development
    enabled: process.env.NODE_ENV === "production",

    // Filter noisy errors
    ignoreErrors: [
        // Browser extensions
        "ResizeObserver loop",
        // Ad blockers
        "ERR_BLOCKED_BY_CLIENT",
        // Network errors (user offline)
        "Failed to fetch",
        "NetworkError",
        "Load failed",
    ],
});

// Instrument Next.js route transitions
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
