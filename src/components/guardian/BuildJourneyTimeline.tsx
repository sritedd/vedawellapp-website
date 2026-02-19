"use client";

import { useState } from "react";

interface JourneyStage {
    id: string;
    phase: "pre-build" | "construction" | "post-handover";
    name: string;
    description: string;
    whatToCheck: string[];
    dodgyBuilderWarnings: string[];
    yourRights: string[];
    documentsNeeded: string[];
}

const JOURNEY_STAGES: JourneyStage[] = [
    // PRE-BUILD
    {
        id: "contract",
        phase: "pre-build",
        name: "Contract Signing",
        description: "The legally binding agreement between you and the builder.",
        whatToCheck: [
            "Total price including GST",
            "Start and completion dates",
            "All PC (Prime Cost) and PS (Provisional Sum) items listed",
            "Builder's license number and HBCF insurance policy number",
            "Defects liability period (usually 2 years for minor, 6 years for structural)",
        ],
        dodgyBuilderWarnings: [
            "🚨 'Site costs not included' — This could add $20,000+",
            "🚨 'Engineering subject to soil test' — Get the test BEFORE signing",
            "🚨 Verbal promises not in writing — If it's not in the contract, it doesn't exist",
            "🚨 Pressure to sign quickly — Good builders don't rush you",
        ],
        yourRights: [
            "5 business days cooling-off period (NSW)",
            "Right to independent legal review before signing",
            "Builder MUST have valid HBCF insurance before work starts",
        ],
        documentsNeeded: ["Signed contract", "HBCF Certificate of Insurance", "Builder's license printout"],
    },
    {
        id: "site-report",
        phase: "pre-build",
        name: "Soil Test & Site Report",
        description: "Understanding your block's conditions to avoid surprise costs.",
        whatToCheck: [
            "Soil classification (A, S, M, H, E) — affects foundation design",
            "Rock presence — can add $10,000+ for excavation",
            "Contour survey — affects retaining walls and drainage",
        ],
        dodgyBuilderWarnings: [
            "🚨 Builder doing soil test AFTER contract signed — You lose negotiating power",
            "🚨 'We'll handle it' without itemized costs — Get it in writing",
        ],
        yourRights: [
            "Right to commission your own independent soil test",
            "Variations for site conditions must be approved in writing",
        ],
        documentsNeeded: ["Soil test report", "Contour survey", "Site classification certificate"],
    },
    // CONSTRUCTION
    {
        id: "slab",
        phase: "construction",
        name: "Slab / Footings Stage",
        description: "The foundation of your home — literally. Once poured, defects are hidden.",
        whatToCheck: [
            "Steel reinforcement matches engineering plans",
            "Plumbing rough-in is correct (toilet, drain positions)",
            "Termite barrier installed correctly",
            "Inspection MUST happen BEFORE concrete pour",
        ],
        dodgyBuilderWarnings: [
            "🚨 'We'll pour Monday' but no inspection booked — STOP THEM",
            "🚨 Slab poured on weekend to avoid inspection",
            "🚨 Insufficient steel reinforcement (cost cutting)",
        ],
        yourRights: [
            "Right to attend the pre-pour inspection",
            "Builder must notify you before critical inspections",
            "Do NOT pay slab stage until inspection passed",
        ],
        documentsNeeded: ["Slab inspection certificate", "Plumbing rough-in certificate"],
    },
    {
        id: "frame",
        phase: "construction",
        name: "Frame Stage",
        description: "The skeleton of your home. Check before walls go up.",
        whatToCheck: [
            "Frame tie-downs and bracing installed",
            "Window and door openings match plans",
            "Electrical and plumbing rough-in positions correct",
            "No damaged or warped timber",
        ],
        dodgyBuilderWarnings: [
            "🚨 'Slightly different to plan' — Every change should be documented",
            "🚨 Rushing to close walls before inspection",
        ],
        yourRights: [
            "Right to access site with 24 hours notice",
            "Frame inspection is MANDATORY before cladding",
        ],
        documentsNeeded: ["Frame inspection certificate", "Truss engineering certificate"],
    },
    {
        id: "pre-plaster",
        phase: "construction",
        name: "Pre-Plasterboard (CRITICAL)",
        description: "Your LAST chance to see inside the walls. After this, everything is hidden.",
        whatToCheck: [
            "✅ Ceiling insulation batts installed (check R-value)",
            "✅ Wall insulation installed (if applicable)",
            "✅ Sarking/reflective foil under roof",
            "✅ All electrical cables in walls (blue cables visible)",
            "✅ All plumbing pipes capped and pressure tested",
            "✅ HVAC ducting installed",
            "✅ Window flashings correctly installed",
            "✅ Fire collars at penetrations",
            "✅ Waterproofing membrane in wet areas",
        ],
        dodgyBuilderWarnings: [
            "🚨🚨 MISSING CEILING BATTS — #1 most common defect!",
            "🚨 'We'll do insulation after plaster' — NO! It must be now",
            "🚨 Rushing to close walls = hiding defects",
            "🚨 No moisture barrier in bathrooms",
        ],
        yourRights: [
            "RIGHT TO REFUSE PROGRESS PAYMENT until photos taken",
            "Right to independent building inspector for pre-plaster check",
            "This is the most important stage to document",
        ],
        documentsNeeded: [
            "Pre-plaster inspection report",
            "EICC (Electrical rough-in)",
            "Plumbing rough-in certificate",
            "YOUR OWN PHOTOS of every room showing insulation",
        ],
    },
    {
        id: "lockup",
        phase: "construction",
        name: "Lockup / Enclosed Stage",
        description: "House is weather-tight with roof, windows, and external doors.",
        whatToCheck: [
            "All windows and doors installed and lockable",
            "Roof complete with no visible gaps",
            "External cladding complete",
            "Garage door operating",
        ],
        dodgyBuilderWarnings: [
            "🚨 Demanding lockup payment without EICC certificate",
            "🚨 Windows not properly sealed — check for gaps",
        ],
        yourRights: [
            "Can withhold payment if mandatory certificates not provided",
        ],
        documentsNeeded: ["Lockup inspection", "EICC (Electrical final)", "Waterproofing certificate"],
    },
    // POST-HANDOVER
    {
        id: "pci",
        phase: "post-handover",
        name: "Practical Completion Inspection (PCI)",
        description: "The formal handover walkthrough. Document EVERYTHING.",
        whatToCheck: [
            "Every door, window, tap, and light switch",
            "Paint finish, tiles, joints",
            "Appliances working",
            "No visible damage or defects",
        ],
        dodgyBuilderWarnings: [
            "🚨 'Just sign and we'll fix later' — NEVER sign with outstanding defects",
            "🚨 Refusing to let you take photos",
            "🚨 Giving you keys before you've signed off",
        ],
        yourRights: [
            "Right to bring an independent inspector",
            "Right to document all defects before signing",
            "Right to withhold 5% of contract for defect rectification",
        ],
        documentsNeeded: [
            "Occupation Certificate (OC)",
            "All final certificates (EICC, Gas, Smoke Alarm)",
            "Defect list signed by builder",
            "Warranty documents for appliances",
        ],
    },
    {
        id: "warranty",
        phase: "post-handover",
        name: "Warranty Period",
        description: "2 years for minor defects, 6 years for structural.",
        whatToCheck: [
            "Log ALL defects as they appear",
            "Take dated photos of any issues",
            "Report defects in writing (not just phone/text)",
        ],
        dodgyBuilderWarnings: [
            "🚨 'That's normal settling' — Cracks wider than 2mm are NOT normal",
            "🚨 Ignoring your defect reports — escalate to Fair Trading",
            "🚨 Builder becomes uncontactable — lodge HBCF claim",
        ],
        yourRights: [
            "2-year warranty for minor defects (cosmetic, waterproofing)",
            "6-year warranty for major structural defects",
            "HBCF insurance covers you if builder disappears or goes bankrupt",
        ],
        documentsNeeded: ["Defect reports with dates", "Builder response records", "HBCF claim form (if needed)"],
    },
];

