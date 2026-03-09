import { notFound } from "next/navigation";
import Link from "next/link";
import { GUARDIAN_LANDING_PAGES } from "@/data/guardian-landing-pages";
import type { Metadata } from "next";

export function generateStaticParams() {
    return GUARDIAN_LANDING_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const page = GUARDIAN_LANDING_PAGES.find((p) => p.slug === slug);
    if (!page) return {};
    return {
        title: page.title,
        description: page.description,
        keywords: page.keywords,
        openGraph: {
            title: page.title,
            description: page.description,
            type: "article",
            url: `https://vedawellapp.com/guardian/learn/${page.slug}`,
        },
        alternates: {
            canonical: `https://vedawellapp.com/guardian/learn/${page.slug}`,
        },
    };
}

export default async function GuardianLandingPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const page = GUARDIAN_LANDING_PAGES.find((p) => p.slug === slug);
    if (!page) notFound();

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: page.h1,
        description: page.description,
        author: { "@type": "Organization", name: "VedaWell" },
        publisher: {
            "@type": "Organization",
            name: "VedaWell",
            url: "https://vedawellapp.com",
        },
        mainEntityOfPage: `https://vedawellapp.com/guardian/learn/${page.slug}`,
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div className="bg-background min-h-screen">
                {/* Hero */}
                <div className="bg-gradient-to-b from-primary/5 to-background border-b border-border">
                    <div className="max-w-3xl mx-auto px-6 py-16 text-center">
                        <p className="text-primary font-semibold text-sm uppercase tracking-wide mb-3">
                            HomeOwner Guardian
                        </p>
                        <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
                            {page.h1}
                        </h1>
                        <p className="text-muted text-lg max-w-2xl mx-auto leading-relaxed">
                            {page.intro}
                        </p>
                        <div className="mt-8 flex justify-center gap-4 flex-wrap">
                            <Link
                                href="/guardian/login"
                                className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                            >
                                {page.cta}
                            </Link>
                            <Link
                                href="/guardian"
                                className="px-6 py-3 border border-border rounded-xl font-semibold hover:bg-muted/10 transition-colors"
                            >
                                Learn More
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Content sections */}
                <div className="max-w-3xl mx-auto px-6 py-12 space-y-12">
                    {page.sections.map((section, i) => (
                        <section key={i}>
                            <h2 className="text-xl font-bold mb-3">{section.heading}</h2>
                            <p className="text-muted leading-relaxed">{section.content}</p>
                        </section>
                    ))}

                    {/* Bottom CTA */}
                    <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-8 text-center">
                        <h2 className="text-2xl font-bold mb-2">Ready to Protect Your Build?</h2>
                        <p className="text-muted mb-6">
                            Join Australian homeowners who are documenting their construction journey with Guardian.
                            Free to start — no credit card required.
                        </p>
                        <Link
                            href="/guardian/login"
                            className="inline-block px-8 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                        >
                            {page.cta}
                        </Link>
                    </div>

                    {/* Related pages */}
                    <div>
                        <h3 className="text-sm font-bold text-muted uppercase tracking-wide mb-4">
                            More Guardian Guides
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {GUARDIAN_LANDING_PAGES.filter((p) => p.slug !== slug)
                                .slice(0, 4)
                                .map((p) => (
                                    <Link
                                        key={p.slug}
                                        href={`/guardian/learn/${p.slug}`}
                                        className="block p-4 border border-border rounded-xl hover:border-primary/30 transition-colors"
                                    >
                                        <p className="font-semibold text-sm">{p.h1}</p>
                                        <p className="text-xs text-muted mt-1 line-clamp-2">{p.description}</p>
                                    </Link>
                                ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
