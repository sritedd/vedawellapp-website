import Link from "next/link";
import { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import ShareButtons from "@/components/social/ShareButtons";
import AdBanner from "@/components/AdBanner";
import SupportBanner from "@/components/SupportBanner";
import EmailCapture from "@/components/EmailCapture";
import ToolViewTracker from "@/components/tools/ToolViewTracker";

interface ToolLayoutProps {
    title: string;
    description: string;
    children: ReactNode;
}

export default function ToolLayout({ title, description, children }: ToolLayoutProps) {
    const toolSlug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    return (
        <div className="py-12 px-6">
            <ToolViewTracker toolSlug={toolSlug} />
            <JsonLd
                type="SoftwareApplication"
                data={{
                    name: title,
                    description: description,
                    applicationCategory: "UtilityApplication",
                    operatingSystem: "Any",
                    offers: {
                        "@type": "Offer",
                        price: "0",
                        priceCurrency: "USD"
                    }
                }}
            />
            <div className="max-w-4xl mx-auto">
                {/* Breadcrumb / Back Link */}
                <Link href="/tools" className="inline-flex items-center gap-2 text-muted hover:text-primary mb-8 transition-colors">
                    ← Back to Tools
                </Link>

                {/* Header */}
                <header className="mb-12">
                    <h1 className="text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light">
                        {title}
                    </h1>
                    <p className="text-xl text-muted">
                        {description}
                    </p>
                </header>

                {/* Tool Container */}
                <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
                    {children}
                </div>

                {/* In-content ad — highest-value placement (user just received value) */}
                <div className="my-6">
                    <AdBanner slot="4817652390" format="rectangle" />
                </div>

                {/* Support / Tip banner */}
                <SupportBanner />

                {/* Email capture */}
                <EmailCapture source={title.toLowerCase().replace(/\s+/g, "-")} />

                {/* Inline share buttons */}
                <div className="mt-6 flex items-center justify-center">
                    <ShareButtons
                        title={`${title} - VedaWell Tools`}
                        text={`I just used the free ${title} tool on VedaWell! Check it out:`}
                    />
                </div>
            </div>
        </div>
    );
}
