import Link from "next/link";
import { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import ShareButtons from "@/components/social/ShareButtons";

interface ToolLayoutProps {
    title: string;
    description: string;
    children: ReactNode;
}

export default function ToolLayout({ title, description, children }: ToolLayoutProps) {
    return (
        <div className="py-12 px-6">
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

                <ShareButtons
                    title={`${title} - VedaWell Tools`}
                    text={`I just used the free ${title} tool on VedaWell! Check it out:`}
                />
            </div>
        </div>
    );
}
