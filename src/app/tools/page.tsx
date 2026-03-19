import type { Metadata } from "next";
import ToolsClient from "./ToolsClient";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

export const metadata: Metadata = {
    title: "90+ Free Online Tools — PDF, Image, Developer, SEO & More",
    description:
        "Browse 90+ free browser-based tools: PDF merge & compress, image compressor & resizer, password generator, JSON formatter, QR code generator, calculators, converters and more. No sign-ups, no uploads — 100% private.",
    keywords:
        "free online tools, PDF tools, image tools, developer tools, SEO tools, calculators, converters, password generator, QR code generator, JSON formatter, browser-based tools",
    openGraph: {
        title: "90+ Free Online Tools — PDF, Image, Developer, SEO & More",
        description:
            "Free browser-based productivity tools. No sign-ups, no downloads — everything runs locally in your browser.",
        url: "https://vedawellapp.com/tools",
    },
    alternates: {
        canonical: "https://vedawellapp.com/tools",
    },
};

export default function ToolsPage() {
    return (
        <>
            <BreadcrumbJsonLd items={[{ name: "Home", href: "/" }, { name: "Free Tools", href: "/tools" }]} />
            <ToolsClient />
        </>
    );
}
