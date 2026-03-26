import type { NextConfig } from "next";

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
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://js.stripe.com https://ep1.adtrafficquality.google",
                            "style-src 'self' 'unsafe-inline'",
                            "img-src 'self' data: blob: https://zukychfztnaghmsszxrw.supabase.co https://pagead2.googlesyndication.com https://*.google.com https://*.googleapis.com",
                            "font-src 'self'",
                            "connect-src 'self' https://zukychfztnaghmsszxrw.supabase.co https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://adservice.google.com https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://api.stripe.com https://api.resend.com",
                            "frame-src https://js.stripe.com https://pagead2.googlesyndication.com https://td.doubleclick.net",
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

export default nextConfig;