export default function BuildJourneyTimeline() {
    const [expandedStage, setExpandedStage] = useState<string | null>("pre-plaster");
    const [activePhase, setActivePhase] = useState<"all" | "pre-build" | "construction" | "post-handover">("all");

    const filteredStages = JOURNEY_STAGES.filter(
        (s) => activePhase === "all" || s.phase === activePhase
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Your Build Journey</h2>
                    <p className="text-muted-foreground">
                        Everything you need to know at each stage of construction.
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {[
                        { key: "all", label: "All Stages" },
                        { key: "pre-build", label: "Pre-Build" },
                        { key: "construction", label: "Construction" },
                        { key: "post-handover", label: "Post-Handover" },
                    ].map((phase) => (
                        <button
                            key={phase.key}
                            onClick={() => setActivePhase(phase.key as any)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${activePhase === phase.key
                                    ? "bg-primary text-white"
                                    : "bg-muted/20 hover:bg-muted/40"
                                }`}
                        >
                            {phase.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {filteredStages.map((stage, idx) => {
                    const isExpanded = expandedStage === stage.id;
                    return (
                        <div
                            key={stage.id}
                            className="rounded-xl border border-border overflow-hidden bg-card"
                        >
                            <button
                                onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                                className="w-full p-5 flex items-center gap-4 hover:bg-muted/5 transition-colors text-left"
                            >
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${stage.phase === "pre-build"
                                            ? "bg-blue-500/10 text-blue-600"
                                            : stage.phase === "construction"
                                                ? "bg-amber-500/10 text-amber-600"
                                                : "bg-green-500/10 text-green-600"
                                        }`}
                                >
                                    {idx + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-lg">{stage.name}</h3>
                                        {stage.id === "pre-plaster" && (
                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">
                                                CRITICAL
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{stage.description}</p>
                                </div>
                                <span className="text-muted-foreground">{isExpanded ? "▲" : "▼"}</span>
                            </button>

                            {isExpanded && (
                                <div className="border-t border-border p-5 bg-muted/5 space-y-6">
                                    {/* What to Check */}
                                    <div>
                                        <h4 className="font-bold text-green-700 mb-2 flex items-center gap-2">
                                            ✅ What to Check
                                        </h4>
                                        <ul className="space-y-1 text-sm">
                                            {stage.whatToCheck.map((item, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <span className="text-green-600">•</span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Dodgy Builder Warnings */}
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <h4 className="font-bold text-red-700 mb-2">⚠️ Dodgy Builder Warning Signs</h4>
                                        <ul className="space-y-1 text-sm text-red-800">
                                            {stage.dodgyBuilderWarnings.map((item, i) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Your Rights */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h4 className="font-bold text-blue-700 mb-2">⚖️ Your Rights</h4>
                                        <ul className="space-y-1 text-sm text-blue-800">
                                            {stage.yourRights.map((item, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <span>→</span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Documents Needed */}
                                    <div>
                                        <h4 className="font-bold text-muted-foreground mb-2">📄 Documents to Request</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {stage.documentsNeeded.map((doc, i) => (
                                                <span
                                                    key={i}
                                                    className="px-3 py-1 bg-muted/30 rounded-full text-sm"
                                                >
                                                    {doc}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
