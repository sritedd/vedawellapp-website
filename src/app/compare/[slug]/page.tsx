import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { COMPETITORS } from "@/data/competitors";
import { GUARDIAN_COMPETITORS } from "@/data/guardian-competitors";
import { TOOLS } from "@/data/tool-catalog";
import JsonLd from "@/components/seo/JsonLd";
import GuardianCompare from "./guardian-compare";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    const toolSlugs = COMPETITORS.map(c => ({ slug: `vedawell-vs-${c.slug}` }));
    const guardianSlugs = GUARDIAN_COMPETITORS.map(c => ({ slug: `guardian-vs-${c.slug}` }));
    return [...toolSlugs, ...guardianSlugs];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;

    // Guardian competitor
    const guardianComp = GUARDIAN_COMPETITORS.find(c => `guardian-vs-${c.slug}` === slug);
    if (guardianComp) {
        return {
            title: `HomeOwner Guardian vs ${guardianComp.name} — Australian Home Building App Comparison 2026`,
            description: `Compare HomeOwner Guardian vs ${guardianComp.name}. ${guardianComp.tagline}. See why Australian homeowners choose Guardian for defect tracking, variations, and dispute evidence.`,
            keywords: [`guardian vs ${guardianComp.slug}`, `${guardianComp.name} alternative`, `home building app australia`, `defect tracker australia`, `${guardianComp.name} comparison`],
        };
    }

    // Tool competitor
    const comp = COMPETITORS.find(c => `vedawell-vs-${c.slug}` === slug);
    if (!comp) return {};

    return {
        title: `VedaWell vs ${comp.name} — Free ${comp.category} Comparison 2026`,
        description: `Compare VedaWell Tools vs ${comp.name}. See why VedaWell is the free, private, browser-based alternative. ${comp.vedawellAdvantages[0]}.`,
        keywords: [`vedawell vs ${comp.slug}`, `${comp.name} alternative`, `free ${comp.category.toLowerCase()}`, `${comp.name} free alternative`],
    };
}

export default async function ComparePage({ params }: Props) {
    const { slug } = await params;

    // Guardian competitor pages
    const guardianComp = GUARDIAN_COMPETITORS.find(c => `guardian-vs-${c.slug}` === slug);
    if (guardianComp) {
        return <GuardianCompare comp={guardianComp} />;
    }

    // Tool competitor pages
    const comp = COMPETITORS.find(c => `vedawell-vs-${c.slug}` === slug);
    if (!comp) notFound();

    const tools = comp.relevantTools
        .map(id => TOOLS.find(t => t.id === id))
        .filter(Boolean);

    return (
        <div className="py-12 px-6">
            <JsonLd
                type="Article"
                data={{
                    name: `VedaWell vs ${comp.name}`,
                    description: `Compare VedaWell Tools vs ${comp.name} for ${comp.category}`,
                    headline: `VedaWell vs ${comp.name} — Free ${comp.category} Comparison`,
                }}
            />
            <div className="max-w-4xl mx-auto">
                <Link href="/tools" className="inline-flex items-center gap-2 text-muted hover:text-primary mb-8 transition-colors">
                    ← Back to Tools
                </Link>

                <h1 className="text-4xl font-extrabold mb-4">
                    VedaWell vs {comp.name}
                </h1>
                <p className="text-xl text-muted mb-12">
                    Free {comp.category} — {comp.tagline}
                </p>

                {/* Comparison Table */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    {/* VedaWell */}
                    <div className="bg-primary/5 border-2 border-primary rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl">🛠️</span>
                            <div>
                                <h2 className="text-xl font-bold">VedaWell Tools</h2>
                                <span className="text-sm text-primary font-medium">Free forever</span>
                            </div>
                        </div>
                        <ul className="space-y-3">
                            {comp.vedawellAdvantages.map((adv, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5 shrink-0">&#10003;</span>
                                    <span className="text-sm">{adv}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Competitor */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl">&#127760;</span>
                            <div>
                                <h2 className="text-xl font-bold">{comp.name}</h2>
                                <span className="text-sm text-muted">{comp.pricing}</span>
                            </div>
                        </div>
                        <ul className="space-y-3">
                            {comp.limitations.map((lim, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-red-400 mt-0.5 shrink-0">&#10007;</span>
                                    <span className="text-sm text-muted">{lim}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Quick Comparison Bar */}
                <div className="bg-card border border-border rounded-xl p-6 mb-12">
                    <h3 className="font-bold mb-4">Quick Comparison</h3>
                    <div className="space-y-4">
                        {[
                            { label: "Price", vedawell: "Free", competitor: comp.pricing },
                            { label: "Account Required", vedawell: "No", competitor: "Yes" },
                            { label: "File Privacy", vedawell: "100% client-side", competitor: "Uploaded to servers" },
                            { label: "Usage Limits", vedawell: "Unlimited", competitor: "Limited on free tier" },
                            { label: "Ads", vedawell: "Minimal, non-intrusive", competitor: "Yes / upsell prompts" },
                        ].map(row => (
                            <div key={row.label} className="grid grid-cols-3 gap-4 text-sm">
                                <div className="font-medium">{row.label}</div>
                                <div className="text-green-600 font-medium">{row.vedawell}</div>
                                <div className="text-muted">{row.competitor}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Relevant Tools */}
                <h3 className="text-2xl font-bold mb-6">Try These Free Tools</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
                    {tools.map(tool => tool && (
                        <Link
                            key={tool.id}
                            href={tool.href}
                            className={`block p-4 rounded-xl border ${tool.color} bg-card hover:shadow-md transition-all`}
                        >
                            <div className="text-2xl mb-2">{tool.icon}</div>
                            <div className="font-semibold text-sm">{tool.title}</div>
                            <div className="text-xs text-muted mt-1 line-clamp-2">{tool.description}</div>
                        </Link>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center bg-primary/5 border border-primary/20 rounded-2xl p-8">
                    <h3 className="text-2xl font-bold mb-3">Ready to switch?</h3>
                    <p className="text-muted mb-6">97+ free tools. No account. No uploads. No limits.</p>
                    <Link
                        href="/tools"
                        className="inline-block px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
                    >
                        Browse All Free Tools
                    </Link>
                </div>
            </div>
        </div>
    );
}
