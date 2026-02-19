"use client";

import { useState } from "react";
import glossaryData from "@/data/construction-glossary.json";

export default function ConstructionGlossary() {
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const filteredTerms = glossaryData.terms.filter((term) => {
        const matchesSearch =
            search === "" ||
            term.term.toLowerCase().includes(search.toLowerCase()) ||
            term.definition.toLowerCase().includes(search.toLowerCase());

        const matchesCategory =
            selectedCategory === null || term.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">📚 Construction Glossary</h2>
                <p className="text-muted-foreground">
                    Understand building terminology used by your builder.
                </p>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search terms..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === null
                                ? "bg-primary text-white"
                                : "bg-muted/20 hover:bg-muted/40"
                            }`}
                    >
                        All
                    </button>
                    {glossaryData.categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === cat.id
                                    ? "bg-primary text-white"
                                    : "bg-muted/20 hover:bg-muted/40"
                                }`}
                        >
                            {cat.icon} {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results count */}
            <p className="text-sm text-muted-foreground">
                Showing {filteredTerms.length} of {glossaryData.terms.length} terms
            </p>

            {/* Terms Grid */}
            <div className="grid md:grid-cols-2 gap-4">
                {filteredTerms.map((term) => {
                    const category = glossaryData.categories.find(
                        (c) => c.id === term.category
                    );
                    return (
                        <div
                            key={term.term}
                            className="p-4 bg-card border border-border rounded-xl"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="font-bold text-lg">{term.term}</h3>
                                {category && (
                                    <span className="text-xs px-2 py-1 bg-muted/20 rounded">
                                        {category.icon} {category.name}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">{term.definition}</p>
                        </div>
                    );
                })}
            </div>

            {filteredTerms.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No terms found matching "{search}"
                </div>
            )}
        </div>
    );
}
