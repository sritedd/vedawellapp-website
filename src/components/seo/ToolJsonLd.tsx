import { TOOLS } from "@/data/tool-catalog";

interface ToolJsonLdProps {
    slug: string;
}

export default function ToolJsonLd({ slug }: ToolJsonLdProps) {
    const tool = TOOLS.find(t => t.id === slug);
    if (!tool) return null;

    const schema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: tool.title,
        description: tool.description,
        url: `https://vedawellapp.com/tools/${slug}`,
        applicationCategory: "UtilityApplication",
        operatingSystem: "Any",
        offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
        },
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
