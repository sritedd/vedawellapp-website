import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "zukychfztnaghmsszxrw.supabase.co",
                pathname: "/storage/v1/object/public/**",
            },
        ],
    },
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    { key: "X-Frame-Options", value: "DENY" },
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                    { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=63072000; includeSubDomains; preload",
                    },
                    {
                        key: "Content-Security-Policy",
                        value: [
                            "default-src 'self'",
                            // fundingchoicesmessages.google.com serves Google's consent
                            // management (Funding Choices). Without it the EEA consent
                            // flow is blocked outright, which breaks AdSense compliance
                            // and serving — it was throwing CSP errors on every page.
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://fundingchoicesmessages.google.com https://js.stripe.com https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://*.services-prod.nsvcs.net https://browser.sentry-cdn.com",
                            "style-src 'self' 'unsafe-inline'",
                            // ep1/ep2.adtrafficquality.google serve AdSense's `sodar` tracking
                            // pixel; *.google.com does not cover them (different eTLD+1).
                            "img-src 'self' data: blob: https://zukychfztnaghmsszxrw.supabase.co https://images.unsplash.com https://pagead2.googlesyndication.com https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://*.google.com https://*.googleapis.com",
                            "font-src 'self'",
                            "connect-src 'self' https://zukychfztnaghmsszxrw.supabase.co https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com https://pagead2.googlesyndication.com https://fundingchoicesmessages.google.com https://googleads.g.doubleclick.net https://adservice.google.com https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://api.stripe.com https://api.resend.com https://*.services-prod.nsvcs.net https://*.ingest.us.sentry.io",
                            // ep1/ep2.adtrafficquality.google and www.google.com are framed
                            // by AdSense's ad-traffic-quality checks; both were being blocked.
                            "frame-src https://js.stripe.com https://pagead2.googlesyndication.com https://tpc.googlesyndication.com https://td.doubleclick.net https://googleads.g.doubleclick.net https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://www.google.com https://fundingchoicesmessages.google.com",
                            "object-src 'none'",
                            "base-uri 'self'",
                            "form-action 'self'",
                            "frame-ancestors 'none'",
                        ].join("; "),
                    },
                ],
            },
        ];
    },
};

export default withSentryConfig(nextConfig, {
    // Suppress source map upload logs during build
    silent: true,

    // Upload source maps for readable stack traces
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,

    // Source maps: upload to Sentry but hide from browser devtools
    sourcemaps: {
        deleteSourcemapsAfterUpload: true,
    },
});
