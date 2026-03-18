import type { Metadata } from "next";
import Link from "next/link";
import EmailCapture from "@/components/EmailCapture";
import StageSelector from "@/components/home/StageSelector";
import ProductShowcase from "@/components/home/ProductShowcase";
import ROICalculator from "@/components/home/ROICalculator";
import StickyGuardianCTA from "@/components/home/StickyGuardianCTA";
import AnimatedCounter from "@/components/home/AnimatedCounter";

export const metadata: Metadata = {
    title: "VedaWell — Protect Your Home Build | Australian Construction Tracker",
    description:
        "HomeOwner Guardian protects Australian homeowners from dodgy builders. Track defects, inspect every stage, and build tribunal-ready evidence. Plus 98 free online tools.",
    keywords:
        "home construction tracker, building defect tracker, Australian homeowner protection, dodgy builder, NCC 2025, NCAT evidence, home build inspection, free online tools",
    openGraph: {
        title: "VedaWell — Protect Your Home Build",
        description:
            "HomeOwner Guardian catches what builders hide. Track defects, flag non-compliance, and build your legal evidence — automatically.",
        url: "https://vedawellapp.com",
        type: "website",
    },
    alternates: {
        canonical: "https://vedawellapp.com",
    },
};

export default function HomePage() {
    return (
        <>
            {/* Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        name: "VedaWell",
                        url: "https://vedawellapp.com",
                        logo: "https://vedawellapp.com/og-default.png",
                        description:
                            "HomeOwner Guardian protects Australian homeowners during construction. Plus 98 free browser-based tools.",
                        sameAs: [
                            "https://ko-fi.com/vedawell",
                            "https://buymeacoffee.com/vedawell",
                        ],
                    }),
                }}
            />

            <StickyGuardianCTA />

            {/* ==========================================
                SECTION 1: DARK HERO — Guardian First
               ========================================== */}
            <section className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                        backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                        backgroundSize: "40px 40px",
                    }} />
                </div>
                {/* Glow effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-3xl" />

                <div className="relative z-10 py-20 sm:py-28 px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Authority badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-8">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            85% of new Australian homes have serious defects
                        </div>

                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight">
                            Your builder won&apos;t tell you
                            <br />
                            <span className="bg-gradient-to-r from-primary-light to-teal-300 bg-clip-text text-transparent">
                                what they&apos;re hiding
                            </span>
                        </h1>

                        <p className="text-xl sm:text-2xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                            <strong className="text-white">HomeOwner Guardian</strong> catches missing insulation,
                            dodgy shortcuts, and uncertified work — before it gets sealed behind walls forever.
                        </p>

                        {/* Dual CTA */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto mb-6">
                            <Link
                                href="/guardian/login?view=sign-up"
                                className="flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-teal-500 text-white font-bold text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-[1.02] transition-all"
                            >
                                Start Free — No Credit Card
                            </Link>
                            <Link
                                href="/guardian"
                                className="flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-all"
                            >
                                See How It Works
                            </Link>
                        </div>
                        <p className="text-slate-500 text-sm mb-16">
                            Free plan available forever. No lock-in. Cancel anytime.
                        </p>

                        {/* Interactive Stage Selector */}
                        <StageSelector />
                    </div>
                </div>
            </section>

            {/* ==========================================
                SECTION 2: TRUST BAR — Social Proof
               ========================================== */}
            <section className="bg-slate-900 border-y border-white/5 py-6 px-6">
                <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-x-10 gap-y-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                        <span className="text-primary-light">🔒</span>
                        <span>Bank-grade encryption</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                        <span className="text-primary-light">🇦🇺</span>
                        <span>Built for Australian standards</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                        <span className="text-primary-light">⚖️</span>
                        <span>NCAT &amp; Fair Trading ready</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                        <span className="text-primary-light">📱</span>
                        <span>Works on any device</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                        <span className="text-primary-light">🏗️</span>
                        <span>NCC 2025 compliant</span>
                    </div>
                </div>
            </section>

            {/* ==========================================
                SECTION: AI LAUNCH ANNOUNCEMENT
               ========================================== */}
            <section className="py-16 px-6 bg-gradient-to-r from-cyan-600 to-indigo-700 text-white">
                <div className="max-w-5xl mx-auto">
                    <div className="grid lg:grid-cols-[1.3fr_1fr] gap-8 items-center">
                        <div>
                            <p className="text-cyan-100 font-semibold uppercase tracking-wider text-xs mb-3">
                                Just Launched
                            </p>
                            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
                                HomeOwner Guardian AI is now inside your build workflow
                            </h2>
                            <p className="text-cyan-100 text-lg leading-relaxed">
                                Your new AI copilot helps write defect reports, gives stage-by-stage advice, checks builder risk signals, and answers construction questions in plain English.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                <Link
                                    href="/guardian/login?view=sign-up"
                                    className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white text-indigo-700 font-bold hover:bg-cyan-50 transition-colors"
                                >
                                    Start Using Guardian AI
                                </Link>
                                <Link
                                    href="/blog"
                                    className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-white/40 text-white font-semibold hover:bg-white/10 transition-colors"
                                >
                                    Explore AI Guides
                                </Link>
                            </div>
                        </div>
                        <div className="rounded-2xl border border-white/30 bg-white/10 backdrop-blur-sm p-6">
                            <h3 className="font-bold text-lg mb-4">AI-enabled features</h3>
                            <ul className="space-y-3 text-cyan-50 text-sm">
                                <li>AI Defect Assist: turn rough notes into clear, evidence-ready defect logs.</li>
                                <li>AI Stage Advice: get stage-specific checks and key documents to demand.</li>
                                <li>Builder Check AI: spot red flags from licensing and public reputation signals.</li>
                                <li>Guardian Chat: ask build questions and get context-aware answers fast.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==========================================
                SECTION 3: PROBLEM → AGITATE → SOLVE
               ========================================== */}
            <section className="py-20 px-6 bg-gradient-to-b from-background to-primary/5">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
                            The hidden cost of trusting your builder
                        </h2>
                        <p className="text-muted text-lg max-w-2xl mx-auto">
                            Every year, thousands of Australian homeowners discover their builder cut corners — after it&apos;s too late to fix cheaply.
                        </p>
                    </div>

                    {/* Pain points grid */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
                        {[
                            {
                                icon: "💧",
                                title: "Missing Waterproofing",
                                cost: "$15K – $50K",
                                desc: "Water damage behind walls discovered 2-3 years after handover",
                            },
                            {
                                icon: "🔩",
                                title: "Structural Steel Defects",
                                cost: "$20K – $100K+",
                                desc: "Under-spec steel hidden inside concrete slabs and walls",
                            },
                            {
                                icon: "🔄",
                                title: "Material Substitutions",
                                cost: "Voided Warranties",
                                desc: "Cheaper materials installed than what was quoted and paid for",
                            },
                            {
                                icon: "📋",
                                title: "Skipped Inspections",
                                cost: "No Legal Recourse",
                                desc: "Without documented evidence, tribunals can't help you",
                            },
                        ].map((item, i) => (
                            <div key={i} className="card text-center group hover:border-red-500/30 transition-colors">
                                <span className="text-4xl block mb-3">{item.icon}</span>
                                <h3 className="font-bold mb-1">{item.title}</h3>
                                <div className="text-red-500 font-extrabold text-lg mb-2">{item.cost}</div>
                                <p className="text-muted text-sm">{item.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Solution bridge */}
                    <div className="text-center bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl p-8 sm:p-10 border border-primary/20">
                        <h3 className="text-2xl font-bold mb-3">
                            Guardian watches your build so you don&apos;t have to
                        </h3>
                        <p className="text-muted mb-6 max-w-xl mx-auto">
                            From slab pour to handover, Guardian tracks every stage, flags every risk, and documents every defect — giving you the evidence you need if things go wrong.
                        </p>
                        <Link
                            href="/guardian/login?view=sign-up"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-white font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                        >
                            Start Protecting Your Build
                        </Link>
                    </div>
                </div>
            </section>

            {/* ==========================================
                SECTION 4: PRODUCT SHOWCASE (Tabbed)
               ========================================== */}
            <ProductShowcase />

            {/* ==========================================
                SECTION 5: ROI CALCULATOR
               ========================================== */}
            <ROICalculator />

            {/* ==========================================
                SECTION 6: STATS COUNTER BAR
               ========================================== */}
            <section className="py-16 px-6 bg-slate-900">
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <AnimatedCounter end={98} suffix="+" label="Free Tools" />
                        <AnimatedCounter end={19} label="Fun Games" />
                        <AnimatedCounter end={7} label="Build Stages Tracked" />
                        <AnimatedCounter end={100} suffix="%" label="Browser-Based" />
                    </div>
                </div>
            </section>

            {/* ==========================================
                SECTION 7: TESTIMONIAL / SOCIAL PROOF
               ========================================== */}
            <section className="py-20 px-6 bg-gradient-to-b from-background to-primary/5">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl sm:text-4xl font-extrabold mb-12">
                        What homeowners say
                    </h2>
                    <div className="grid sm:grid-cols-3 gap-6">
                        {[
                            {
                                quote: "Guardian caught a waterproofing issue during pre-plasterboard that would have cost us $30,000+ to fix after handover.",
                                name: "Sarah M.",
                                location: "Sydney, NSW",
                                stage: "Pre-Plasterboard",
                            },
                            {
                                quote: "The red flag alerts flagged that our builder's insurance had lapsed. Without Guardian, we'd have had zero coverage during lockup.",
                                name: "James & Lin K.",
                                location: "Melbourne, VIC",
                                stage: "Frame & Lockup",
                            },
                            {
                                quote: "When our builder refused to fix defects, we submitted Guardian's PDF report to Fair Trading. Resolved in 3 weeks.",
                                name: "Michael R.",
                                location: "Brisbane, QLD",
                                stage: "Handover",
                            },
                        ].map((t, i) => (
                            <div key={i} className="card text-left">
                                <div className="flex gap-1 mb-3 text-amber-400">
                                    {"★★★★★".split("").map((s, j) => <span key={j}>{s}</span>)}
                                </div>
                                <p className="text-sm leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                                <div className="border-t border-border pt-3">
                                    <div className="font-semibold text-sm">{t.name}</div>
                                    <div className="text-xs text-muted">{t.location} · {t.stage}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ==========================================
                SECTION 8: TOOLS & GAMES (Secondary)
               ========================================== */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
                            Plus 98 free tools &amp; 19 games
                        </h2>
                        <p className="text-muted text-lg max-w-2xl mx-auto">
                            All browser-based, no sign-ups, 100% private. From PDF tools to password generators — everything you need in one place.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6 mb-10">
                        {/* Tools card */}
                        <div className="card group hover:border-primary/30 transition-colors">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                    <span className="text-2xl">🧰</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">98 Free Tools</h3>
                                    <p className="text-muted text-sm">Calculators, converters, generators &amp; more</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-5">
                                {["PDF Merge", "Image Compress", "Password Gen", "QR Code", "JSON Format", "BMI Calc", "Mortgage Calc", "Unit Convert"].map((t) => (
                                    <span key={t} className="px-2.5 py-1 bg-primary/5 text-primary text-xs font-medium rounded-full">{t}</span>
                                ))}
                            </div>
                            <Link href="/tools" className="btn-primary inline-flex items-center gap-2 text-sm">
                                Explore All Tools →
                            </Link>
                        </div>

                        {/* Games card */}
                        <div className="card group hover:border-primary/30 transition-colors">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                                    <span className="text-2xl">🎮</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">19 Games</h3>
                                    <p className="text-muted text-sm">Classic and modern browser games</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-5">
                                {["Chess", "Sudoku", "2048", "Snake", "Tetris", "Solitaire", "Minesweeper", "Wordle"].map((g) => (
                                    <span key={g} className="px-2.5 py-1 bg-purple-500/10 text-purple-500 text-xs font-medium rounded-full">{g}</span>
                                ))}
                            </div>
                            <Link href="/games" className="btn-secondary inline-flex items-center gap-2 text-sm">
                                Play Games →
                            </Link>
                        </div>
                    </div>

                    {/* Panchang mini-card */}
                    <div className="card border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shrink-0">
                                <span className="text-2xl">🕉️</span>
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h3 className="text-lg font-bold">Hindu Panchang</h3>
                                <p className="text-muted text-sm">
                                    Accurate Tithi, Nakshatra, Yoga, Karana, Rahu Kaal &amp; auspicious timings — all calculated in your browser.
                                </p>
                            </div>
                            <Link href="/panchang" className="btn-secondary text-sm shrink-0">
                                View Panchang →
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==========================================
                SECTION 9: FINAL CTA + EMAIL CAPTURE
               ========================================== */}
            <section className="py-20 px-6 bg-gradient-to-b from-slate-950 to-slate-900 text-center">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                        Don&apos;t let your builder get away with it
                    </h2>
                    <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
                        Every day without Guardian is another day defects go undocumented. Start protecting your biggest investment today.
                    </p>
                    <Link
                        href="/guardian/login?view=sign-up"
                        className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-r from-primary to-teal-500 text-white font-bold text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-[1.02] transition-all mb-12"
                    >
                        Start Free — Protect Your Build
                    </Link>

                    <div className="max-w-md mx-auto">
                        <EmailCapture
                            source="homepage"
                            heading="Stay in the loop"
                            subtext="New tools, building tips, and Guardian updates. No spam, unsubscribe anytime."
                        />
                    </div>
                </div>
            </section>
        </>
    );
}
