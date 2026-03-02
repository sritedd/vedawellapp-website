import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "About VedaWell — Free Browser-Based Productivity Tools & HomeOwner Guardian",
    description:
        "VedaWell offers 90+ free browser-based productivity tools (PDF, image, developer, SEO), brain training games, Hindu Panchang, and HomeOwner Guardian for Australian home construction. 100% private — no uploads, no sign-ups.",
    openGraph: {
        title: "About VedaWell — Free Browser-Based Tools & HomeOwner Guardian",
        description:
            "90+ free tools, games, Panchang, and HomeOwner Guardian. Everything runs in your browser — 100% private.",
        url: "https://vedawellapp.com/about",
    },
    alternates: {
        canonical: "https://vedawellapp.com/about",
    },
};

export default function AboutPage() {
    return (
        <div className="py-16 px-6">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-extrabold mb-8">About VedaWell Tools</h1>

                <div className="prose prose-lg space-y-6 text-muted">
                    <p>
                        <strong className="text-foreground">VedaWell Tools</strong> is a free, open-source platform
                        offering 90+ browser-based tools and games designed to boost your productivity — no sign-ups,
                        no downloads, no data collection.
                    </p>

                    <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">🛠️ Our Tools</h2>
                    <p>
                        From calculators and converters to developers tools and wellness utilities, everything runs
                        entirely in your browser. Your data never leaves your device.
                    </p>

                    <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">🏠 HomeOwner Guardian</h2>
                    <p>
                        Our flagship feature helps Australian homeowners protect their investment during construction.
                        Track variations, document defects, manage inspections, and ensure compliance — all with
                        legal-ready evidence.
                    </p>

                    <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">🕉️ Vedic Heritage</h2>
                    <p>
                        VedaWell also celebrates Vedic wisdom through our daily Panchang calculator, offering accurate
                        Tithi, Nakshatra, Yoga, Karana, and auspicious timings based on astronomical calculations.
                    </p>

                    <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">💡 Our Philosophy</h2>
                    <ul className="list-disc list-inside space-y-2">
                        <li><strong className="text-foreground">Privacy First</strong> — All tools run locally in your browser</li>
                        <li><strong className="text-foreground">Free Forever</strong> — No paywalls, no subscriptions for tools</li>
                        <li><strong className="text-foreground">Open Source</strong> — Built with transparency in mind</li>
                        <li><strong className="text-foreground">No Tracking</strong> — We don&apos;t sell your data</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">✉️ Contact & Tool Requests</h2>
                    <p>
                        Questions, feedback, or bug reports? We&apos;re happy to help at{" "}
                        <a href="mailto:support@vedawellapp.com" className="text-primary hover:underline">
                            support@vedawellapp.com
                        </a>.
                    </p>
                    <p className="mt-3">
                        <strong className="text-foreground">Want a new tool?</strong> Email us at{" "}
                        <a
                            href="mailto:support@vedawellapp.com?subject=Tool Request"
                            className="text-primary hover:underline"
                        >
                            support@vedawellapp.com
                        </a>{" "}
                        with subject <strong className="text-foreground">Tool Request</strong> and a brief description.
                        We read every suggestion!
                    </p>

                    <div className="mt-12 flex flex-wrap gap-4">
                        <Link href="/tools" className="btn-primary">Explore Tools</Link>
                        <Link href="/guardian" className="btn-secondary">HomeOwner Guardian</Link>
                        <Link href="/privacy" className="btn-secondary">Privacy Policy</Link>
                        <a href="mailto:support@vedawellapp.com?subject=Tool Request" className="btn-secondary">📬 Request a Tool</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
