"use client";

import { useState } from "react";
import { ClipboardCheck, AlertTriangle, FileBarChart, Shield, Camera, Bell } from "lucide-react";

const features = [
    {
        id: "stages",
        label: "Stage Tracking",
        icon: ClipboardCheck,
        title: "Track Every Build Stage",
        description: "From slab pour to handover — never miss a critical inspection. Guardian follows the 7 construction stages defined by Australian building standards and alerts you when action is needed.",
        highlights: ["Pre-Drywall Checklist", "NCC 2025 Compliance", "Certification Gates", "Stage-by-stage progress"],
        color: "from-teal-500 to-teal-700",
    },
    {
        id: "defects",
        label: "Defect Logger",
        icon: Camera,
        title: "Document Everything",
        description: "Timestamped, geotagged photo evidence that holds up at NCAT and Fair Trading. Every defect is catalogued with severity, location, and builder response — building your legal case automatically.",
        highlights: ["Photo + timestamp evidence", "Severity classification", "Builder response tracking", "PDF export for tribunals"],
        color: "from-red-500 to-amber-500",
    },
    {
        id: "alerts",
        label: "Red Flag Alerts",
        icon: AlertTriangle,
        title: "Catch Dodgy Tactics",
        description: "Guardian scans your project data and flags builder behaviours that match known patterns of non-compliance. Material substitutions, skipped inspections, unsigned variations — you'll know immediately.",
        highlights: ["Pattern-matched warnings", "Priority-ranked alerts", "One-click verification", "Auto-navigate to evidence"],
        color: "from-amber-500 to-yellow-500",
    },
    {
        id: "reports",
        label: "Legal Reports",
        icon: FileBarChart,
        title: "Tribunal-Ready Documentation",
        description: "One click generates a comprehensive PDF with all defects, variations, photos, and timeline — formatted for NCAT, Fair Trading, and Building Commission submissions.",
        highlights: ["Professional PDF reports", "Complete evidence chain", "Variation cost tracking", "Certification audit trail"],
        color: "from-teal-600 to-teal-800",
    },
];

export default function ProductShowcase() {
    const [activeTab, setActiveTab] = useState("stages");
    const feature = features.find((f) => f.id === activeTab)!;
    const Icon = feature.icon;

    return (
        <section className="py-20 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                        <Shield className="w-4 h-4" />
                        How Guardian Protects You
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
                        Your digital watchdog for every build stage
                    </h2>
                    <p className="text-muted text-lg max-w-2xl mx-auto">
                        Guardian doesn&apos;t just track — it actively monitors your build for risks, flags issues, and builds your legal evidence automatically.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap justify-center gap-2 mb-10">
                    {features.map((f) => {
                        const TabIcon = f.icon;
                        return (
                            <button
                                key={f.id}
                                onClick={() => setActiveTab(f.id)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === f.id
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "bg-card border border-border text-muted hover:text-foreground hover:border-primary/30"
                                    }`}
                            >
                                <TabIcon className="w-4 h-4" />
                                {f.label}
                            </button>
                        );
                    })}
                </div>

                {/* Feature showcase card */}
                <div className="card border-primary/20 overflow-hidden">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        {/* Left: Info */}
                        <div className="space-y-6">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}>
                                <Icon className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold">{feature.title}</h3>
                            <p className="text-muted leading-relaxed">{feature.description}</p>
                            <ul className="space-y-3">
                                {feature.highlights.map((h, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                                            <Bell className="w-3 h-3 text-success" />
                                        </div>
                                        <span className="text-sm font-medium">{h}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Right: Visual mock */}
                        <div className={`bg-gradient-to-br ${feature.color} rounded-2xl p-8 min-h-[320px] flex items-center justify-center relative overflow-hidden`}>
                            <div className="absolute inset-0 bg-black/20" />
                            <div className="relative z-10 bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900">{feature.title}</div>
                                        <div className="text-xs text-slate-500">HomeOwner Guardian</div>
                                    </div>
                                </div>
                                {/* Mock UI elements */}
                                <div className="space-y-2">
                                    {feature.highlights.map((h, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2.5">
                                            <div className={`w-2 h-2 rounded-full ${i === 0 ? "bg-green-500" : i === 1 ? "bg-amber-500" : "bg-slate-300"}`} />
                                            <span className="text-xs text-slate-700 font-medium">{h}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
