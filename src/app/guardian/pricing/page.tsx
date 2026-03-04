import type { Metadata } from "next";
import { Suspense } from "react";
import PricingClient from "./PricingClient";

export const metadata: Metadata = {
    title: "HomeOwner Guardian Pricing — Free & Pro Plans for Australian Home Builders",
    description:
        "Protect your Australian home construction with Guardian Pro. Track defects, variations, certifications and payment milestones. Free tier available. Pro from $14.99/mo.",
    keywords:
        "home construction tracker, Australian building defect tracker, construction defect documentation, home builder protection, variation tracking, building certification, new home build, owner builder tools",
    openGraph: {
        title: "HomeOwner Guardian Pricing — Protect Your Home Build",
        description:
            "Track construction defects, variations, and certifications. Free tier available. Pro from $14.99 AUD/mo.",
        url: "https://vedawellapp.com/guardian/pricing",
    },
    alternates: {
        canonical: "https://vedawellapp.com/guardian/pricing",
    },
};

export default function PricingPage() {
    return (
        <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
            <PricingClient />
        </Suspense>
    );
}
