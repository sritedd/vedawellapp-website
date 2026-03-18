import type { Metadata } from "next";
import { Suspense } from "react";
import PricingClient from "./PricingClient";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

export const metadata: Metadata = {
    title: "HomeOwner Guardian Pricing — Free & Pro Plans | $14.99/mo",
    description:
        "Guardian Free: 1 project, 3 defects, AI defect assist. Guardian Pro $14.99/mo: unlimited projects, AI chat, builder risk checks, PDF evidence packs. Cancel anytime.",
    keywords:
        "home construction tracker pricing, Australian building defect tracker, construction app cost, home builder protection, Guardian Pro price, owner builder tools Australia",
    openGraph: {
        title: "HomeOwner Guardian Pricing — Free & Pro Plans | $14.99/mo",
        description:
            "Free tier available. Pro from $14.99/mo — unlimited projects, AI tools, PDF exports. Cancel anytime.",
        url: "https://vedawellapp.com/guardian/pricing",
    },
    alternates: {
        canonical: "https://vedawellapp.com/guardian/pricing",
    },
};

export default function PricingPage() {
    return (
        <>
            <BreadcrumbJsonLd items={[
                { name: "Home", href: "/" },
                { name: "HomeOwner Guardian", href: "/guardian" },
                { name: "Pricing", href: "/guardian/pricing" },
            ]} />
            <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
                <PricingClient />
            </Suspense>
        </>
    );
}
