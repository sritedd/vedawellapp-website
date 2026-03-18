import Link from "next/link";
import type { Metadata } from "next";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

export const metadata: Metadata = {
    title: "FAQ — HomeOwner Guardian | 26 Common Questions Answered",
    description:
        "Is Guardian free? How does AI defect analysis work? Is my evidence legal-ready for NCAT? Get answers to 26 common questions about HomeOwner Guardian for Australian home builders.",
    keywords:
        "HomeOwner Guardian FAQ, home construction tracker questions, building defect documentation, NCAT evidence, NSW Fair Trading complaints, AI construction app",
    alternates: {
        canonical: "https://vedawellapp.com/guardian/faq",
    },
};

const FAQ_SECTIONS = [
    {
        title: "Getting Started",
        faqs: [
            {
                q: "What is HomeOwner Guardian?",
                a: "HomeOwner Guardian is a comprehensive digital tool for Australian homeowners to track and document their home construction project. It helps you monitor variations, defects, inspections, certifications, and payment milestones \u2014 creating legal-ready documentation that can be used for NSW Fair Trading complaints or NCAT disputes.",
            },
            {
                q: "Is HomeOwner Guardian free to use?",
                a: "Yes! The free plan lets you track 1 project with up to 3 defect records and 2 variations. This is perfect for getting started. Guardian Pro ($14.99/mo) unlocks unlimited projects, defects, variations, PDF exports, and certification gates.",
            },
            {
                q: "Who is HomeOwner Guardian designed for?",
                a: "Guardian is built for three types of users: Homeowners building or renovating a home, Builders managing construction projects, and Certifiers inspecting and signing off on work. Each role gets a tailored experience.",
            },
            {
                q: "How do I create my first project?",
                a: "After signing up, click \"Create New Project\" from your dashboard. You'll select your build type (new build, renovation, etc.) and state, then enter your project details including builder name, license number, contract value, and site address. Guardian will automatically set up stage-specific checklists based on your state's building regulations.",
            },
            {
                q: "Do I need to download an app?",
                a: "No. HomeOwner Guardian runs entirely in your web browser and works on any device \u2014 desktop, tablet, or mobile. Simply visit vedawellapp.com/guardian and sign in. No app store downloads required.",
            },
        ],
    },
    {
        title: "Features",
        faqs: [
            {
                q: "What is the Pre-Plasterboard Checklist?",
                a: "The Pre-Plasterboard (Pre-Drywall) Checklist is one of the most critical inspection points in your build. Before plasterboard goes up, you need photo evidence of ceiling batts, wall insulation, electrical rough-in, plumbing rough-in, and fire safety measures. Guardian provides a structured checklist with mandatory photo uploads to ensure nothing gets hidden behind walls.",
            },
            {
                q: "How does the Variation Lockbox work?",
                a: "The Variation Lockbox requires digital signatures BEFORE any variation work begins. When your builder proposes a change, you log it in Guardian with the description, cost, and reason. Both parties must acknowledge the variation before work starts. This prevents surprise charges and creates an auditable trail of all changes to your original contract.",
            },
            {
                q: "What are Certification Gates?",
                a: "Certification Gates block payment milestones until required compliance documents are uploaded. For example, you can set a gate requiring EICC (Electrical Installation Compliance Certificate), plumbing compliance certificate, or waterproofing certificate before releasing a progress payment. This ensures your builder meets all regulatory requirements before getting paid.",
            },
            {
                q: "Can I upload photos as evidence?",
                a: "Yes. Guardian supports photo uploads for defects, progress tracking, site visits, and checklist items. All photos are timestamped and stored immutably \u2014 meaning they can't be altered after upload. This creates legal-ready evidence for any future disputes.",
            },
            {
                q: "How do I generate reports?",
                a: "Guardian Pro users can generate comprehensive PDF reports including defect summaries, variation logs, payment schedules, and inspection timelines. These reports are formatted for submission to NSW Fair Trading, NCAT, or your solicitor. Free plan users can view all data on-screen but cannot export PDFs.",
            },
        ],
    },
    {
        title: "Legal & Compliance",
        faqs: [
            {
                q: "Is the evidence from Guardian legal-ready for NCAT?",
                a: "Yes. Guardian's timestamped, immutable records are designed to meet evidentiary standards for NCAT (NSW Civil and Administrative Tribunal) proceedings. The structured format \u2014 with dates, descriptions, photos, and digital signatures \u2014 provides the kind of contemporaneous documentation that tribunals expect. However, we always recommend consulting a building lawyer for specific legal advice.",
            },
            {
                q: "Can I use Guardian for NSW Fair Trading complaints?",
                a: "Absolutely. When filing a complaint with NSW Fair Trading, having organised documentation significantly strengthens your case. Guardian's export feature generates chronological evidence packs with defect photos, variation records, and communication logs \u2014 exactly what Fair Trading assessors need to evaluate your complaint.",
            },
            {
                q: "What documentation does Guardian provide?",
                a: "Guardian provides: defect registers with timestamped photos, variation logs with cost tracking, payment milestone records, inspection checklists (pre-slab, frame, pre-plasterboard, lockup, fixing, completion), certification tracking (EICC, plumbing, waterproofing), communication logs, and comprehensive PDF reports. All data is organised by project and stage.",
            },
        ],
    },
    {
        title: "Account & Billing",
        faqs: [
            {
                q: "What's included in the free plan?",
                a: "The free plan includes: 1 project, 3 defect records, 2 variation records, all checklists, the progress dashboard, and basic reporting. It's enough to get started and see the value of Guardian before upgrading.",
            },
            {
                q: "What does Guardian Pro include?",
                a: "Guardian Pro ($14.99/month) includes: unlimited projects, unlimited defects and variations, PDF export and evidence packs, certification gates, advanced reporting, budget dashboard, material registry, communication log, and priority support.",
            },
            {
                q: "How do I cancel my subscription?",
                a: "You can cancel your Guardian Pro subscription at any time from your dashboard. Click \"Manage Billing\" to access the Stripe customer portal where you can cancel, update payment methods, or view invoices. Your Pro features remain active until the end of your current billing period.",
            },
        ],
    },
    {
        title: "Security & Privacy",
        faqs: [
            {
                q: "How is my data protected?",
                a: "Guardian uses bank-grade encryption (TLS 1.3) for all data in transit and AES-256 encryption for data at rest. Your data is stored securely on Supabase's infrastructure with automatic backups. We never share your data with third parties.",
            },
            {
                q: "Who can see my project data?",
                a: "Only you can see your project data. Each project is tied to your authenticated account with Row Level Security (RLS) enforced at the database level. Not even our team can access your project details without your explicit permission.",
            },
        ],
    },
];

