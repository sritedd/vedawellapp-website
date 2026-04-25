import type { Metadata } from "next";
import RedFlagsSignupForm from "./SignupForm";

export const metadata: Metadata = {
    title: "30 Red Flags Your Builder Is Dodgy — Free PDF for Australian Homeowners",
    description: "A free field guide for Australians currently building. The 30 most common signs your builder is cutting corners, ranked by build stage, with the exact action to take for each. Download instantly.",
    alternates: { canonical: "https://vedawellapp.com/red-flags" },
    openGraph: {
        title: "30 Red Flags Your Builder Is Dodgy",
        description: "Free PDF — the 30 most common signs your Australian builder is dodgy, by stage, with what to do next.",
        url: "https://vedawellapp.com/red-flags",
        type: "article",
        images: [{ url: "/og-default.png", width: 1200, height: 630 }],
    },
    twitter: {
        card: "summary_large_image",
        title: "30 Red Flags Your Builder Is Dodgy — Free PDF",
        description: "The 30 most common signs your Australian builder is cutting corners. Free download.",
    },
};

const FLAGS_PREVIEW = [
    { stage: "Pre-construction", title: "Builder pressures you to sign same-day" },
    { stage: "Pre-construction", title: "No HBCF / home warranty insurance certificate" },
    { stage: "Pre-construction", title: "Cash / off-book discount offered" },
    { stage: "Slab", title: "Concrete poured before footing inspection" },
    { stage: "Slab", title: "Plumbing rough-in skipped under slab" },
    { stage: "Frame", title: "Twisted or split timber in frame" },
    { stage: "Frame", title: "Insulation missing or substituted" },
    { stage: "Lockup", title: "EICC (electrical compliance) not provided before payment" },
    { stage: "Lockup", title: "Waterproofing membrane not shown pre-tile" },
    { stage: "Fixing", title: "Appliance or fixture brand substituted" },
    { stage: "Handover", title: "Builder rushes you through the final walk-through" },
    { stage: "Handover", title: "Defects list gets \"lost\" or \"forgotten\"" },
];

export default function RedFlagsPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 text-white">
                <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wider mb-6">
                        Free Guide · For Australian Homeowners
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
                        30 Red Flags Your Builder Is Dodgy
                    </h1>
                    <p className="text-lg md:text-2xl text-teal-50 max-w-3xl leading-relaxed mb-8">
                        A field guide for anyone currently building a new home. The 30 most common signs your builder is cutting corners — by build stage, with the exact action to take for each.
                    </p>

                    <div className="grid md:grid-cols-2 gap-8 items-start">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-400 text-teal-900 flex items-center justify-center text-sm font-bold">✓</span>
                                <span className="text-teal-50">Covers all 8 stages — pre-construction through handover and warranty period</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-400 text-teal-900 flex items-center justify-center text-sm font-bold">✓</span>
                                <span className="text-teal-50">State-specific — NSW, VIC, QLD, WA, SA, TAS, ACT, NT</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-400 text-teal-900 flex items-center justify-center text-sm font-bold">✓</span>
                                <span className="text-teal-50">Each flag includes the exact next step — phone call, photo, written notice</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-400 text-teal-900 flex items-center justify-center text-sm font-bold">✓</span>
                                <span className="text-teal-50">Email delivery — PDF arrives in your inbox within 60 seconds</span>
                            </div>
                            <p className="text-sm text-teal-200 mt-6">
                                A single caught red flag can save you $5,000–$60,000. Most homeowners catch four or five before handover.
                            </p>
                        </div>

                        <div className="bg-white text-foreground rounded-2xl p-6 md:p-8 shadow-2xl">
                            <RedFlagsSignupForm />
                        </div>
                    </div>
                </div>
            </section>

            {/* What's inside */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-3 text-center">A taste of what&apos;s inside</h2>
                    <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
                        Below are 12 of the 30 red flags. The full PDF has the &quot;why it matters&quot; and &quot;do this now&quot; for each one.
                    </p>

                    <div className="grid md:grid-cols-2 gap-3">
                        {FLAGS_PREVIEW.map((f, i) => (
                            <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
                                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center text-sm font-bold">
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{f.stage}</div>
                                    <div className="font-medium text-foreground">{f.title}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-8">
                        <p className="text-muted-foreground text-sm">
                            +18 more across pre-construction, frame, lockup, fixing, handover, and warranty.
                        </p>
                    </div>
                </div>
            </section>

            {/* Why we made this */}
            <section className="py-16 px-6 bg-card border-y border-border">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">Why we made this</h2>
                    <div className="space-y-4 text-foreground/80 leading-relaxed">
                        <p>
                            We build software that helps Australian homeowners protect themselves during construction — defect logs, AI contract review, tribunal evidence packages. Customers kept telling us the same thing:
                        </p>
                        <p className="italic border-l-4 border-teal-500 pl-4 py-2 bg-teal-50 dark:bg-teal-950/30 rounded">
                            &ldquo;If only I&apos;d known what to look for in the first month, I&apos;d have caught it before the slab went down.&rdquo;
                        </p>
                        <p>
                            This guide is what we wish every Australian homeowner had on their phone the day they signed a building contract. It&apos;s free because catching a single red flag pays for itself many times over — whether you ever use our app or not.
                        </p>
                    </div>
                </div>
            </section>

            {/* Trust strip */}
            <section className="py-12 px-6 bg-background">
                <div className="max-w-3xl mx-auto text-center">
                    <p className="text-sm text-muted-foreground">
                        We&apos;ll email you the PDF immediately. We&apos;ll occasionally send tips for catching builder issues during your build. Unsubscribe in one click — your email is never sold.
                    </p>
                </div>
            </section>
        </div>
    );
}
