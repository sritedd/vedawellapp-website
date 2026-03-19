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
        featureList: "Should I Pay verdict, Camera-first defect reporting, Builder speed benchmarking, Tribunal evidence package, AI defect analysis, AI stage advisor, AI builder check, Construction chat, Certification gates, Variation management, Photo evidence, NCC 2025 compliance, Stage-by-stage checklists",
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
                HERO — Dark, authoritative, construction-themed
               ========================================== */}
            <section className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 overflow-hidden">
                {/* Blueprint grid background — teal tinted */}
                <div className="absolute inset-0 opacity-[0.08]">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="blueprint" width="80" height="80" patternUnits="userSpaceOnUse">
                                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#14b8a6" strokeWidth="0.5" />
                                <path d="M 40 0 L 40 80 M 0 40 L 80 40" fill="none" stroke="#14b8a6" strokeWidth="0.25" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#blueprint)" />
                    </svg>
                </div>

                {/* Construction crane — right side, colorful flat design */}
                <div className="absolute right-4 top-8 w-[360px] h-[460px] hidden lg:block">
                    <svg viewBox="0 0 360 460" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        {/* Crane tower — steel blue */}
                        <rect x="160" y="50" width="16" height="400" fill="#3b82f6" opacity="0.25" rx="2" />
                        <rect x="150" y="42" width="36" height="12" fill="#3b82f6" opacity="0.3" rx="2" />
                        {/* Crane arm — teal */}
                        <rect x="40" y="36" width="280" height="10" fill="#14b8a6" opacity="0.3" rx="2" />
                        <rect x="36" y="30" width="10" height="22" fill="#14b8a6" opacity="0.25" rx="1" />
                        {/* Counterweight */}
                        <rect x="280" y="28" width="30" height="18" fill="#f59e0b" opacity="0.3" rx="2" />
                        {/* Crane cables — amber */}
                        <line x1="168" y1="50" x2="60" y2="40" stroke="#f59e0b" strokeWidth="1.5" opacity="0.3" />
                        <line x1="168" y1="50" x2="300" y2="40" stroke="#f59e0b" strokeWidth="1.5" opacity="0.3" />
                        {/* Hook cable + hook — orange */}
                        <line x1="100" y1="42" x2="100" y2="170" stroke="#f97316" strokeWidth="2" opacity="0.25" />
                        <path d="M90 170 Q100 195 110 170" stroke="#f97316" strokeWidth="2.5" fill="none" opacity="0.35" />
                        {/* Lifted beam — yellow */}
                        <rect x="80" y="195" width="40" height="6" fill="#eab308" opacity="0.25" rx="1" />
                        {/* Cross bracing — blue */}
                        <line x1="160" y1="70" x2="176" y2="150" stroke="#60a5fa" strokeWidth="1" opacity="0.15" />
                        <line x1="176" y1="70" x2="160" y2="150" stroke="#60a5fa" strokeWidth="1" opacity="0.15" />
                        <line x1="160" y1="150" x2="176" y2="230" stroke="#60a5fa" strokeWidth="1" opacity="0.15" />
                        <line x1="176" y1="150" x2="160" y2="230" stroke="#60a5fa" strokeWidth="1" opacity="0.15" />
                        <line x1="160" y1="230" x2="176" y2="310" stroke="#60a5fa" strokeWidth="1" opacity="0.15" />
                        <line x1="176" y1="230" x2="160" y2="310" stroke="#60a5fa" strokeWidth="1" opacity="0.15" />
                        <line x1="160" y1="310" x2="176" y2="390" stroke="#60a5fa" strokeWidth="1" opacity="0.15" />
                        <line x1="176" y1="310" x2="160" y2="390" stroke="#60a5fa" strokeWidth="1" opacity="0.15" />
                        {/* Base — grey */}
                        <rect x="130" y="442" width="76" height="12" fill="#94a3b8" opacity="0.2" rx="3" />
                    </svg>
                </div>

                {/* House under construction — left side, colorful isometric */}
                <div className="absolute -left-4 bottom-4 w-[380px] h-[320px] hidden lg:block">
                    <svg viewBox="0 0 380 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        {/* House walls — warm teal fill */}
                        <rect x="60" y="170" width="220" height="110" fill="#14b8a6" opacity="0.12" rx="3" />
                        {/* Roof — amber/orange */}
                        <path d="M40 175 L170 70 L300 175" stroke="#f59e0b" strokeWidth="3" fill="#f59e0b" fillOpacity="0.1" />
                        {/* Door — warm */}
                        <rect x="145" y="210" width="50" height="65" fill="#f97316" opacity="0.2" rx="3" />
                        <circle cx="185" cy="245" r="4" fill="#f97316" opacity="0.35" />
                        {/* Windows — sky blue with panes */}
                        <rect x="82" y="195" width="45" height="38" fill="#38bdf8" opacity="0.2" rx="2" />
                        <line x1="105" y1="195" x2="105" y2="233" stroke="#38bdf8" strokeWidth="1" opacity="0.3" />
                        <line x1="82" y1="214" x2="127" y2="214" stroke="#38bdf8" strokeWidth="1" opacity="0.3" />
                        <rect x="215" y="195" width="45" height="38" fill="#38bdf8" opacity="0.2" rx="2" />
                        <line x1="238" y1="195" x2="238" y2="233" stroke="#38bdf8" strokeWidth="1" opacity="0.3" />
                        <line x1="215" y1="214" x2="260" y2="214" stroke="#38bdf8" strokeWidth="1" opacity="0.3" />
                        {/* Chimney */}
                        <rect x="230" y="90" width="22" height="55" fill="#94a3b8" opacity="0.2" rx="2" />
                        {/* Scaffolding — visible orange */}
                        <line x1="310" y1="120" x2="310" y2="280" stroke="#f97316" strokeWidth="2" opacity="0.2" />
                        <line x1="345" y1="120" x2="345" y2="280" stroke="#f97316" strokeWidth="2" opacity="0.2" />
                        <line x1="308" y1="160" x2="347" y2="160" stroke="#f97316" strokeWidth="2" opacity="0.25" />
                        <line x1="308" y1="200" x2="347" y2="200" stroke="#f97316" strokeWidth="2" opacity="0.25" />
                        <line x1="308" y1="240" x2="347" y2="240" stroke="#f97316" strokeWidth="2" opacity="0.25" />
                        {/* Cross bracing on scaffold */}
                        <line x1="310" y1="160" x2="345" y2="200" stroke="#fb923c" strokeWidth="1" opacity="0.15" />
                        <line x1="345" y1="160" x2="310" y2="200" stroke="#fb923c" strokeWidth="1" opacity="0.15" />
                        {/* Construction worker silhouette on scaffold — fun touch */}
                        <circle cx="328" cy="148" r="6" fill="#f59e0b" opacity="0.25" />
                        <line x1="328" y1="154" x2="328" y2="172" stroke="#f59e0b" strokeWidth="2" opacity="0.2" />
                        {/* Hard hat on worker */}
                        <path d="M322 146 Q328 140 334 146" stroke="#f59e0b" strokeWidth="2" fill="#f59e0b" fillOpacity="0.15" />
                        {/* Ground line */}
                        <line x1="20" y1="280" x2="360" y2="280" stroke="#14b8a6" strokeWidth="1" opacity="0.15" />
                        {/* Grass/dirt texture dots */}
                        <circle cx="50" cy="285" r="2" fill="#22c55e" opacity="0.15" />
                        <circle cx="120" cy="288" r="3" fill="#22c55e" opacity="0.12" />
                        <circle cx="250" cy="286" r="2.5" fill="#22c55e" opacity="0.13" />
                        <circle cx="330" cy="284" r="2" fill="#22c55e" opacity="0.15" />
                    </svg>
                </div>

                {/* Ambient glows — more vivid */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/15 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[250px] bg-teal-500/10 rounded-full blur-3xl" />
                <div className="absolute top-1/3 left-1/4 w-[200px] h-[200px] bg-amber-500/10 rounded-full blur-3xl hidden lg:block" />

                <div className="relative z-10 py-20 sm:py-28 px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Hard hat icon — vibrant amber */}
                        <div className="inline-block mb-4">
                            <svg className="w-14 h-14 mx-auto" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 28C8 28 8 18 24 14C40 18 40 28 40 28" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                                <path d="M6 28H42V32C42 34 40 36 38 36H10C8 36 6 34 6 32V28Z" stroke="#f59e0b" strokeWidth="2.5" fill="#f59e0b" fillOpacity="0.25" />
                                <line x1="24" y1="10" x2="24" y2="14" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" />
                                <circle cx="24" cy="8" r="3" stroke="#14b8a6" strokeWidth="2" fill="#14b8a6" fillOpacity="0.3" />
                            </svg>
                        </div>

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

                {/* Construction skyline silhouette — colorful gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-20">
                    <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-full">
                        <defs>
                            <linearGradient id="skyline-grad" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.15" />
                                <stop offset="30%" stopColor="#3b82f6" stopOpacity="0.12" />
                                <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.1" />
                                <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.15" />
                            </linearGradient>
                        </defs>
                        <path d="M0 80 L0 50 L40 50 L40 35 L60 35 L60 50 L100 50 L100 25 L110 25 L110 12 L120 12 L120 25 L140 25 L140 50 L200 50 L200 30 L220 30 L220 50 L280 50 L280 18 L300 18 L300 6 L310 6 L310 18 L330 18 L330 50 L400 50 L400 35 L420 35 L420 22 L430 22 L430 35 L440 35 L440 50 L500 50 L500 40 L520 40 L520 50 L580 50 L580 22 L600 22 L600 10 L610 10 L610 22 L620 22 L620 50 L700 50 L700 32 L720 32 L720 50 L800 50 L800 25 L810 25 L810 14 L820 14 L820 25 L840 25 L840 50 L900 50 L900 35 L920 35 L920 50 L1000 50 L1000 20 L1020 20 L1020 8 L1030 8 L1030 20 L1050 20 L1050 50 L1100 50 L1100 38 L1120 38 L1120 50 L1200 50 L1200 28 L1220 28 L1220 50 L1300 50 L1300 18 L1310 18 L1310 10 L1320 10 L1320 18 L1340 18 L1340 50 L1440 50 L1440 80 Z" fill="url(#skyline-grad)" />
                    </svg>
                </div>
            </section>

            {/* Trust bar — with inline SVG construction icons */}
            <section className="bg-slate-900 border-y border-white/10 py-6 px-6">
                <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-x-10 gap-y-3 text-sm text-slate-300">
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                        Bank-grade encryption
                    </span>
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                        Built for Australian standards
                    </span>
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2 L2 7 l10 5 10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
                        NCAT &amp; Fair Trading ready
                    </span>
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
                        Works on any device
                    </span>
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2a4 4 0 0 1 4 4v2H8V6a4 4 0 0 1 4-4z" /><rect x="4" y="8" width="16" height="14" rx="2" /><circle cx="12" cy="16" r="2" /></svg>
                        AI-powered insights
                    </span>
                </div>
            </section>

            {/* ==========================================
                AI FEATURES — 4 cards
               ========================================== */}
            <ScrollReveal>
                <section className="relative py-20 px-6 bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
                    {/* Blueprint grid — teal tinted, visible */}
                    <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.04]">
                        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <pattern id="grid-ai" width="60" height="60" patternUnits="userSpaceOnUse">
                                    <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#14b8a6" strokeWidth="0.5" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid-ai)" />
                        </svg>
                    </div>

                    {/* Floating construction tools — top right */}
                    <div className="absolute -right-6 top-10 w-[200px] h-[200px] hidden lg:block">
                        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            {/* Wrench */}
                            <path d="M140 40 L160 60 L120 100 L100 80 Z" fill="#3b82f6" opacity="0.1" />
                            <circle cx="150" cy="50" r="15" stroke="#3b82f6" strokeWidth="2" opacity="0.12" fill="none" />
                            {/* Gear */}
                            <circle cx="70" cy="140" r="25" stroke="#14b8a6" strokeWidth="2" opacity="0.12" fill="#14b8a6" fillOpacity="0.04" />
                            <circle cx="70" cy="140" r="12" stroke="#14b8a6" strokeWidth="1.5" opacity="0.1" fill="none" />
                            {/* Sparkle dots */}
                            <circle cx="160" cy="150" r="4" fill="#f59e0b" opacity="0.15" />
                            <circle cx="40" cy="60" r="3" fill="#8b5cf6" opacity="0.12" />
                            <circle cx="130" cy="170" r="2.5" fill="#14b8a6" opacity="0.15" />
                        </svg>
                    </div>

                    <div className="relative z-10 max-w-5xl mx-auto">
                        <p className="text-center text-sm font-semibold uppercase tracking-wider text-teal-600 dark:text-primary mb-3">AI-Powered</p>
                        <h2 className="text-3xl font-extrabold text-center mb-4 text-slate-900 dark:text-white">Your AI construction advisor</h2>
                        <p className="text-slate-600 dark:text-slate-400 text-center text-lg mb-12 max-w-2xl mx-auto">
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
                                    <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">{f.title}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </ScrollReveal>

            {/* ==========================================
                CORE FEATURES — Premium cards with construction bg
               ========================================== */}
            <ScrollReveal>
                <section className="relative py-20 px-6 overflow-hidden">
                    {/* Colorful ruler marks — left edge */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 hidden md:block">
                        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                            <defs>
                                <pattern id="ruler" width="32" height="40" patternUnits="userSpaceOnUse">
                                    <line x1="0" y1="0" x2="32" y2="0" stroke="#14b8a6" strokeWidth="1" opacity="0.12" />
                                    <line x1="0" y1="20" x2="16" y2="20" stroke="#14b8a6" strokeWidth="0.5" opacity="0.1" />
                                    <line x1="0" y1="10" x2="8" y2="10" stroke="#14b8a6" strokeWidth="0.3" opacity="0.08" />
                                    <line x1="0" y1="30" x2="8" y2="30" stroke="#14b8a6" strokeWidth="0.3" opacity="0.08" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#ruler)" />
                        </svg>
                    </div>

                    {/* Colorful protractor — top right */}
                    <div className="absolute -right-6 -top-6 w-[280px] h-[280px] hidden lg:block">
                        <svg viewBox="0 0 250 250" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <path d="M125 225 A100 100 0 0 1 125 25" stroke="#3b82f6" strokeWidth="2" opacity="0.12" />
                            <line x1="125" y1="225" x2="125" y2="25" stroke="#3b82f6" strokeWidth="1" opacity="0.08" />
                            <line x1="125" y1="125" x2="225" y2="125" stroke="#f59e0b" strokeWidth="1.5" opacity="0.12" />
                            <line x1="125" y1="125" x2="196" y2="54" stroke="#14b8a6" strokeWidth="1" opacity="0.1" />
                            <line x1="125" y1="125" x2="54" y2="54" stroke="#14b8a6" strokeWidth="1" opacity="0.1" />
                            {/* Tick marks — amber */}
                            {[0, 30, 60, 90, 120, 150, 180].map(angle => {
                                const rad = (angle - 90) * Math.PI / 180;
                                const x1 = 125 + 95 * Math.cos(rad);
                                const y1 = 125 + 95 * Math.sin(rad);
                                const x2 = 125 + 100 * Math.cos(rad);
                                const y2 = 125 + 100 * Math.sin(rad);
                                return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f59e0b" strokeWidth="2" opacity="0.15" />;
                            })}
                            {/* Center dot */}
                            <circle cx="125" cy="125" r="4" fill="#3b82f6" opacity="0.1" />
                        </svg>
                    </div>

                    {/* Floating construction elements — bottom left */}
                    <div className="absolute left-8 bottom-8 w-[180px] h-[180px] hidden lg:block">
                        <svg viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            {/* Bricks stack */}
                            <rect x="20" y="120" width="50" height="18" fill="#f97316" opacity="0.1" rx="2" />
                            <rect x="30" y="100" width="50" height="18" fill="#f97316" opacity="0.08" rx="2" />
                            <rect x="25" y="80" width="50" height="18" fill="#f97316" opacity="0.06" rx="2" />
                            {/* Safety cone */}
                            <path d="M130 150 L145 90 L160 150 Z" fill="#f59e0b" opacity="0.12" />
                            <line x1="135" y1="130" x2="155" y2="130" stroke="white" strokeWidth="2" opacity="0.08" />
                            {/* Dots */}
                            <circle cx="100" cy="50" r="5" fill="#14b8a6" opacity="0.1" />
                            <circle cx="160" cy="60" r="3" fill="#8b5cf6" opacity="0.08" />
                        </svg>
                    </div>

                    <div className="relative z-10 max-w-5xl mx-auto">
                        <h2 className="text-3xl font-extrabold text-center mb-4 text-slate-900 dark:text-white">Everything you need to protect your build</h2>
                        <p className="text-slate-600 dark:text-slate-400 text-center text-lg mb-12 max-w-2xl mx-auto">
                            From contract signing to final handover, Guardian monitors every critical stage.
                        </p>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                {
                                    icon: "&#x1F6D1;", title: "\"Should I Pay?\" Button", gradient: "from-red-500 to-rose-600",
                                    desc: "One-glance green/red verdict. Checks certificates, inspections, and defects before every payment milestone. Red = DO NOT PAY.",
                                },
                                {
                                    icon: "&#x1F4F8;", title: "Camera-First Defects", gradient: "from-emerald-500 to-teal-500",
                                    desc: "Tap the floating camera button, snap a photo, and a defect report is created instantly. Speed-dial for photos or defect reports.",
                                },
                                {
                                    icon: "&#x23F1;&#xFE0F;", title: "Builder Speed Check", gradient: "from-blue-500 to-indigo-500",
                                    desc: "Compare your builder's pace against industry averages. Stage-by-stage dual bar charts show if they're ahead or behind schedule.",
                                },
                                {
                                    icon: "&#x2696;&#xFE0F;", title: "Tribunal Evidence Pack", gradient: "from-purple-500 to-violet-600",
                                    desc: "One tap generates a 10-section evidence package with defects, variations, inspections, payments, photos, and state-specific tribunal contacts.",
                                },
                                {
                                    icon: "&#x1F512;", title: "Certification Gates", gradient: "from-indigo-500 to-purple-500",
                                    desc: "Payment milestones blocked until EICC, plumbing certs, and compliance docs are uploaded. No cert = no payment.",
                                },
                                {
                                    icon: "&#x1F6E1;&#xFE0F;", title: "Red Flag Alerts", gradient: "from-yellow-500 to-amber-500",
                                    desc: "AI-matched pattern detection flags dodgy builder behaviours — material substitutions, skipped inspections, unsigned variations.",
                                },
                            ].map((f, i) => (
                                <div key={i} className="card group hover:border-primary/30 hover:shadow-lg transition-all">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-md mb-4`}>
                                        <span className="text-2xl" dangerouslySetInnerHTML={{ __html: f.icon }} />
                                    </div>
                                    <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">{f.title}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{f.desc}</p>
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
                                    <li className="flex items-center gap-2"><span className="text-success">&#x2713;</span> &quot;Should I Pay?&quot; smart verdict</li>
                                    <li className="flex items-center gap-2"><span className="text-success">&#x2713;</span> Tribunal evidence export</li>
                                    <li className="flex items-center gap-2"><span className="text-success">&#x2713;</span> Builder speed benchmarking</li>
                                    <li className="flex items-center gap-2"><span className="text-success">&#x2713;</span> AI defect assist, stage advice &amp; chat</li>
                                    <li className="flex items-center gap-2"><span className="text-success">&#x2713;</span> PDF export &amp; certification gates</li>
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
                BOTTOM CTA — with construction skyline
               ========================================== */}
            <section className="relative py-20 px-6 bg-gradient-to-b from-slate-950 to-slate-900 overflow-hidden">
                {/* Blueprint grid — teal tinted */}
                <div className="absolute inset-0 opacity-[0.06]">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="bp-cta" width="60" height="60" patternUnits="userSpaceOnUse">
                                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#14b8a6" strokeWidth="0.4" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#bp-cta)" />
                    </svg>
                </div>

                {/* Shield — colorful, more visible */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <svg className="w-72 h-72" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 20 L170 50 L170 110 C170 150 140 180 100 195 C60 180 30 150 30 110 L30 50 Z" stroke="#14b8a6" strokeWidth="3" opacity="0.12" fill="#14b8a6" fillOpacity="0.03" />
                        <path d="M75 105 L95 125 L130 85" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.15" />
                    </svg>
                </div>

                {/* Construction skyline — colorful gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-24">
                    <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-full">
                        <defs>
                            <linearGradient id="skyline-cta" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.12" />
                                <stop offset="25%" stopColor="#3b82f6" stopOpacity="0.1" />
                                <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.08" />
                                <stop offset="75%" stopColor="#8b5cf6" stopOpacity="0.1" />
                                <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.12" />
                            </linearGradient>
                        </defs>
                        <path d="M0 80 L0 50 L30 50 L30 35 L50 35 L50 50 L80 50 L80 45 L100 45 L100 50 L150 50 L150 25 L160 25 L160 10 L170 10 L170 25 L190 25 L190 50 L250 50 L250 40 L260 40 L260 50 L320 50 L320 30 L340 30 L340 50 L400 50 L400 20 L410 20 L410 8 L420 8 L420 20 L440 20 L440 50 L500 50 L500 40 L520 40 L520 50 L600 50 L600 15 L610 15 L610 5 L620 5 L620 15 L640 15 L640 50 L700 50 L700 35 L720 35 L720 50 L780 50 L780 45 L800 45 L800 50 L850 50 L850 28 L860 28 L860 12 L870 12 L870 28 L890 28 L890 50 L950 50 L950 38 L970 38 L970 50 L1020 50 L1020 20 L1030 20 L1030 50 L1100 50 L1100 30 L1110 30 L1110 18 L1120 18 L1120 30 L1140 30 L1140 50 L1200 50 L1200 42 L1220 42 L1220 50 L1280 50 L1280 25 L1300 25 L1300 50 L1360 50 L1360 35 L1370 35 L1370 15 L1380 15 L1380 35 L1400 35 L1400 50 L1440 50 L1440 80 Z" fill="url(#skyline-cta)" />
                    </svg>
                </div>

                {/* Floating crane accent — right side */}
                <div className="absolute right-8 top-4 w-[140px] h-[160px] hidden md:block">
                    <svg viewBox="0 0 140 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        <rect x="60" y="20" width="8" height="130" fill="#3b82f6" opacity="0.12" rx="1" />
                        <rect x="20" y="14" width="100" height="6" fill="#14b8a6" opacity="0.15" rx="1" />
                        <line x1="64" y1="20" x2="30" y2="16" stroke="#f59e0b" strokeWidth="1" opacity="0.15" />
                        <line x1="64" y1="20" x2="110" y2="16" stroke="#f59e0b" strokeWidth="1" opacity="0.15" />
                        <line x1="45" y1="17" x2="45" y2="70" stroke="#f97316" strokeWidth="1" opacity="0.12" />
                        <path d="M40 70 Q45 80 50 70" stroke="#f97316" strokeWidth="1.5" fill="none" opacity="0.15" />
                    </svg>
                </div>

                <div className="relative z-10 max-w-xl mx-auto text-center">
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
                            <Link href="/blog/guardian-should-i-pay-tribunal-export" className="card hover:border-primary/30 transition-colors text-center">
                                <p className="font-semibold mb-1">New Features</p>
                                <p className="text-sm text-muted">&quot;Should I Pay?&quot; + Tribunal Export</p>
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
