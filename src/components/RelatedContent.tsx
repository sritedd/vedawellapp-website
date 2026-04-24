import Link from "next/link";

interface RelatedItem {
    href: string;
    title: string;
    description: string;
    icon: string;
}

const TOOL_LINKS: Record<string, RelatedItem[]> = {
    "pdf-merge": [
        { href: "/tools/pdf-split", title: "PDF Split", description: "Extract pages from PDFs", icon: "✂️" },
        { href: "/tools/pdf-compress", title: "PDF Compress", description: "Reduce PDF file size", icon: "📦" },
        { href: "/tools/pdf-to-word", title: "PDF to Word", description: "Convert PDF to editable docs", icon: "📝" },
        { href: "/blog/free-pdf-tools-online", title: "Best Free PDF Tools Guide", description: "Compare all PDF tools", icon: "📖" },
    ],
    "pdf-split": [
        { href: "/tools/pdf-merge", title: "PDF Merge", description: "Combine multiple PDFs", icon: "📎" },
        { href: "/tools/pdf-compress", title: "PDF Compress", description: "Reduce PDF file size", icon: "📦" },
        { href: "/tools/pdf-to-image", title: "PDF to Image", description: "Convert pages to PNG", icon: "🖼️" },
    ],
    "pdf-compress": [
        { href: "/tools/pdf-merge", title: "PDF Merge", description: "Combine multiple PDFs", icon: "📎" },
        { href: "/tools/image-compressor", title: "Image Compressor", description: "Compress images too", icon: "🖼️" },
    ],
    "pdf-to-word": [
        { href: "/tools/pdf-merge", title: "PDF Merge", description: "Combine PDFs first", icon: "📎" },
        { href: "/tools/pdf-split", title: "PDF Split", description: "Extract specific pages", icon: "✂️" },
    ],
    "json-formatter": [
        { href: "/tools/regex-tester", title: "Regex Tester", description: "Build & test regular expressions", icon: "🔍" },
        { href: "/tools/string-encoder", title: "String Encoder", description: "Base64, URL encode & more", icon: "🔐" },
        { href: "/blog/json-formatter-guide", title: "JSON Formatting Guide", description: "Common errors & fixes", icon: "📖" },
    ],
    "password-generator": [
        { href: "/tools/string-encoder", title: "String Encoder", description: "Encode & decode strings", icon: "🔐" },
        { href: "/tools/uuid-generator", title: "UUID Generator", description: "Generate unique IDs", icon: "🆔" },
        { href: "/blog/password-security-guide", title: "Password Security Guide", description: "Best practices for 2026", icon: "📖" },
    ],
    "image-compressor": [
        { href: "/tools/social-media-image-resizer", title: "Social Media Resizer", description: "Resize for all platforms", icon: "📐" },
        { href: "/tools/pdf-to-image", title: "PDF to Image", description: "Convert PDF pages to images", icon: "📄" },
        { href: "/blog/image-compression-guide", title: "Image Compression Guide", description: "Optimize without quality loss", icon: "📖" },
    ],
    "qr-code-generator": [
        { href: "/tools/url-encoder", title: "URL Encoder", description: "Encode URLs for QR codes", icon: "🔗" },
        { href: "/blog/qr-code-uses-business", title: "10 QR Code Business Uses", description: "Creative marketing ideas", icon: "📖" },
    ],
    "meta-tag-generator": [
        { href: "/tools/open-graph-generator", title: "Open Graph Generator", description: "Social media preview tags", icon: "🌐" },
        { href: "/tools/schema-markup-generator", title: "Schema Markup", description: "JSON-LD structured data", icon: "📊" },
        { href: "/tools/serp-preview", title: "SERP Preview", description: "Preview Google appearance", icon: "🔍" },
        { href: "/blog/seo-meta-tags-guide", title: "SEO Meta Tags Guide", description: "Complete optimization guide", icon: "📖" },
    ],
    "pomodoro-timer": [
        { href: "/tools/stopwatch-timer", title: "Stopwatch Timer", description: "General purpose timer", icon: "⏱️" },
        { href: "/tools/todo-list", title: "Todo List", description: "Track your tasks", icon: "✅" },
        { href: "/blog/pomodoro-technique-productivity", title: "Pomodoro Technique Guide", description: "Boost productivity 10x", icon: "📖" },
    ],
    "regex-tester": [
        { href: "/tools/json-formatter", title: "JSON Formatter", description: "Format & validate JSON", icon: "📋" },
        { href: "/tools/string-encoder", title: "String Encoder", description: "Encode & decode strings", icon: "🔐" },
        { href: "/blog/regex-cheat-sheet", title: "Regex Cheat Sheet", description: "Patterns & examples", icon: "📖" },
    ],
};

export function RelatedContent({ toolSlug }: { toolSlug: string }) {
    const related = TOOL_LINKS[toolSlug];
    if (!related || related.length === 0) return null;

    return (
        <div className="mt-8 p-6 bg-gray-50 rounded-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Related Tools & Guides</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {related.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-start gap-3 p-3 bg-white rounded-xl hover:shadow-md transition-shadow group"
                    >
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                            <span className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">
                                {item.title}
                            </span>
                            <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
