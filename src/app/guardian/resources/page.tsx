"use client";

import { useState } from "react";

// Import all the new components
import ConstructionGlossary from "@/components/guardian/ConstructionGlossary";
import ContractReviewChecklist from "@/components/guardian/ContractReviewChecklist";
import PreHandoverChecklist from "@/components/guardian/PreHandoverChecklist";
import QuestionBank from "@/components/guardian/QuestionBank";
import MessageTemplates from "@/components/guardian/MessageTemplates";
import WarrantyCalculator from "@/components/guardian/WarrantyCalculator";

const RESOURCES = [
    { id: "glossary", label: "Construction Glossary", icon: "📚", description: "50+ building terms explained" },
    { id: "contract", label: "Contract Review Checklist", icon: "📝", description: "Check before signing" },
    { id: "handover", label: "Pre-Handover Checklist", icon: "🔍", description: "100+ point inspection" },
    { id: "questions", label: "Question Bank", icon: "❓", description: "What to ask your builder" },
    { id: "messages", label: "Message Templates", icon: "📧", description: "Professional communications" },
    { id: "warranty", label: "Warranty Calculator", icon: "📅", description: "Track warranty expiry" },
];

export default function ResourcesPage() {
    const [activeResource, setActiveResource] = useState("glossary");

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <nav className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <a href="/" className="flex items-center gap-2 text-xl font-bold">
                        <span>🛠️</span>
                        <span>VedaWell Tools</span>
                    </a>
                    <div className="flex items-center gap-6">
                        <a href="/guardian/journey" className="text-muted hover:text-foreground">
                            📚 Learn
                        </a>
                        <a href="/guardian/dashboard" className="text-muted hover:text-foreground">
                            ← Dashboard
                        </a>
                    </div>
                </div>
            </nav>

            <main className="py-8 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">📖 Resource Center</h1>
                        <p className="text-muted-foreground">
                            Tools, templates, and checklists to protect your home build.
                        </p>
                    </div>

                    {/* Resource Navigation */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
                        {RESOURCES.map((resource) => (
                            <button
                                key={resource.id}
                                onClick={() => setActiveResource(resource.id)}
                                className={`p-4 rounded-xl border text-left transition-all ${activeResource === resource.id
                                        ? "bg-primary/10 border-primary shadow-sm"
                                        : "bg-card border-border hover:border-primary/30"
                                    }`}
                            >
                                <span className="text-2xl">{resource.icon}</span>
                                <div className="font-medium mt-2 text-sm">{resource.label}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {resource.description}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Active Resource Content */}
                    <div className="bg-card border border-border rounded-2xl p-6">
                        {activeResource === "glossary" && <ConstructionGlossary />}
                        {activeResource === "contract" && <ContractReviewChecklist />}
                        {activeResource === "handover" && <PreHandoverChecklist />}
                        {activeResource === "questions" && <QuestionBank />}
                        {activeResource === "messages" && <MessageTemplates />}
                        {activeResource === "warranty" && <WarrantyCalculator />}
                    </div>
                </div>
            </main>
        </div>
    );
}
