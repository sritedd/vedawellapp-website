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
        description: "Track building defects, variations, and construction costs for Australian homeowners.",
        offers: [
            { "@type": "Offer", price: "0", priceCurrency: "AUD", name: "Free" },
            { "@type": "Offer", price: "14.99", priceCurrency: "AUD", name: "Guardian Pro", billingIncrement: "P1M" },
        ],
        author: { "@type": "Organization", name: "VedaWell", url: "https://vedawellapp.com" },
        featureList: "Defect tracking, Variation management, Construction checklists, Photo evidence, Tribunal-ready reports, Cost tracking",
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

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
                            Total protection for your
                            <br />
                            <span className="bg-gradient-to-r from-primary-light to-teal-300 bg-clip-text text-transparent">
                                home build
                            </span>
                        </h1>

                        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Don&apos;t lose <strong className="text-white">$40,000+</strong> on uncertified builder variations.
                            Guardian tracks every stage, flags every risk, and builds your legal evidence — automatically.
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
                    <span className="flex items-center gap-2">🔒 Bank-grade encryption</span>
                    <span className="flex items-center gap-2">🇦🇺 Built for Australian standards</span>
                    <span className="flex items-center gap-2">⚖️ NCAT &amp; Fair Trading ready</span>
                    <span className="flex items-center gap-2">📱 Works on any device</span>
                    <span className="flex items-center gap-2">🏗️ NCC 2025 compliant</span>
                </div>
            </section>

            {/* ==========================================
                AI FEATURE ANNOUNCEMENT
               ========================================== */}
            <section className="py-16 px-6 bg-gradient-to-r from-cyan-600 to-indigo-700 text-white">
                <div className="max-w-5xl mx-auto">
                    <div className="grid lg:grid-cols-[1.3fr_1fr] gap-8 items-center">
                        <div>
                            <p className="text-cyan-100 font-semibold uppercase tracking-wider text-xs mb-3">
                                Major Product Update
                            </p>
                            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
                                Guardian AI is now built into your project pages
                            </h2>
                            <p className="text-cyan-100 text-lg leading-relaxed">
                                Every stage of your build now includes AI support: smarter defect writing, personalized stage advice, builder risk checks, and construction chat on demand.
                            </p>
                            <Link
                                href="/guardian/login?view=sign-up"
                                className="inline-flex items-center justify-center mt-6 px-6 py-3 rounded-xl bg-white text-indigo-700 font-bold hover:bg-cyan-50 transition-colors"
                            >
                                Launch Guardian AI Free
                            </Link>
                        </div>
                        <div className="rounded-2xl border border-white/30 bg-white/10 backdrop-blur-sm p-6">
                            <h3 className="font-bold text-lg mb-4">What AI does for you</h3>
                            <ul className="space-y-3 text-sm text-cyan-50">
                                <li>Describe Defect AI: transform rough notes into clear, professional defect records.</li>
                                <li>Stage Advisor AI: get proactive checklists for each build stage.</li>
                                <li>Builder Check AI: assess builder risk before costly decisions.</li>
                                <li>Guardian Chat: ask complex construction questions anytime.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==========================================
                FEATURES — Premium cards
               ========================================== */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-extrabold text-center mb-4">Everything you need to protect your build</h2>
                    <p className="text-muted text-center text-lg mb-12 max-w-2xl mx-auto">
                        From contract signing to final handover, Guardian monitors every critical stage.
                    </p>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                icon: "📋", title: "Pre-Drywall Checklist", gradient: "from-teal-500 to-cyan-500",
                                desc: "Mandatory photo proof of ceiling batts, insulation, and electrical rough-in before plasterboard goes up. Your last chance to inspect.",
                            },
                            {
                                icon: "💰", title: "Variation Lockbox", gradient: "from-amber-500 to-orange-500",
                                desc: "Digital signatures required BEFORE any variation work begins. Track cumulative costs and stop budget blowouts.",
                            },
                            {
                                icon: "🔒", title: "Certification Gates", gradient: "from-indigo-500 to-purple-500",
                                desc: "Payment milestones blocked until EICC, plumbing certs, and compliance docs are uploaded. No cert = no payment.",
                            },
                            {
                                icon: "📸", title: "Defect Evidence", gradient: "from-red-500 to-pink-500",
                                desc: "Immutable, timestamped defect records with photos. Legal-ready evidence for Fair Trading or NCAT tribunals.",
                            },
                            {
                                icon: "🛡️", title: "Red Flag Alerts", gradient: "from-yellow-500 to-amber-500",
                                desc: "AI-matched pattern detection flags dodgy builder behaviours — material substitutions, skipped inspections, unsigned variations.",
                            },
                            {
                                icon: "📊", title: "Progress Dashboard", gradient: "from-blue-500 to-indigo-500",
                                desc: "Visual overview of payments, inspections, and milestones across all 7 construction stages. Know exactly where you stand.",
                            },
                        ].map((f, i) => (
                            <div key={i} className="card group hover:border-primary/30 hover:shadow-lg transition-all">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-md mb-4`}>
                                    <span className="text-2xl">{f.icon}</span>
                                </div>
                                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                                <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ==========================================
                PRICING
               ========================================== */}
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
                                <li className="flex items-center gap-2"><span className="text-success">✓</span> 1 project</li>
                                <li className="flex items-center gap-2"><span className="text-success">✓</span> 3 defect records</li>
                                <li className="flex items-center gap-2"><span className="text-success">✓</span> 2 variations</li>
                                <li className="flex items-center gap-2"><span className="text-success">✓</span> Stage tracking</li>
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
                                <li className="flex items-center gap-2"><span className="text-success">✓</span> Unlimited projects</li>
                                <li className="flex items-center gap-2"><span className="text-success">✓</span> Unlimited defects &amp; variations</li>
                                <li className="flex items-center gap-2"><span className="text-success">✓</span> PDF export &amp; legal reports</li>
                                <li className="flex items-center gap-2"><span className="text-success">✓</span> AI defect assist, stage advice, and chat</li>
                                <li className="flex items-center gap-2"><span className="text-success">✓</span> Certification gates</li>
                                <li className="flex items-center gap-2"><span className="text-success">✓</span> Red flag alerts</li>
                                <li className="flex items-center gap-2"><span className="text-success">✓</span> Priority support</li>
                            </ul>
                            <Link href="/guardian/login?view=sign-up" className="btn-primary w-full text-center block">
                                Start Free Trial
                            </Link>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                        <Link href="/guardian/pricing" className="text-primary hover:underline font-medium">
                            View full pricing details →
                        </Link>
                        <Link href="/guardian/faq" className="text-primary hover:underline font-medium">
                            Read the FAQ →
                        </Link>
                    </div>
                </div>
            </section>

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
        </>
    );
}
