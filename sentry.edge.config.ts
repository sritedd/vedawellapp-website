import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Capture all edge errors
    sampleRate: 1.0,

    // Performance tracing — 10% in production
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Don't send errors in development
    enabled: process.env.NODE_ENV === "production",
});