// Build FAQ JSON-LD schema
const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_SECTIONS.flatMap((section) =>
        section.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: {
                "@type": "Answer",
                text: faq.a,
            },
        }))
    ),
};

export default function GuardianFaqPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
            <BreadcrumbJsonLd items={[
                { name: "Home", href: "/" },
                { name: "HomeOwner Guardian", href: "/guardian" },
                { name: "FAQ", href: "/guardian/faq" },
            ]} />

            <div className="bg-gradient-to-b from-primary/5 to-background">
                <section className="py-16 px-6">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-12">
                            <Link href="/guardian" className="text-muted hover:text-primary text-sm mb-4 inline-block">
                                &larr; Back to Guardian
                            </Link>
                            <h1 className="text-4xl font-extrabold mb-4">Frequently Asked Questions</h1>
                            <p className="text-xl text-muted">
                                Everything you need to know about HomeOwner Guardian
                            </p>
                        </div>

                        <div className="space-y-10">
                            {FAQ_SECTIONS.map((section) => (
                                <div key={section.title}>
                                    <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                                    <div className="space-y-3">
                                        {section.faqs.map((faq) => (
                                            <details
                                                key={faq.q}
                                                className="card group"
                                            >
                                                <summary className="cursor-pointer font-semibold flex items-center justify-between list-none">
                                                    <span>{faq.q}</span>
                                                    <span className="text-muted group-open:rotate-180 transition-transform ml-4 flex-shrink-0">
                                                        &#9660;
                                                    </span>
                                                </summary>
                                                <p className="text-muted mt-4 leading-relaxed">
                                                    {faq.a}
                                                </p>
                                            </details>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <div className="mt-16 text-center card bg-primary/5 border-primary/20">
                            <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
                            <p className="text-muted mb-6">
                                Start your free project and see Guardian in action, or reach out to our support team.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/guardian/login?view=sign-up"
                                    className="btn-primary text-center"
                                >
                                    Start Free
                                </Link>
                                <a
                                    href="mailto:support@vedawellapp.com"
                                    className="px-6 py-3 border border-border rounded-lg font-semibold hover:bg-muted/10 transition-colors text-center"
                                >
                                    Contact Support
                                </a>
                            </div>
                        </div>

                        {/* Internal cross-links for SEO */}
                        <nav className="mt-12 pt-8 border-t border-border" aria-label="Related Guardian pages">
                            <h3 className="text-lg font-semibold mb-4">Explore HomeOwner Guardian</h3>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <Link href="/guardian" className="flex items-center gap-2 p-3 rounded-lg hover:bg-primary/5 transition-colors text-sm">
                                    <span className="text-primary">&#8594;</span> Guardian Overview &amp; Features
                                </Link>
                                <Link href="/guardian/pricing" className="flex items-center gap-2 p-3 rounded-lg hover:bg-primary/5 transition-colors text-sm">
                                    <span className="text-primary">&#8594;</span> Pricing &amp; Plans
                                </Link>
                                <Link href="/blog/guardian-ai-construction-assistant" className="flex items-center gap-2 p-3 rounded-lg hover:bg-primary/5 transition-colors text-sm">
                                    <span className="text-primary">&#8594;</span> Guardian AI Features Explained
                                </Link>
                                <Link href="/blog/homeowner-guardian-vs-private-inspector" className="flex items-center gap-2 p-3 rounded-lg hover:bg-primary/5 transition-colors text-sm">
                                    <span className="text-primary">&#8594;</span> Guardian vs Private Inspector
                                </Link>
                            </div>
                        </nav>
                    </div>
                </section>
            </div>
        </>
    );
}
