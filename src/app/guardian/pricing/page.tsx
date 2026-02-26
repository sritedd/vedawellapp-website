"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

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
            "PDF export & evidence packs",
            "Certification gates & payment milestones",
            "Document vault (1GB)",
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

export default function PricingPage() {
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();
    const cancelled = searchParams.get("payment") === "cancelled";

    const handleCheckout = async (priceId: string) => {
        if (!priceId) {
            alert("This plan is coming soon. Please choose the monthly plan for now.");
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
                alert(data.error || "Something went wrong. Please try again.");
            }
        } catch {
            alert("Network error. Please check your connection and try again.");
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
                            disabled={loading}
                            className="block w-full text-center px-6 py-3 border border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition-colors mb-8 disabled:opacity-50"
                        >
                            {loading ? "Redirecting..." : "Start Yearly Plan"}
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
            </div>
        </div>
    );
}
