/**
 * Competitor comparison data for SEO landing pages.
 * Each entry generates a page at /compare/vedawell-vs-{slug}
 */
export interface Competitor {
    slug: string;
    name: string;
    tagline: string;
    category: string;
    pricing: string;
    limitations: string[];
    vedawellAdvantages: string[];
    relevantTools: string[]; // tool slugs from tool-catalog
}

export const COMPETITORS: Competitor[] = [
    {
        slug: "smallpdf",
        name: "Smallpdf",
        tagline: "PDF tools comparison",
        category: "PDF Tools",
        pricing: "$12/mo for Pro",
        limitations: [
            "Free tier limited to 2 tasks per day",
            "Files uploaded to their servers",
            "Requires account for most features",
            "Watermarks on free exports",
        ],
        vedawellAdvantages: [
            "Unlimited usage — no daily limits",
            "100% browser-based — files never leave your device",
            "No account required",
            "No watermarks on any output",
            "6 PDF tools: merge, split, compress, convert, to image, to word",
        ],
        relevantTools: ["pdf-merge", "pdf-split", "pdf-compress", "pdf-to-image", "pdf-to-word", "image-to-pdf"],
    },
    {
        slug: "tinypng",
        name: "TinyPNG",
        tagline: "Image compression comparison",
        category: "Image Compression",
        pricing: "$25/yr for Pro (500 images/mo free)",
        limitations: [
            "Free tier: 20 images per batch, max 5MB each",
            "Images uploaded to their servers",
            "Only supports PNG and JPEG",
            "No batch download on free tier",
        ],
        vedawellAdvantages: [
            "Unlimited images — no caps or batch limits",
            "100% browser-based — images never uploaded",
            "Supports PNG, JPEG, WebP, and more",
            "Batch compress multiple images at once",
            "Additional tools: resize, crop, filters, watermark, format convert",
        ],
        relevantTools: ["image-compressor", "batch-image-compressor", "image-resizer", "image-cropper", "image-filters", "image-format-converter"],
    },
    {
        slug: "canva",
        name: "Canva",
        tagline: "Design tools comparison",
        category: "Design & Image Tools",
        pricing: "$15/mo for Pro",
        limitations: [
            "Requires account creation",
            "Many features locked behind Pro paywall",
            "Heavy app — slow on older devices",
            "Templates are shared across millions of users",
        ],
        vedawellAdvantages: [
            "No account needed — start instantly",
            "All tools completely free",
            "Lightweight — loads in under 2 seconds",
            "Privacy-first: no data collection or uploads",
            "Specialized tools: color palette, gradient, QR codes, favicons",
        ],
        relevantTools: ["color-palette-generator", "gradient-generator", "qr-code-generator", "favicon-generator", "meme-generator", "social-media-image-resizer"],
    },
    {
        slug: "ilovepdf",
        name: "iLovePDF",
        tagline: "PDF tools comparison",
        category: "PDF Tools",
        pricing: "$7/mo for Premium",
        limitations: [
            "Free: 1 task at a time with ads",
            "Files processed on their servers",
            "10MB file size limit on free tier",
            "Requires download manager for some features",
        ],
        vedawellAdvantages: [
            "No limits on tasks or file size",
            "100% client-side processing — total privacy",
            "No ads on tools (ads only in layout, not in tool UI)",
            "No software downloads needed",
            "Works offline once loaded",
        ],
        relevantTools: ["pdf-merge", "pdf-split", "pdf-compress", "pdf-to-image", "pdf-to-word", "image-to-pdf"],
    },
    {
        slug: "lastpass",
        name: "LastPass",
        tagline: "Password tools comparison",
        category: "Security Tools",
        pricing: "$3/mo for Premium",
        limitations: [
            "Free tier restricted to one device type",
            "Has suffered multiple security breaches",
            "Requires account and browser extension",
            "Password generator tied to vault",
        ],
        vedawellAdvantages: [
            "Generate passwords instantly — no account needed",
            "Uses Web Crypto API (cryptographically secure)",
            "No data stored anywhere — zero breach risk",
            "Works on any device, any browser",
            "Additional security tools: hash generator, UUID generator, Base64 encoder",
        ],
        relevantTools: ["password-generator", "hash-generator", "uuid-generator", "base64-encoder", "string-encoder"],
    },
    {
        slug: "online-convert",
        name: "Online-Convert",
        tagline: "File converter comparison",
        category: "Converters",
        pricing: "$8.49/mo for 100 conversions",
        limitations: [
            "Free: max 3 concurrent conversions",
            "Files uploaded to their servers",
            "100MB file size limit on free",
            "Slow queue during peak hours",
        ],
        vedawellAdvantages: [
            "Unlimited conversions — no queues",
            "Instant results — no waiting",
            "Files stay on your device",
            "No file size limits (limited by your browser memory)",
            "9+ converters: unit, timezone, color, CSV, image format, and more",
        ],
        relevantTools: ["unit-converter", "csv-to-json", "image-format-converter", "color-converter", "number-base-converter", "timezone-converter"],
    },
];
