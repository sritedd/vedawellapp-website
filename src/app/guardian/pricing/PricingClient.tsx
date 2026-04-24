"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/components/guardian/Toast";

// Price IDs from Stripe Dashboard (Products > Price > copy the price_xxx ID)
const PLANS = {
    free: {
        name: "Free",
        price: "$0",
        period: "forever",
        features: [
            "1 active project",
            "3 defect reports",
            "2 variation records",
            "Basic stage tracking",
            "AI defect descriptions",
            "Community resources",
        ],
        limits: [
            "No PDF export",
            "No certification gates",
            "No payment milestones",
        ],
    },
    pro_monthly: {
        name: "Guardian Pro",
        price: "$14.99",
        period: "/month",
        priceId: "price_1T4zHCGrwDXNt9f4x4O2MxlZ",
        features: [
            "Unlimited projects",
            "Unlimited defect reports",
            "Unlimited variation records",
            "\"Should I Pay?\" smart payment verdict",
            "Camera-first defect reporting",
            "Builder speed vs industry benchmarks",
            "Tribunal-ready evidence export",
            "PDF export & evidence packs",
            "Certification gates & payment milestones",
            "Document vault (1GB)",
            "AI Guardian Chat assistant",
            "AI builder risk reports",
            "AI stage-by-stage advice",
            "Fair Trading compliance reports",
            "Priority support",
        ],
        limits: [],
    },
    pro_yearly: {
        name: "Guardian Pro",
        price: "$149",
        period: "/year",
        savings: "Save $30.88/year",
        priceId: "", // Create yearly price in Stripe and paste ID here
        features: [
            "Everything in monthly plan",
            "2 months free",
            "All future feature updates",
        ],
        limits: [],
    },
};

