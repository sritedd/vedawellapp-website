"use client";

import { useState } from "react";
import Link from "next/link";
import { TOOLS, CATEGORIES, type ToolCategory } from "@/data/tool-catalog";

export default function ToolsPage() {
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState<ToolCategory>('all');

    const filteredTools = TOOLS.filter(tool => {
        const matchesSearch = search === "" ||
            tool.title.toLowerCase().includes(search.toLowerCase()) ||
            tool.description.toLowerCase().includes(search.toLowerCase()) ||
            tool.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
        const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const categoryCount = (cat: ToolCategory) =>
        cat === 'all' ? TOOLS.length : TOOLS.filter(t => t.category === cat).length;

    return (
        <div className="py-12 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Hero Mini */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold mb-4">
                        🧰 All <span className="text-primary">Free Tools</span>
                    </h1>
                    <p className="text-lg text-muted max-w-2xl mx-auto">
                        {TOOLS.length}+ free, browser-based tools to boost your productivity. No sign-ups, no downloads — everything runs locally.
                    </p>
                </div>

                {/* Search */}
                <div className="max-w-2xl mx-auto mb-8">
                    <input
                        type="text"
                        placeholder="Search tools by name, description, or tag..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-6 py-4 rounded-xl border border-border bg-card shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-lg"
                    />
                </div>

                {/* Categories */}
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.value}
                            onClick={() => setActiveCategory(cat.value)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === cat.value ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'
                                }`}
                        >
                            {cat.icon} {cat.label} <span className="ml-1 opacity-70">{categoryCount(cat.value)}</span>
                        </button>
                    ))}
                </div>

                <p className="text-center text-muted mb-12">
                    {filteredTools.length} tools found
                </p>

                {/* Tools Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTools.map((tool) => (
                        <Link
                            key={tool.id}
                            href={tool.href}
                            className={`group block bg-card rounded-xl p-6 border transition-all hover:bg-muted/5 hover:scale-[1.02] hover:shadow-lg ${tool.color}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-4xl">{tool.icon}</span>
                                <span className="text-muted group-hover:text-primary transition-colors">→</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                                {tool.title}
                            </h3>
                            <p className="text-muted text-sm mb-4">
                                {tool.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {tool.tags.map(tag => (
                                    <span key={tag} className="px-2 py-1 rounded bg-muted text-xs text-muted-foreground uppercase tracking-wider">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </Link>
                    ))}
                </div>

                {filteredTools.length === 0 && (
                    <div className="text-center py-16">
                        <span className="text-5xl block mb-4">🔍</span>
                        <p className="text-muted text-lg">No tools match your search. Try a different term.</p>
                    </div>
                )}

            </div>
        </div>
    );
}
