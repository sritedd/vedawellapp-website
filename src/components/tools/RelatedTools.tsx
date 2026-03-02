import Link from "next/link";
import { TOOLS } from "@/data/tool-catalog";

interface RelatedToolsProps {
    currentSlug: string;
}

export default function RelatedTools({ currentSlug }: RelatedToolsProps) {
    const current = TOOLS.find(t => t.id === currentSlug);
    if (!current) return null;

    // 3 from same category + 1 from another category
    const sameCategory = TOOLS.filter(
        t => t.category === current.category && t.id !== currentSlug
    );
    const otherCategory = TOOLS.filter(
        t => t.category !== current.category && t.id !== currentSlug
    );

    // Deterministic shuffle based on slug (so it's consistent per page, good for SSR)
    const hash = currentSlug.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const pick = <T,>(arr: T[], count: number): T[] => {
        const shuffled = [...arr].sort((a, b) => {
            const ha = JSON.stringify(a).length + hash;
            const hb = JSON.stringify(b).length + hash;
            return (ha * 31) % 97 - (hb * 31) % 97;
        });
        return shuffled.slice(0, count);
    };

    const related = [
        ...pick(sameCategory, Math.min(3, sameCategory.length)),
        ...pick(otherCategory, Math.min(1, otherCategory.length)),
    ].slice(0, 4);

    if (related.length === 0) return null;

    return (
        <div className="mt-10 pt-8 border-t border-border">
            <h3 className="text-lg font-bold mb-4">You might also like</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {related.map(tool => (
                    <Link
                        key={tool.id}
                        href={tool.href}
                        className={`block p-4 rounded-xl border ${tool.color} bg-card hover:shadow-md transition-all`}
                    >
                        <div className="text-2xl mb-2">{tool.icon}</div>
                        <div className="font-semibold text-sm leading-tight">{tool.title}</div>
                        <div className="text-xs text-muted mt-1 line-clamp-2">{tool.description}</div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