export default function PricingClient() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [trialLoading, setTrialLoading] = useState(false);
    const [trialMessage, setTrialMessage] = useState("");
    const searchParams = useSearchParams();
    const router = useRouter();
    const cancelled = searchParams.get("payment") === "cancelled";

    const handleStartTrial = async () => {
        setTrialLoading(true);
        setTrialMessage("");
        try {
            const res = await fetch("/api/guardian/start-trial", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            const data = await res.json();

            if (res.status === 401) {
                window.location.href = "/guardian/login?returnTo=/guardian/pricing";
                return;
            }

            if (data.success) {
                setTrialMessage("Started! Redirecting to your dashboard...");
                setTimeout(() => {
                    router.push("/guardian/dashboard");
                }, 2000);
            } else {
                setTrialMessage(data.error || "Something went wrong. Please try again.");
            }
        } catch {
            setTrialMessage("Network error. Please check your connection and try again.");
        } finally {
            setTrialLoading(false);
        }
    };

    const handleCheckout = async (priceId: string) => {
        if (!priceId) {
            toast("This plan is coming soon. Please choose the monthly plan for now.", "info");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ priceId }),
            });

            const data = await res.json();

            if (data.url) {
                window.location.href = data.url;
            } else if (res.status === 401) {
                window.location.href = "/guardian/login?returnTo=/guardian/pricing";
            } else {
                toast(data.error || "Something went wrong. Please try again.", "error");
            }
        } catch {
            toast("Network error. Please check your connection and try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="py-16 px-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <Link href="/guardian" className="text-muted hover:text-primary mb-4 inline-block">
                        ← Back to Guardian
                    </Link>
                    <h1 className="text-4xl font-extrabold mb-4">
                        Protect Your Home Build
                    </h1>
                    <p className="text-xl text-muted max-w-2xl mx-auto">
                        Australian homeowners lose an average of $30,000 to construction defects.
                        Guardian Pro gives you the documentation to fight back.
                    </p>
                </div>

                {cancelled && (
                    <div className="max-w-lg mx-auto mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center text-sm">
                        Payment was cancelled. You can try again whenever you are ready.
                    </div>
                )}

                {/* Trial Banner */}
                <div className="max-w-lg mx-auto mb-10 p-6 bg-gradient-to-r from-teal-50 to-green-50 dark:from-teal-950/30 dark:to-green-950/30 border border-teal-200 dark:border-teal-800 rounded-2xl text-center">
                    <p className="text-sm font-semibold text-teal-700 dark:text-teal-300 mb-1">Not ready to commit?</p>
                    <h3 className="text-xl font-bold mb-2">Try Guardian Pro Free for 7 Days</h3>
                    <p className="text-sm text-muted mb-4">Full access to all Pro features. No credit card required.</p>
                    {trialMessage && (
                        <p className={`text-sm mb-3 ${trialMessage.includes("success") || trialMessage.includes("Started") ? "text-green-600" : "text-red-600"}`}>
                            {trialMessage}
                        </p>
                    )}
                    <button
                        onClick={handleStartTrial}
                        disabled={trialLoading}
                        className="px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
                    >
                        {trialLoading ? "Starting..." : "Start Free Trial"}
                    </button>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-16">
                    {/* Free Tier */}
                    <div className="bg-card border border-border rounded-xl p-8">
                        <h3 className="text-xl font-bold mb-2">{PLANS.free.name}</h3>
                        <div className="mb-6">
                            <span className="text-4xl font-extrabold">{PLANS.free.price}</span>
                            <span className="text-muted ml-1">{PLANS.free.period}</span>
                        </div>
                        <Link
                            href="/guardian/login"
                            className="block w-full text-center px-6 py-3 border border-border rounded-lg font-semibold hover:bg-muted/10 transition-colors mb-8"
                        >
                            Get Started Free
                        </Link>
                        <ul className="space-y-3">
                            {PLANS.free.features.map(f => (
                                <li key={f} className="flex items-start gap-2 text-sm">
                                    <span className="text-green-500 mt-0.5">&#10003;</span> {f}
                                </li>
                            ))}
                            {PLANS.free.limits.map(l => (
                                <li key={l} className="flex items-start gap-2 text-sm text-muted">
                                    <span className="mt-0.5">&#10007;</span> {l}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Pro Monthly — Most Popular */}
                    <div className="bg-card border-2 border-primary rounded-xl p-8 relative">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                            MOST POPULAR
                        </div>
                        <h3 className="text-xl font-bold mb-2">{PLANS.pro_monthly.name}</h3>
                        <div className="mb-6">
                            <span className="text-4xl font-extrabold">{PLANS.pro_monthly.price}</span>
                            <span className="text-muted ml-1">{PLANS.pro_monthly.period}</span>
                        </div>
                        <button
                            onClick={() => handleCheckout(PLANS.pro_monthly.priceId)}
                            disabled={loading}
                            className="block w-full text-center px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors mb-8 disabled:opacity-50"
                        >
                            {loading ? "Redirecting..." : "Start Guardian Pro"}
                        </button>
                        <ul className="space-y-3">
                            {PLANS.pro_monthly.features.map(f => (
                                <li key={f} className="flex items-start gap-2 text-sm">
                                    <span className="text-green-500 mt-0.5">&#10003;</span> {f}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Pro Yearly */}
                    <div className="bg-card border border-border rounded-xl p-8">
                        <h3 className="text-xl font-bold mb-2">{PLANS.pro_yearly.name}</h3>
                        <div className="mb-2">
                            <span className="text-4xl font-extrabold">{PLANS.pro_yearly.price}</span>
                            <span className="text-muted ml-1">{PLANS.pro_yearly.period}</span>
                        </div>
                        <p className="text-sm text-green-600 font-semibold mb-4">{PLANS.pro_yearly.savings}</p>
                        <button
                            onClick={() => handleCheckout(PLANS.pro_yearly.priceId)}
                            disabled={loading || !PLANS.pro_yearly.priceId}
                            className="block w-full text-center px-6 py-3 border border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition-colors mb-8 disabled:opacity-50"
                        >
                            {!PLANS.pro_yearly.priceId ? "Coming Soon" : loading ? "Redirecting..." : "Start Yearly Plan"}
                        </button>
                        <ul className="space-y-3">
                            {PLANS.pro_yearly.features.map(f => (
                                <li key={f} className="flex items-start gap-2 text-sm">
                                    <span className="text-green-500 mt-0.5">&#10003;</span> {f}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Trust section */}
                <div className="text-center max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold mb-4">Why Homeowners Trust Guardian</h2>
                    <div className="grid sm:grid-cols-3 gap-6 text-sm text-muted">
                        <div>
                            <p className="text-3xl mb-2">&#128274;</p>
                            <p className="font-semibold text-foreground">Legal-Ready Docs</p>
                            <p>Evidence packs formatted for NSW Fair Trading and NCAT</p>
                        </div>
                        <div>
                            <p className="text-3xl mb-2">&#128247;</p>
                            <p className="font-semibold text-foreground">Photo Evidence</p>
                            <p>Timestamped defect photos that hold up in disputes</p>
                        </div>
                        <div>
                            <p className="text-3xl mb-2">&#128176;</p>
                            <p className="font-semibold text-foreground">Variation Control</p>
                            <p>Track every cost change before your builder racks them up</p>
                        </div>
                    </div>
                </div>

                {/* Internal cross-links for SEO */}
                <nav className="mt-16 pt-8 border-t border-border max-w-2xl mx-auto" aria-label="Related Guardian pages">
                    <h3 className="text-lg font-semibold mb-4 text-center">Learn More About Guardian</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                        <Link href="/guardian" className="flex items-center gap-2 p-3 rounded-lg hover:bg-primary/5 transition-colors text-sm">
                            <span className="text-primary">&#8594;</span> Guardian Overview &amp; Features
                        </Link>
                        <Link href="/guardian/faq" className="flex items-center gap-2 p-3 rounded-lg hover:bg-primary/5 transition-colors text-sm">
                            <span className="text-primary">&#8594;</span> Frequently Asked Questions
                        </Link>
                        <Link href="/blog/guardian-ai-construction-assistant" className="flex items-center gap-2 p-3 rounded-lg hover:bg-primary/5 transition-colors text-sm">
                            <span className="text-primary">&#8594;</span> Guardian AI Features Explained
                        </Link>
                        <Link href="/blog/homeowner-guardian-app-launch" className="flex items-center gap-2 p-3 rounded-lg hover:bg-primary/5 transition-colors text-sm">
                            <span className="text-primary">&#8594;</span> Why We Built Guardian
                        </Link>
                    </div>
                </nav>
            </div>
        </div>
    );
}
