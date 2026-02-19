import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description:
        "Privacy policy for VedaWell Tools. We prioritise your privacy — all tools run locally in your browser with minimal data collection.",
};

export default function PrivacyPage() {
    return (
        <div className="py-16 px-6">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-extrabold mb-4">Privacy Policy</h1>
                <p className="text-muted mb-10">Last updated: February 2026</p>

                <div className="space-y-8 text-muted">
                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-3">1. Overview</h2>
                        <p>
                            VedaWell Tools (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates the website
                            vedawellapp.com. This page informs you of our policies regarding the collection, use, and
                            disclosure of personal information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-3">2. Tools & Games</h2>
                        <p>
                            All 90+ browser-based tools and games operate <strong className="text-foreground">entirely
                                within your browser</strong>. No data entered into any tool is transmitted to our servers or
                            any third party. All calculations, conversions, and processing happen locally on your device.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-3">3. HomeOwner Guardian</h2>
                        <p>
                            If you create an account and use the HomeOwner Guardian feature, we store the following
                            data securely via our database provider (Supabase):
                        </p>
                        <ul className="list-disc list-inside mt-3 space-y-1">
                            <li>Email address (for authentication)</li>
                            <li>Project details (builder info, contract values, stages)</li>
                            <li>Variation records, defect reports, and checklist data</li>
                            <li>Uploaded documents and photos (stored securely)</li>
                        </ul>
                        <p className="mt-3">
                            This data is only accessible by you (the authenticated user) and is protected by
                            row-level security policies. We do not share, sell, or analyse your Guardian data.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-3">4. Analytics</h2>
                        <p>
                            We use Google Analytics to understand general usage patterns (e.g., which tools are popular).
                            This data is anonymised and does not include any personal information you enter into tools.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-3">5. Advertising</h2>
                        <p>
                            We use Google AdSense to display ads. Google may use cookies to serve ads based on your
                            browsing history. You can opt out of personalised advertising at{" "}
                            <a
                                href="https://www.google.com/settings/ads"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                Google Ad Settings
                            </a>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-3">6. Cookies</h2>
                        <p>
                            We use cookies for: authentication (Guardian login sessions), analytics (Google Analytics),
                            and advertising (Google AdSense). You can disable cookies in your browser settings, though
                            this may affect Guardian functionality.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-3">7. Data Deletion</h2>
                        <p>
                            To delete your Guardian account and all associated data, please email us at{" "}
                            <a
                                href="mailto:privacy@vedawellapp.com"
                                className="text-primary hover:underline"
                            >
                                privacy@vedawellapp.com
                            </a>. Tool data stored in your browser can be cleared via your browser settings.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-3">8. Contact</h2>
                        <p>
                            For questions about this privacy policy, please contact us at{" "}
                            <a
                                href="mailto:privacy@vedawellapp.com"
                                className="text-primary hover:underline"
                            >
                                privacy@vedawellapp.com
                            </a>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
