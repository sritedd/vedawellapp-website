import Link from "next/link";
import { GuardianCompetitor } from "@/data/guardian-competitors";

export default function GuardianCompare({ comp }: { comp: GuardianCompetitor }) {
    return (
        <div className="py-12 px-6">
            <div className="max-w-4xl mx-auto">
                <Link href="/guardian" className="inline-flex items-center gap-2 text-muted hover:text-primary mb-8 transition-colors">
                    ← Back to Guardian
                </Link>

                <div className="mb-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-primary">HomeOwner Guardian</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">
                    Guardian vs {comp.name}
                </h1>
                <p className="text-lg text-muted mb-10">
                    {comp.tagline} — see why Australian homeowners choose Guardian
                </p>

                {/* Side-by-side */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    {/* Guardian */}
                    <div className="bg-primary/5 border-2 border-primary rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-2xl">🏠</span>
                            <h2 className="text-xl font-bold">HomeOwner Guardian</h2>
                        </div>
                        <p className="text-sm text-primary font-medium mb-4">Free / $14.99 AUD/mo Pro</p>
                        <ul className="space-y-2.5">
                            {comp.guardianAdvantages.map((adv, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5 shrink-0">&#10003;</span>
                                    <span className="text-sm">{adv}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Competitor */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-2xl">&#127760;</span>
                            <h2 className="text-xl font-bold">{comp.name}</h2>
                        </div>
                        <p className="text-sm text-muted mb-4">{comp.pricing} — {comp.target}</p>
                        <p className="text-xs font-bold text-muted uppercase tracking-wide mb-3">Limitations</p>
                        <ul className="space-y-2.5">
                            {comp.limitations.map((lim, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-red-400 mt-0.5 shrink-0">&#10007;</span>
                                    <span className="text-sm text-muted">{lim}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Feature comparison table */}
                <div className="bg-card border border-border rounded-xl overflow-hidden mb-12">
                    <div className="p-4 border-b border-border bg-muted/5">
                        <h3 className="font-bold">Feature-by-Feature Comparison</h3>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/5">
                                <th className="px-4 py-3 text-left font-medium text-muted">Feature</th>
                                <th className="px-4 py-3 text-left font-medium text-primary">Guardian</th>
                                <th className="px-4 py-3 text-left font-medium text-muted">{comp.name}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {comp.comparisonRows.map((row) => (
                                <tr key={row.label} className="hover:bg-muted/5">
                                    <td className="px-4 py-3 font-medium">{row.label}</td>
                                    <td className="px-4 py-3 text-green-600 font-medium">{row.guardian}</td>
                                    <td className="px-4 py-3 text-muted">{row.competitor}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* What they offer */}
                {comp.features.length > 0 && (
                    <div className="mb-12">
                        <h3 className="text-lg font-bold mb-4">What {comp.name} Offers</h3>
                        <div className="bg-card border border-border rounded-xl p-6">
                            <ul className="grid sm:grid-cols-2 gap-2">
                                {comp.features.map((f, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm">
                                        <span className="text-muted mt-0.5">•</span>
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <p className="text-xs text-muted mt-4">
                                Source: {comp.url}
                            </p>
                        </div>
                    </div>
                )}

                {/* CTA */}
                <div className="text-center bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-8">
                    <h3 className="text-2xl font-bold mb-2">Protect Your Build With Guardian</h3>
                    <p className="text-muted mb-6 max-w-lg mx-auto">
                        Track defects, variations, and costs independently. Your data, your evidence, your protection.
                        Free to start — no credit card required.
                    </p>
                    <div className="flex justify-center gap-4 flex-wrap">
                        <Link
                            href="/guardian/login"
                            className="inline-block px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
                        >
                            Start Free
                        </Link>
                        <Link
                            href="/guardian/pricing"
                            className="inline-block px-8 py-3 border border-border rounded-xl font-bold hover:bg-muted/10 transition-colors"
                        >
                            See Pricing
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
