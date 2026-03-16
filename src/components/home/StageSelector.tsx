"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Shield, ChevronRight } from "lucide-react";

const stages = [
    {
        id: "pre-site",
        label: "Pre-Site",
        icon: "📋",
        risks: [
            "Contract loopholes that let builders charge 30% more",
            "Missing soil test = cracked slab ($25K+ to fix)",
            "Unsigned variation clauses = no legal protection",
        ],
        tip: "Guardian locks in every contract detail before the first shovel hits dirt.",
    },
    {
        id: "slab",
        label: "Slab & Foundation",
        icon: "🏗️",
        risks: [
            "Wrong concrete mix = structural failure in 5-10 years",
            "Missing waterproof membrane = rising damp ($20K+)",
            "Steel reinforcement shortcuts = slab cracking",
        ],
        tip: "Guardian's slab inspection checklist catches what you can't see.",
    },
    {
        id: "frame",
        label: "Frame & Lockup",
        icon: "🔨",
        risks: [
            "Non-compliant timber framing = insurance void",
            "Missing bracing = wall movement in high winds",
            "Window/door rough openings wrong = costly reframing",
        ],
        tip: "Guardian tracks every frame stage against NCC 2025 requirements.",
    },
    {
        id: "pre-plaster",
        label: "Pre-Plasterboard",
        icon: "🔍",
        risks: [
            "Missing insulation batts (hidden behind walls forever)",
            "Electrical wiring not to standard = fire risk",
            "Plumbing leaks sealed behind drywall = mould",
        ],
        tip: "This is your LAST CHANCE to inspect. Guardian ensures nothing gets sealed without photo proof.",
    },
    {
        id: "fixing",
        label: "Fixing & Fitout",
        icon: "🪛",
        risks: [
            "Cheap material substitutions (you paid for premium)",
            "Tiling defects hidden by furniture placement",
            "Cabinetry not matching specs = silent downgrade",
        ],
        tip: "Guardian's material registry tracks what was quoted vs. what was installed.",
    },
    {
        id: "handover",
        label: "Handover",
        icon: "🔑",
        risks: [
            "Missing compliance certificates = can't get occupancy",
            "Undocumented defects = no warranty claims after 90 days",
            "Builder disappears without fixing final snags",
        ],
        tip: "Guardian generates tribunal-ready defect reports with timestamped evidence.",
    },
];

export default function StageSelector() {
    const [selected, setSelected] = useState<string | null>(null);
    const stage = stages.find((s) => s.id === selected);

    return (
        <div className="max-w-4xl mx-auto">
            <h3 className="text-center text-lg font-semibold text-slate-300 mb-6">
                Where is your build right now?
            </h3>

            {/* Stage buttons */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
                {stages.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => setSelected(s.id === selected ? null : s.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selected === s.id
                            ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105"
                            : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
                            }`}
                    >
                        <span>{s.icon}</span>
                        <span className="hidden sm:inline">{s.label}</span>
                    </button>
                ))}
            </div>

            {/* Expanded risk card */}
            {stage && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 animate-fade-in">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                        <h4 className="text-lg font-bold text-white">
                            Risks at {stage.label} stage
                        </h4>
                    </div>

                    <ul className="space-y-3 mb-6">
                        {stage.risks.map((risk, i) => (
                            <li key={i} className="flex items-start gap-3 text-slate-300">
                                <span className="text-red-400 mt-0.5 shrink-0">✕</span>
                                <span>{risk}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-start gap-3">
                        <Shield className="w-5 h-5 text-primary-light mt-0.5 shrink-0" />
                        <div>
                            <p className="text-primary-light font-medium">{stage.tip}</p>
                            <Link
                                href="/guardian/login?view=sign-up"
                                className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-white bg-primary px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                            >
                                Start Protecting Now <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {!selected && (
                <p className="text-center text-slate-500 text-sm">
                    Click a stage to see what your builder might be cutting corners on
                </p>
            )}
        </div>
    );
}
