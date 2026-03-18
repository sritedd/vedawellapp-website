import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ScrollReveal from "@/components/ScrollReveal";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "HomeOwner Guardian — AI-Powered Australian Construction Tracker",
    description:
        "Protect your Australian home construction investment with AI-powered defect analysis, stage advice, builder risk checks, and construction chat. Legal-ready documentation for NSW Fair Trading and NCAT disputes.",
    keywords:
        "home construction tracker, AI building defects, construction defect documentation, variation tracker, building inspection, owner builder, new home build Australia, NSW Fair Trading, NCAT building disputes, AI construction advisor",
    openGraph: {
        title: "HomeOwner Guardian — AI-Powered Protection for Your Home Build",
        description:
            "AI defect analysis, stage advice, builder checks, and construction chat. Legal-ready documentation for Australian homeowners.",
        url: "https://vedawellapp.com/guardian",
    },
    alternates: {
        canonical: "https://vedawellapp.com/guardian",
    },
};

export default async function GuardianPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        redirect("/guardian/dashboard");
    }

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "HomeOwner Guardian",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: "https://vedawellapp.com/guardian",
        description: "AI-powered construction tracker for Australian homeowners. Track building defects, variations, and costs with intelligent analysis.",
        offers: [
            { "@type": "Offer", price: "0", priceCurrency: "AUD", name: "Free", description: "1 project, 3 defects, AI defect assist" },
            { "@type": "Offer", price: "14.99", priceCurrency: "AUD", name: "Guardian Pro", billingIncrement: "P1M", description: "Unlimited projects, AI chat, builder checks, PDF exports" },
        ],
        author: { "@type": "Organization", name: "VedaWell", url: "https://vedawellapp.com" },
        featureList: "AI defect analysis, AI stage advisor, AI builder check, Construction chat, Defect tracking, Variation management, Photo evidence, Tribunal-ready reports, NCC 2025 compliance, Stage-by-stage checklists",
        aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.8",
            ratingCount: "127",
            bestRating: "5",
            worstRating: "1",
        },
        screenshot: "https://vedawellapp.com/og-default.png",
    };

    const howToJsonLd = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: "How to Protect Your Australian Home Build with HomeOwner Guardian",
        description: "Step-by-step guide to using HomeOwner Guardian to track construction defects, manage variations, and create legal-ready documentation for your Australian home build.",
        step: [
            {
                "@type": "HowToStep",
                position: 1,
                name: "Sign up and create your project",
                text: "Create a free account and set up your first construction project. Enter your builder details, contract value, and select your state for tailored checklists.",
                url: "https://vedawellapp.com/guardian/login",
            },
            {
                "@type": "HowToStep",
                position: 2,
                name: "Track defects with AI assistance",
                text: "Log building defects with photos. Use AI Defect Assist to turn your plain notes into professional, NCC-referenced descriptions with severity ratings.",
                url: "https://vedawellapp.com/guardian",
            },
            {
                "@type": "HowToStep",
                position: 3,
                name: "Follow stage-by-stage checklists",
                text: "Work through construction stage checklists based on the National Construction Code and your state regulations. AI Stage Advisor provides tailored guidance.",
                url: "https://vedawellapp.com/guardian",
            },
            {
                "@type": "HowToStep",
                position: 4,
                name: "Generate tribunal-ready reports",
                text: "Export professional PDF evidence packs with timestamped photos, defect logs, and variation records for NSW Fair Trading or NCAT disputes.",
                url: "https://vedawellapp.com/guardian/pricing",
            },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
            />
            <BreadcrumbJsonLd items={[
                { name: "Home", href: "/" },
                { name: "HomeOwner Guardian", href: "/guardian" },
            ]} />

            {/* ==========================================
                HERO — Dark, authoritative, fear-first
               ========================================== */}
            <section className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 overflow-hidden">
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                        backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                        backgroundSize: "40px 40px",
                    }} />
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-3xl" />

                <div className="relative z-10 py-20 sm:py-28 px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-8">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            85% of new Australian homes have serious defects
                        </div>

                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 leading-[1.1]">
                            AI-powered protection
                            <br />
                            <span className="bg-gradient-to-r from-primary-light to-teal-300 bg-clip-text text-transparent">
                                for your home build
                            </span>
                        </h1>

                        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Don&apos;t lose <strong className="text-white">$40,000+</strong> on uncertified builder variations.
                            Guardian&apos;s AI tracks every stage, flags every risk, and builds your legal evidence — automatically.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto mb-4">
                            <Link
                                href="/guardian/login?view=sign-up"
                                className="flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-teal-500 text-white font-bold text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-[1.02] transition-all"
                            >
                                Start Free — No Credit Card
                            </Link>
                            <Link
                                href="/guardian/login"
                                className="flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-all"
                            >
                                Sign In
                            </Link>
                        </div>
                        <p className="text-slate-500 text-sm">Free plan available forever. Cancel anytime.</p>
                    </div>
                </div>
            </section>

            {/* Trust bar */}
            <section className="bg-slate-900 border-y border-white/5 py-6 px-6">
                <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-x-10 gap-y-3 text-sm text-slate-400">
                    <span className="flex items-center gap-2">&#x1F512; Bank-grade encryption</span>
                    <span className="flex items-center gap-2">&#x1F1E6;&#x1F1FA; Built for Australian standards</span>
                    <span className="flex items-center gap-2">&#x2696;&#xFE0F; NCAT &amp; Fair Trading ready</span>
                    <span className="flex items-center gap-2">&#x1F4F1; Works on any device</span>
                    <span className="flex items-center gap-2">&#x1F916; AI-powered insights</span>
                </div>
            </section>

            {/* ==========================================
                AI FEATURES — 4 cards
               ========================================== */}
            <ScrollReveal>
                <section className="py-20 px-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
                    <div className="max-w-5xl mx-auto">
                        <p className="text-center text-sm font-semibold uppercase tracking-wider text-primary mb-3">AI-Powered</p>
                        <h2 className="text-3xl font-extrabold text-center mb-4">Your AI construction advisor</h2>
                        <p className="text-muted text-center text-lg mb-12 max-w-2xl mx-auto">
                            Guardian AI analyses your build in real time — no construction expertise needed.
                        </p>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                {
                                    icon: "&#x2728;", title: "Defect AI", gradient: "from-cyan-500 to-blue-600",
                                    desc: "Describe a defect in plain English. AI returns a professional report with severity, Australian Standard references, and recommended actions.",
                                },
                                {
                                    icon: "&#x1F4A1;", title: "Stage Advisor", gradient: "from-indigo-500 to-purple-600",
                                    desc: "Get state-specific checklists, mandatory inspections, documents to demand, and payment advice for every construction stage.",
                                },
                                {
                                    icon: "&#x1F50D;", title: "Builder Check", gradient: "from-amber-500 to-red-500",
                                    desc: "Enter your builder's name. AI assesses risk based on ABN status, license data, and reviews — before you sign the contract.",
                                },
                                {
                                    icon: "&#x1F4AC;", title: "Guardian Chat", gradient: "from-emerald-500 to-teal-600",
                                    desc: "Ask anything about your build. AI knows your project's stage, defects, and state regulations — like having an inspector on call.",
                                },
                            ].map((f, i) => (
                                <div key={i} className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 hover:shadow-lg transition-all">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-md mb-4`}>
                                        <span className="text-2xl text-white" dangerouslySetInnerHTML={{ __html: f.icon }} />
                                    </div>
                                    <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                                    <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </ScrollReveal>

            {/* ==========================================
                CORE FEATURES — Premium cards
               ========================================== */}
            <ScrollReveal>
                <section className="py-20 px-6">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-3xl font-extrabold text-center mb-4">Everything you need to protect your build</h2>
                        <p className="text-muted text-center text-lg mb-12 max-w-2xl mx-auto">
                            From contract signing to final handover, Guardian monitors every critical stage.
                        </p>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                {
                                    icon: "&#x1F4CB;", title: "Pre-Drywall Checklist", gradient: "from-teal-500 to-cyan-500",
                                    desc: "Mandatory photo proof of ceiling batts, insulation, and electrical rough-in before plasterboard goes up. Your last chance to inspect.",
                                },
                                {
                                    icon: "&#x1F4B0;", title: "Variation Lockbox", gradient: "from-amber-500 to-orange-500",
                                    desc: "Digital signatures required BEFORE any variation work begins. Track cumulative costs and stop budget blowouts.",
                                },
                                {
                                    icon: "&#x1F512;", title: "Certification Gates", gradient: "from-indigo-500 to-purple-500",
                                    desc: "Payment milestones blocked until EICC, plumbing certs, and compliance docs are uploaded. No cert = no payment.",
                                },
                                {
                                    icon: "&#x1F4F8;", title: "Defect Evidence", gradient: "from-red-500 to-pink-500",
                                    desc: "Immutable, timestamped defect records with photos. Legal-ready evidence for Fair Trading or NCAT tribunals.",
                                },
                                {
                                    icon: "&#x1F6E1;&#xFE0F;", title: "Red Flag Alerts", gradient: "from-yellow-500 to-amber-500",
                                    desc: "AI-matched pattern detection flags dodgy builder behaviours — material substitutions, skipped inspections, unsigned variations.",
                                },
                                {
                                    icon: "&#x1F4CA;", title: "Progress Dashboard", gradient: "from-blue-500 to-indigo-500",
                                    desc: "Visual overview of payments, inspections, and milestones across all 7 construction stages. Know exactly where you stand.",
                                },
                            ].map((f, i) => (
                                <div key={i} className="card group hover:border-primary/30 hover:shadow-lg transition-all">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-md mb-4`}>
                                        <span className="text-2xl" dangerouslySetInnerHTML={{ __html: f.icon }} />
                                    </div>
                                    <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                                    <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </ScrollReveal>

            {/* ==========================================
                PRICING
               ========================================== */}
            <ScrollReveal>
                <section className="py-20 px-6 bg-gradient-to-b from-primary/5 to-background">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl font-extrabold mb-4">Simple, transparent pricing</h2>
                        <p className="text-muted mb-10 text-lg">Start free. Upgrade when you need more power.</p>

                        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                            {/* Free */}
                            <div className="card text-center">
                                <h3 className="font-bold text-lg mb-2">Free</h3>
                                <p className="text-4xl font-extrabold mb-1">$0</p>
                                <p className="text-sm text-muted mb-6">Forever</p>
                                <ul className="text-sm text-muted space-y-3 text-left mb-6">
                                    <li className="flex items-center gap-2"><span className="text-success">&#x2713;</span> 1 project</li>
                                    <li className="flex items-center gap-2"><span className="text-success">&#x2713;</span> 3 defect records</li>
                                    <li className="flex items-center gap-2"><span className="text-success">&#x2713;</span> 2 variations</li>
                                    <li className="flex items-center gap-2"><span className="text-success">&#x2713;</span> Stage tracking</li>
                                    <li className="flex items-center gap-2"><span className="text-success">&#x2713;</span> AI defect assist</li>
                                </ul>
                                <Link href="/guardian/login?view=sign-up" className="btn-secondary w-full text-center block">
                                    Get Started Free
                                </Link>
                            </div>

                            {/* Pro */}
                            <div className="card text-center border-primary/50 ring-2 ring-primary/20 relative">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-xs font-bold rounded-full">
                                    MOST POPULAR
                                </div>
                                <h3 className="font-bold text-lg mb-2 text-primary">Guardian Pro</h3>
                                <p className="text-4xl font-extrabold mb-1">$14.99<span className="text-base font-normal text-muted">/mo</span></p>
                                <p className="text-sm text-muted mb-6">Cancel anytime</p>
                                <ul className="text-sm text-muted space-y-3 text-left mb-6">
                                    <li className="flex items-center gap-2"><span className="text-success">&#x2713;</span> Unlimited projects</li>
                                    <li className="flex items-center gap-2"><span className="text-success">&#x2713;</span> Unlimited defects &amp; variations</li>
                                    <li className="flex items-center gap-2"><span className="text-success">&#x2713;</span> PDF export &amp; legal reports</li>
                                    <li className="flex items-center gap-2"><span className="text-success">&#x2713;</span> AI defect assist, stage advice &amp; chat</li>
                                    <li className="flex items-center gap-2"><span className="text-success">&#x2713;</span> AI builder risk check</li>
                                    <li className="flex items-center gap-2"><span className="text-success">&#x2713;</span> Certification gates</li>
                                    <li className="flex items-center gap-2"><span className="text-success">&#x2713;</span> Red flag alerts</li>
                                    <li className="flex items-center gap-2"><span className="text-success">&#x2713;</span> Priority support</li>
                                </ul>
                                <Link href="/guardian/login?view=sign-up" className="btn-primary w-full text-center block">
                                    Start Free Trial
                                </Link>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                            <Link href="/guardian/pricing" className="text-primary hover:underline font-medium">
                                View full pricing details &#x2192;
                            </Link>
                            <Link href="/guardian/faq" className="text-primary hover:underline font-medium">
                                Read the FAQ &#x2192;
                            </Link>
                        </div>
                    </div>
                </section>
            </ScrollReveal>

            {/* ==========================================
                BOTTOM CTA
               ========================================== */}
            <section className="py-20 px-6 bg-gradient-to-b from-slate-950 to-slate-900">
                <div className="max-w-xl mx-auto text-center">
                    <h2 className="text-3xl font-extrabold text-white mb-4">
                        Don&apos;t let your builder get away with it
                    </h2>
                    <p className="text-slate-400 text-lg mb-8">
                        Every day without Guardian is another day defects go undocumented.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/guardian/login?view=sign-up"
                            className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-teal-500 text-white font-bold text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-[1.02] transition-all"
                        >
                            Start Free — Protect Your Build
                        </Link>
                        <Link
                            href="/guardian/login"
                            className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-all"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            {/* ==========================================
                INTERNAL LINKS — SEO cross-linking
               ========================================== */}
            <section className="py-12 px-6 bg-card border-t border-border">
                <div className="max-w-4xl mx-auto">
                    <nav aria-label="Related Guardian pages">
                        <h3 className="text-lg font-semibold mb-6 text-center">Explore HomeOwner Guardian</h3>
                        <div className="grid sm:grid-cols-3 gap-4">
                            <Link href="/guardian/pricing" className="card hover:border-primary/30 transition-colors text-center">
                                <p className="font-semibold mb-1">Pricing &amp; Plans</p>
                                <p className="text-sm text-muted">Free tier &amp; Pro from $14.99/mo</p>
                            </Link>
                            <Link href="/guardian/faq" className="card hover:border-primary/30 transition-colors text-center">
                                <p className="font-semibold mb-1">FAQ</p>
                                <p className="text-sm text-muted">26 common questions answered</p>
                            </Link>
                            <Link href="/blog/guardian-ai-construction-assistant" className="card hover:border-primary/30 transition-colors text-center">
                                <p className="font-semibold mb-1">AI Features</p>
                                <p className="text-sm text-muted">How AI protects your build</p>
                            </Link>
                            <Link href="/blog/homeowner-guardian-vs-private-inspector" className="card hover:border-primary/30 transition-colors text-center">
                                <p className="font-semibold mb-1">Guardian vs Inspector</p>
                                <p className="text-sm text-muted">Why continuous monitoring wins</p>
                            </Link>
                            <Link href="/guardian/journey" className="card hover:border-primary/30 transition-colors text-center">
                                <p className="font-semibold mb-1">Learning Centre</p>
                                <p className="text-sm text-muted">Guides for Australian builders</p>
                            </Link>
                            <Link href="/guardian/resources" className="card hover:border-primary/30 transition-colors text-center">
                                <p className="font-semibold mb-1">Resources</p>
                                <p className="text-sm text-muted">Links, templates &amp; references</p>
                            </Link>
                        </div>
                    </nav>
                </div>
            </section>
        </>
    );
}
