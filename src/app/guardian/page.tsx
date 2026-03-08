import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "HomeOwner Guardian — Australian Home Construction Defect & Variation Tracker",
    description:
        "Protect your Australian home construction investment. Track variations, defects, inspections, and certifications with legal-ready documentation for NSW Fair Trading and NCAT disputes.",
    keywords:
        "home construction tracker, Australian building defects, construction defect documentation, variation tracker, building inspection, owner builder, new home build Australia, NSW Fair Trading, NCAT building disputes",
    openGraph: {
        title: "HomeOwner Guardian — Protect Your Home Build",
        description:
            "Track construction defects, variations, certifications and payment milestones. Legal-ready documentation for Australian homeowners.",
        url: "https://vedawellapp.com/guardian",
    },
    alternates: {
        canonical: "https://vedawellapp.com/guardian",
    },
};

export default async function GuardianPage() {
    // Redirect logged-in users straight to dashboard
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        redirect("/guardian/dashboard");
    }

    return (
        <>
            {/* Guardian Hero */}
            <div className="bg-gradient-to-b from-primary/5 to-background">
                <section className="py-16 px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <span className="text-6xl mb-4 block">🏠</span>
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
                            HomeOwner Guardian
                        </h1>
                        <p className="text-xl text-muted mb-8 max-w-2xl mx-auto">
                            Your comprehensive protection system for Australian home construction.
                            Stop dodgy builders from missing insulation and racking up variations.
                        </p>

                        {/* Dual CTA — new users vs returning users */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                            <Link
                                href="/guardian/login?view=sign-up"
                                className="btn-primary text-center flex-1"
                            >
                                Start Free
                            </Link>
                            <Link
                                href="/guardian/login"
                                className="px-6 py-3 border border-border rounded-lg font-semibold hover:bg-muted/10 transition-colors text-center flex-1"
                            >
                                Sign In
                            </Link>
                        </div>
                        <p className="text-sm text-muted mt-4">No credit card required</p>
                    </div>
                </section>

                {/* Trust Indicators */}
                <section className="pb-12 px-6">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex flex-wrap justify-center gap-6 text-sm text-muted">
                            <span className="flex items-center gap-2">🔒 Bank-grade encryption</span>
                            <span className="flex items-center gap-2">🇦🇺 Built for Australian standards</span>
                            <span className="flex items-center gap-2">⚖️ Legal-ready documentation</span>
                            <span className="flex items-center gap-2">📱 Works on any device</span>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-16 px-6">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-2xl font-bold text-center mb-12">What you&apos;ll get</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

                            <div className="card">
                                <span className="text-3xl mb-3 block">📋</span>
                                <h3 className="font-bold mb-2">Pre-Drywall Checklist</h3>
                                <p className="text-muted text-sm">
                                    Mandatory photo proof of ceiling batts, insulation, and electrical rough-in before plasterboard goes up.
                                </p>
                            </div>

                            <div className="card">
                                <span className="text-3xl mb-3 block">💰</span>
                                <h3 className="font-bold mb-2">Variation Lockbox</h3>
                                <p className="text-muted text-sm">
                                    Digital signatures required BEFORE any variation work begins. Track cumulative variation costs.
                                </p>
                            </div>

                            <div className="card">
                                <span className="text-3xl mb-3 block">🔒</span>
                                <h3 className="font-bold mb-2">Certification Gates</h3>
                                <p className="text-muted text-sm">
                                    Payment milestones blocked until EICC, plumbing certs, and other compliance docs are uploaded.
                                </p>
                            </div>

                            <div className="card">
                                <span className="text-3xl mb-3 block">📸</span>
                                <h3 className="font-bold mb-2">Defect Evidence</h3>
                                <p className="text-muted text-sm">
                                    Immutable, timestamped defect records with photos. Legal-ready for Fair Trading or NCAT.
                                </p>
                            </div>

                            <div className="card">
                                <span className="text-3xl mb-3 block">🛡️</span>
                                <h3 className="font-bold mb-2">License Monitor</h3>
                                <p className="text-muted text-sm">
                                    Track builder license status and insurance expiry. Get alerts 30 days before lapse.
                                </p>
                            </div>

                            <div className="card">
                                <span className="text-3xl mb-3 block">📊</span>
                                <h3 className="font-bold mb-2">Progress Dashboard</h3>
                                <p className="text-muted text-sm">
                                    Visual overview of payments, inspections, and milestones. Know exactly where you stand.
                                </p>
                            </div>

                        </div>
                    </div>
                </section>

                {/* Pricing Teaser */}
                <section className="py-16 px-6">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-2xl font-bold mb-4">Simple, transparent pricing</h2>
                        <p className="text-muted mb-8">Start free. Upgrade when you need more.</p>
                        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                            <div className="card text-center">
                                <h3 className="font-bold text-lg mb-2">Free</h3>
                                <p className="text-3xl font-extrabold mb-4">$0</p>
                                <ul className="text-sm text-muted space-y-2 text-left">
                                    <li>1 project</li>
                                    <li>3 defect records</li>
                                    <li>2 variations</li>
                                </ul>
                            </div>
                            <div className="card text-center border-primary/50 ring-1 ring-primary/20">
                                <h3 className="font-bold text-lg mb-2 text-primary">Guardian Pro</h3>
                                <p className="text-3xl font-extrabold mb-4">$14.99<span className="text-base font-normal text-muted">/mo</span></p>
                                <ul className="text-sm text-muted space-y-2 text-left">
                                    <li>Unlimited projects</li>
                                    <li>Unlimited defects & variations</li>
                                    <li>PDF export & certification gates</li>
                                </ul>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                            <Link
                                href="/guardian/pricing"
                                className="text-primary hover:underline font-medium"
                            >
                                View full pricing details →
                            </Link>
                            <Link
                                href="/guardian/faq"
                                className="text-primary hover:underline font-medium"
                            >
                                Read the FAQ →
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Bottom CTA */}
                <section className="py-16 px-6">
                    <div className="max-w-xl mx-auto text-center">
                        <h2 className="text-2xl font-bold mb-4">Ready to protect your build?</h2>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/guardian/login?view=sign-up"
                                className="btn-primary text-center"
                            >
                                Start Free — No Credit Card
                            </Link>
                            <Link
                                href="/guardian/login"
                                className="px-6 py-3 border border-border rounded-lg font-semibold hover:bg-muted/10 transition-colors text-center"
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
