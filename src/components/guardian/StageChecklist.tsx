"use client";

import { useState } from "react";

export interface StageData {
    id: string;
    name: string;
    status: "completed" | "current" | "upcoming";
    description: string;
    typicalDuration: string;
    mustBeDoneBefore: string[];  // Things that MUST happen before leaving this stage
    shouldAlreadyBeDone: string[]; // Things that should already be complete from previous stages
    commonMistakes: string[];    // Common homeowner complaints / forum issues
    whatHappens: string[];
    checklistItems: ChecklistItem[];
    hiddenWorkWarnings: string[];
    photosRequired: string[];
    certificatesRequired: string[];
}

export interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
    critical: boolean;
    helpText?: string;
}

// Complete stage data for Australian home building
export const CONSTRUCTION_STAGES: StageData[] = [
    {
        id: "site-start",
        name: "Site Start",
        status: "completed",
        description: "Ground preparation and service connections",
        typicalDuration: "1-2 weeks",
        mustBeDoneBefore: [
            "🚰 Stormwater drainage connected and tested",
            "⚡ Electrical conduit to meter box location",
            "💧 Water and sewer connections complete",
            "📐 Site survey and setout pegs in place",
        ],
        shouldAlreadyBeDone: [
            "Council DA/CDC approval",
            "BASIX certificate",
            "Home warranty insurance",
        ],
        commonMistakes: [
            "❌ Stormwater not connected - causes flooding during construction",
            "❌ Site drainage wrong - water pools under future slab",
            "❌ Setout wrong by 100mm - discovered at frame stage",
        ],
        whatHappens: [
            "Site clearing and leveling",
            "Temporary fencing installed",
            "Underground services located and marked (Dial Before You Dig)",
            "Excavation for foundations",
            "Service connections (water, sewer, electrical conduit)",
            "STORMWATER DRAINAGE installed and connected",
        ],
        checklistItems: [
            { id: "ss-1", text: "Site plans match contract", completed: true, critical: true },
            { id: "ss-2", text: "Service locations marked (Dial Before You Dig)", completed: true, critical: true },
            { id: "ss-3", text: "STORMWATER connected to legal discharge point", completed: true, critical: true, helpText: "MUST be done NOW - not Lockup or Fixing! Check council plans." },
            { id: "ss-4", text: "Erosion/sediment control in place", completed: true, critical: false },
            { id: "ss-5", text: "Temporary fencing secure", completed: true, critical: false },
            { id: "ss-6", text: "Site levels checked against survey", completed: true, critical: true },
            { id: "ss-7", text: "Retaining walls done (if required)", completed: true, critical: true, helpText: "Must be complete before slab pour" },
        ],
        hiddenWorkWarnings: [
            "🚰 STORMWATER PIPES - buried and hidden forever! Verify NOW.",
            "Underground services (plumbing, electrical conduits) - once backfilled, access is difficult",
            "Site drainage grades - must be correct before slab or water will pool",
        ],
        photosRequired: [
            "Stormwater pipes BEFORE backfill (showing fall direction)",
            "Service trenches BEFORE backfill",
            "Site clearing complete",
            "All service connection points",
            "Setout pegs with string lines",
        ],
        certificatesRequired: [
            "Dial Before You Dig confirmation",
            "Council sewer/stormwater connection approval (s68)",
        ],
    },
    {
        id: "slab",
        name: "Slab Down (Base)",
        status: "completed",
        description: "Foundation and underground plumbing",
        typicalDuration: "2-3 weeks (including curing)",
        mustBeDoneBefore: [
            "🚽 All under-slab plumbing positioned and photographed",
            "🔩 Reinforcement mesh/rebar inspected by engineer",
            "📏 Slab dimensions verified against plans",
            "💧 Termite barrier installed (if required)",
        ],
        shouldAlreadyBeDone: [
            "✅ Stormwater connected (Site Start)",
            "✅ Retaining walls complete (if any)",
            "✅ Site levels/drainage correct",
        ],
        commonMistakes: [
            "❌ Toilet waste in wrong position - costly to jackhammer later",
            "❌ No photos of reinforcement - can't prove it's there",
            "❌ Slab poured without engineer inspection",
            "❌ Kitchen sink waste not in right spot - affects cabinet layout",
        ],
        whatHappens: [
            "Formwork for slab edges",
            "Plumbing rough-in UNDER slab (toilets, drains, showers)",
            "Termite barrier/mesh installed",
            "Steel reinforcement mesh laid",
            "Engineer inspection of reinforcement",
            "Concrete pour and curing (7+ days)",
            "Slab waterproofing membrane",
        ],
        checklistItems: [
            { id: "sl-1", text: "Slab dimensions match approved plans", completed: true, critical: true },
            { id: "sl-2", text: "Reinforcement visible before pour (mesh/rebar)", completed: true, critical: true, helpText: "Take photos of ALL reinforcement before concrete is poured" },
            { id: "sl-3", text: "Plumbing correctly positioned to plans", completed: true, critical: true, helpText: "This CANNOT be changed after pour! Verify toilet and shower waste locations." },
            { id: "sl-4", text: "Edge beams correct depth", completed: true, critical: true },
            { id: "sl-5", text: "Termite protection in place", completed: true, critical: true, helpText: "Physical barrier or chemical - check certificate" },
            { id: "sl-6", text: "Engineer has inspected before pour", completed: true, critical: true },
            { id: "sl-7", text: "Slab level checked after pour", completed: false, critical: false },
        ],
        hiddenWorkWarnings: [
            "⚠️ ALL PLUMBING UNDER SLAB - Once poured, NO ACCESS without jackhammering!",
            "⚠️ Termite barrier - hidden under slab forever",
            "Reinforcement - completely hidden after pour",
            "Slab membrane - covered by concrete",
        ],
        photosRequired: [
            "Reinforcement mesh BEFORE pour (every room)",
            "Plumbing locations under slab with measurements",
            "Toilet waste positions",
            "Slab edge thickness",
            "Formwork in place",
            "Termite barrier before pour",
        ],
        certificatesRequired: [
            "Engineer's slab inspection certificate",
            "Plumber's under-slab rough-in certificate",
            "Termite management certificate",
        ],
    },
    {
        id: "frame",
        name: "Frame Stage",
        status: "current",
        description: "Structural frame and roof trusses",
        typicalDuration: "2-4 weeks",
        mustBeDoneBefore: [
            "🏗️ Frame inspection by certifier (MANDATORY)",
            "🔩 All bracing and tie-downs installed",
            "📐 Window/door openings verified to specs",
            "📸 Photos of ALL structural connections",
        ],
        shouldAlreadyBeDone: [
            "✅ Slab cured and inspected",
            "✅ Stormwater connected",
            "✅ Under-slab plumbing complete",
        ],
        commonMistakes: [
            "❌ Window opening wrong size - discovered when windows arrive",
            "❌ Frame not plumb - causes issues with doors/windows later",
            "❌ Missing bracing - fails frame inspection",
            "❌ No photos of tie-downs - can't prove they exist later",
        ],
        whatHappens: [
            "Wall frames erected (timber or steel)",
            "Roof trusses installed",
            "Bracing and tie-downs fitted per engineer specs",
            "Window and door openings framed",
            "Frame inspection by certifier (MANDATORY before cladding)",
        ],
        checklistItems: [
            { id: "fr-1", text: "Frame straight and plumb (use spirit level)", completed: false, critical: true },
            { id: "fr-2", text: "Window and door openings correct size", completed: false, critical: true, helpText: "Measure and compare to contract specifications - wrong sizes are costly later" },
            { id: "fr-3", text: "All bracing installed per engineer's specs", completed: false, critical: true },
            { id: "fr-4", text: "Roof truss tie-downs in place", completed: false, critical: true, helpText: "Critical for cyclone/storm resistance. Photo every connection." },
            { id: "fr-5", text: "No twisted or damaged timber", completed: false, critical: false },
            { id: "fr-6", text: "Frame inspection PASSED", completed: false, critical: true, helpText: "No cladding until this passes!" },
        ],
        hiddenWorkWarnings: [
            "🔩 Frame connections - covered by cladding and plasterboard",
            "📏 Bracing straps - hidden inside wall cavities",
            "⚓ Tie-down connections - covered during roofing",
        ],
        photosRequired: [
            "All bracing locations (strap bracing + nogging)",
            "Tie-down connections at slab level",
            "Every window/door opening with measuring tape",
            "Truss connections to wall frame",
            "General photos from each corner",
        ],
        certificatesRequired: [
            "Frame inspection certificate (MANDATORY)",
            "Truss manufacturer's layout certification",
        ],
    },
    {
        id: "lockup",
        name: "Lockup / Enclosed",
        status: "upcoming",
        description: "External cladding, roof, windows and doors",
        typicalDuration: "4-6 weeks",
        mustBeDoneBefore: [
            "🏠 Building fully weather-proof",
            "🪟 All windows and doors installed and locking",
            "🌧️ Roof complete with flashings",
            "📸 Sarking/wrap photos BEFORE cladding covers it",
        ],
        shouldAlreadyBeDone: [
            "✅ Frame inspection passed",
            "✅ Stormwater connected to downpipes",
            "✅ All structural work complete",
        ],
        commonMistakes: [
            "❌ No sarking photos - can't prove it was installed",
            "❌ Roof flashing leaks - discovered when it rains",
            "❌ Window openings wrong - builder says 'that's what was specified'",
            "❌ Brick ties missing in cavity wall",
        ],
        whatHappens: [
            "Sarking/building wrap installed on frame",
            "Roof sheeting and flashings installed",
            "Gutters and downpipes connected to stormwater",
            "External cladding (brick/render/panels)",
            "Windows and external doors installed",
            "Building is weather-proof ('locked up')",
        ],
        checklistItems: [
            { id: "lu-1", text: "Roof flashings correctly installed", completed: false, critical: true, helpText: "Poor flashings = water damage. Check around chimneys, skylights, edges, valleys" },
            { id: "lu-2", text: "Sarking/wrap photographed BEFORE cladding", completed: false, critical: true, helpText: "This is your ONLY chance to verify it's there!" },
            { id: "lu-3", text: "Windows open and close smoothly", completed: false, critical: false },
            { id: "lu-4", text: "External cladding straight and even", completed: false, critical: false },
            { id: "lu-5", text: "No gaps between cladding and windows", completed: false, critical: true, helpText: "Gaps = water entry = mould" },
            { id: "lu-6", text: "Gutters fall toward downpipes (no ponding)", completed: false, critical: false },
            { id: "lu-7", text: "Downpipes connected to stormwater system", completed: false, critical: true },
        ],
        hiddenWorkWarnings: [
            "🏠 Wall sarking/building wrap - covered by cladding FOREVER",
            "🪟 Window flashings - hidden behind cladding",
            "🧱 Brick ties and cavity drainage - not visible after brickwork",
            "🌧️ Roof valleys and flashings - hard to inspect once complete",
        ],
        photosRequired: [
            "Sarking/wrap ALL walls BEFORE cladding goes on",
            "Window flashings before cladding",
            "Roof flashing details (valleys, edges, penetrations)",
            "Eave vents installed",
            "Cavity weep holes at base of brickwork",
        ],
        certificatesRequired: [
            "Wet area waterproofing certificate",
            "Roof plumber's certificate (if separate trade)",
        ],
    },
    {
        id: "fixing",
        name: "Fixing Stage",
        status: "upcoming",
        description: "Internal fit-out, insulation, and services",
        typicalDuration: "6-10 weeks",
        mustBeDoneBefore: [
            "🧯 ALL insulation photographed before gyprock",
            "⚡ Electrical rough-in complete and inspected",
            "🚿 Plumbing in walls complete and pressure tested",
            "🔊 Acoustic insulation in party walls verified",
        ],
        shouldAlreadyBeDone: [
            "✅ Lockup complete - building weather-tight",
            "✅ Stormwater connected and working",
            "✅ All external cladding complete",
            "✅ Wet area waterproofing done",
        ],
        commonMistakes: [
            "🚨 #1 COMPLAINT: Ceiling batts not installed - discovered after gyprock up!",
            "❌ Wall insulation missing in some rooms - can't check after lining",
            "❌ Power points in wrong spots - should have checked earlier",
            "❌ No photos of plumbing pressure test - no proof of leak test",
            "❌ Exhaust fans not ducted to outside - vent to ceiling cavity",
        ],
        whatHappens: [
            "Plumbing fit-off (pipes in walls)",
            "Electrical rough-in (all cables run)",
            "⚠️ INSULATION in walls AND ceiling",
            "Gyprock/plasterboard installed (covers everything!)",
            "Internal doors, skirting, architraves",
            "Kitchen and bathroom cabinetry",
            "Painting begins",
        ],
        checklistItems: [
            { id: "fx-1", text: "WALL INSULATION in ALL external walls before gyprock", completed: false, critical: true, helpText: "⚠️ Walk through EVERY room and photograph. Cannot check after gyprock!" },
            { id: "fx-2", text: "CEILING BATTS installed BEFORE ceiling goes up", completed: false, critical: true, helpText: "🚨 #1 COMPLAINT from homeowners! Once ceiling is up, you cannot verify!" },
            { id: "fx-3", text: "Acoustic insulation in party/internal walls", completed: false, critical: true, helpText: "Check spec - some internal walls need acoustic batts" },
            { id: "fx-4", text: "Electrical cables in correct locations", completed: false, critical: true },
            { id: "fx-5", text: "Power points match electrical plan", completed: false, critical: false },
            { id: "fx-6", text: "Plumbing pressure tested (ask for test certificate)", completed: false, critical: true },
            { id: "fx-7", text: "Exhaust fans ducted to OUTSIDE (not ceiling)", completed: false, critical: true, helpText: "Very common mistake - fans must duct outside, not into roof cavity" },
            { id: "fx-8", text: "Kitchen cabinets level and secure", completed: false, critical: false },
            { id: "fx-9", text: "Bathroom waterproofing certificate received", completed: false, critical: true },
        ],
        hiddenWorkWarnings: [
            "🚨🚨 CEILING BATTS - #1 homeowner complaint! MUST verify BEFORE gyprock!",
            "🚨 WALL INSULATION - Hidden forever after plasterboard",
            "🔌 Electrical cables - covered by gyprock, position can't be changed",
            "🚿 Plumbing inside walls - no access after lining",
            "🌀 Exhaust ducting - verify it goes outside BEFORE ceiling closes",
        ],
        photosRequired: [
            "EVERY room ceiling batts BEFORE gyprock (date stamp photos)",
            "ALL wall insulation in external walls",
            "Electrical rough-in before covering",
            "Plumbing in walls before covering",
            "Acoustic insulation in party walls",
            "Exhaust fan ducting going to exterior",
            "Plumbing pressure test gauge reading",
        ],
        certificatesRequired: [
            "Electrical rough-in inspection certificate",
            "Plumber's top-out/rough-in certificate",
            "Insulation certificate from installer",
            "Waterproofing certificate (bathrooms, laundry)",
        ],
    },
    {
        id: "completion",
        name: "Practical Completion",
        status: "upcoming",
        description: "Final fit-out and handover",
        typicalDuration: "2-4 weeks",
        mustBeDoneBefore: [
            "📋 Complete defect walk-through with builder",
            "📜 Receive Occupation Certificate",
            "🔑 All keys, remotes, and manuals handed over",
            "📄 All warranty documents collected",
        ],
        shouldAlreadyBeDone: [
            "✅ ALL insulation verified and photographed",
            "✅ Stormwater working properly",
            "✅ All certificates from previous stages",
            "✅ Electrical and plumbing final connections",
        ],
        commonMistakes: [
            "❌ Moved in before getting Occupation Certificate",
            "❌ Signed off on PCI without noting all defects",
            "❌ Didn't collect warranty documents - can't claim later",
            "❌ Paint touch-ups done quickly before drying - comes off",
            "❌ Didn't take meter readings - disputes over first bill",
        ],
        whatHappens: [
            "Final painting and touch-ups",
            "Floor coverings (carpet, tiles, timber)",
            "Appliances installed and connected",
            "Final electrical and plumbing connections",
            "Landscaping (if in contract)",
            "Professional clean",
            "Final defect inspection (PCI walk-through)",
            "Handover of keys and documents",
        ],
        checklistItems: [
            { id: "pc-1", text: "PCI walk-through completed with builder", completed: false, critical: true, helpText: "Take photos of EVERY defect found! Use defect list template." },
            { id: "pc-2", text: "All defects documented IN WRITING", completed: false, critical: true, helpText: "Email to builder with photos. Keep copies!" },
            { id: "pc-3", text: "Occupation Certificate received from certifier", completed: false, critical: true, helpText: "DO NOT move in without this! It's illegal." },
            { id: "pc-4", text: "All appliances working correctly", completed: false, critical: false },
            { id: "pc-5", text: "All keys and remotes received (garage, alarm, gates)", completed: false, critical: true },
            { id: "pc-6", text: "Owner's manuals for all equipment", completed: false, critical: false },
            { id: "pc-7", text: "All warranty documents collected", completed: false, critical: true },
            { id: "pc-8", text: "Meter readings recorded (water, gas, electricity)", completed: false, critical: false, helpText: "Photo each meter on handover day" },
            { id: "pc-9", text: "Request photos of hidden work from builder", completed: false, critical: true, helpText: "Ask for their insulation, plumbing, electrical photos" },
        ],
        hiddenWorkWarnings: [
            "⚠️ Nothing should be hidden at this stage!",
            "If you didn't verify insulation before gyprock - request builder's photos",
            "If builder has no photos of hidden work - that's a red flag 🚩",
        ],
        photosRequired: [
            "Final condition of every room (walls, floors, ceiling)",
            "Every defect with close-up detail",
            "Meter readings (water, gas, electricity)",
            "Exterior from all angles",
            "Driveway and landscaping complete",
        ],
        certificatesRequired: [
            "Occupation Certificate (MANDATORY before moving in)",
            "Home Warranty Insurance certificate",
            "Smoke alarm compliance certificate",
            "Electrical completion certificate",
            "Plumbing completion certificate",
            "All appliance warranties",
            "Swimming pool compliance (if applicable)",
        ],
    },
];

interface StageChecklistProps {
    projectId: string;
    currentStage?: string;
}

export default function StageChecklist({ projectId, currentStage = "frame" }: StageChecklistProps) {
    const [stages, setStages] = useState<StageData[]>(CONSTRUCTION_STAGES);
    const [expandedStage, setExpandedStage] = useState<string | null>(currentStage);
    const [showHelp, setShowHelp] = useState<string | null>(null);

    const toggleChecklistItem = (stageId: string, itemId: string) => {
        setStages(stages.map(stage => {
            if (stage.id === stageId) {
                return {
                    ...stage,
                    checklistItems: stage.checklistItems.map(item =>
                        item.id === itemId ? { ...item, completed: !item.completed } : item
                    ),
                };
            }
            return stage;
        }));
    };

    const getStageProgress = (stage: StageData) => {
        const total = stage.checklistItems.length;
        const completed = stage.checklistItems.filter(i => i.completed).length;
        return { total, completed, percent: total > 0 ? (completed / total) * 100 : 0 };
    };

    const getCriticalIncomplete = (stage: StageData) => {
        return stage.checklistItems.filter(i => i.critical && !i.completed);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold">🏗️ Construction Stages</h2>
                    <p className="text-muted-foreground">
                        Verify each stage before signing off - protect your investment
                    </p>
                </div>
            </div>

            {/* Timeline */}
            <div className="relative py-4">
                <div className="absolute left-5 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 via-primary to-gray-300" />

                {stages.map((stage, index) => {
                    const progress = getStageProgress(stage);
                    const criticalIncomplete = getCriticalIncomplete(stage);
                    const isExpanded = expandedStage === stage.id;

                    return (
                        <div key={stage.id} className="relative pl-14 pb-6">
                            {/* Stage Marker */}
                            <div
                                className={`absolute left-2 w-7 h-7 rounded-full border-4 flex items-center justify-center z-10 ${stage.status === "completed"
                                    ? "bg-green-500 border-green-500"
                                    : stage.status === "current"
                                        ? "bg-white border-primary"
                                        : "bg-white border-gray-300"
                                    }`}
                            >
                                {stage.status === "completed" && <span className="text-white text-sm">✓</span>}
                                {stage.status === "current" && <span className="w-3 h-3 bg-primary rounded-full" />}
                            </div>

                            {/* Stage Card */}
                            <div
                                className={`rounded-xl border-2 overflow-hidden transition-all ${stage.status === "current"
                                    ? "border-primary shadow-lg"
                                    : stage.status === "completed"
                                        ? "border-green-500/50 bg-green-50/30"
                                        : "border-border"
                                    }`}
                            >
                                {/* Stage Header */}
                                <button
                                    onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                                    className="w-full p-4 text-left flex justify-between items-center hover:bg-muted/30"
                                >
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-bold text-lg">{stage.name}</h3>
                                            {stage.status === "current" && (
                                                <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                                                    CURRENT
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{stage.description}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-sm font-medium">
                                                {progress.completed}/{progress.total}
                                            </div>
                                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all ${progress.percent === 100 ? "bg-green-500" : "bg-primary"}`}
                                                    style={{ width: `${progress.percent}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-xl">{isExpanded ? "▼" : "▶"}</span>
                                    </div>
                                </button>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="border-t border-border">
                                        {/* Hidden Work Warning */}
                                        {stage.hiddenWorkWarnings.length > 0 && (
                                            <div className="p-4 bg-red-50 border-b border-red-200">
                                                <div className="flex items-start gap-3">
                                                    <span className="text-2xl">⚠️</span>
                                                    <div>
                                                        <h4 className="font-bold text-red-800">Hidden Work Alert</h4>
                                                        <p className="text-sm text-red-700 mb-2">
                                                            These items will be covered and cannot be inspected later:
                                                        </p>
                                                        <ul className="text-sm text-red-700 space-y-1">
                                                            {stage.hiddenWorkWarnings.map((warning, i) => (
                                                                <li key={i}>• {warning}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Timing & Sequencing Info */}
                                        <div className="p-4 border-b border-border bg-blue-50/50">
                                            <div className="grid md:grid-cols-3 gap-4">
                                                {/* Duration */}
                                                <div>
                                                    <h5 className="font-semibold text-sm text-blue-800 mb-1">⏱️ Typical Duration</h5>
                                                    <p className="text-sm">{stage.typicalDuration}</p>
                                                </div>
                                                {/* Should Already Be Done */}
                                                <div>
                                                    <h5 className="font-semibold text-sm text-green-800 mb-1">✅ Should Already Be Done</h5>
                                                    <ul className="text-xs space-y-0.5">
                                                        {stage.shouldAlreadyBeDone.map((item, i) => (
                                                            <li key={i}>{item}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                {/* Must Complete Before Leaving */}
                                                <div>
                                                    <h5 className="font-semibold text-sm text-amber-800 mb-1">🚧 Must Complete This Stage</h5>
                                                    <ul className="text-xs space-y-0.5">
                                                        {stage.mustBeDoneBefore.map((item, i) => (
                                                            <li key={i}>{item}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Common Mistakes */}
                                        {stage.commonMistakes.length > 0 && (
                                            <div className="p-4 border-b border-border bg-amber-50/50">
                                                <h4 className="font-bold mb-2 text-amber-800">🚩 Common Homeowner Complaints</h4>
                                                <ul className="text-sm space-y-1">
                                                    {stage.commonMistakes.map((mistake, i) => (
                                                        <li key={i}>{mistake}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* What's Happening */}
                                        <div className="p-4 border-b border-border">
                                            <h4 className="font-bold mb-2">📋 What Happens in This Stage</h4>
                                            <ul className="text-sm space-y-1 text-muted-foreground">
                                                {stage.whatHappens.map((item, i) => (
                                                    <li key={i}>• {item}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Checklist */}
                                        <div className="p-4 border-b border-border">
                                            <h4 className="font-bold mb-3">✅ Check Before Sign-off</h4>
                                            {criticalIncomplete.length > 0 && (
                                                <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                                                    🚨 {criticalIncomplete.length} critical item(s) incomplete
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                {stage.checklistItems.map((item) => (
                                                    <div key={item.id} className="flex items-start gap-3">
                                                        <button
                                                            onClick={() => toggleChecklistItem(stage.id, item.id)}
                                                            className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center mt-0.5 ${item.completed
                                                                ? "bg-green-500 border-green-500"
                                                                : item.critical
                                                                    ? "border-red-500"
                                                                    : "border-gray-300"
                                                                }`}
                                                        >
                                                            {item.completed && <span className="text-white text-xs">✓</span>}
                                                        </button>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={item.completed ? "line-through text-muted-foreground" : ""}>
                                                                    {item.text}
                                                                </span>
                                                                {item.critical && !item.completed && (
                                                                    <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                                                                        CRITICAL
                                                                    </span>
                                                                )}
                                                                {item.helpText && (
                                                                    <button
                                                                        onClick={() => setShowHelp(showHelp === item.id ? null : item.id)}
                                                                        className="text-primary text-sm"
                                                                    >
                                                                        ℹ️
                                                                    </button>
                                                                )}
                                                            </div>
                                                            {showHelp === item.id && item.helpText && (
                                                                <p className="text-xs text-muted-foreground mt-1 p-2 bg-blue-50 rounded">
                                                                    {item.helpText}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Photos Required */}
                                        <div className="p-4 border-b border-border">
                                            <h4 className="font-bold mb-2">📸 Photos Required</h4>
                                            <ul className="text-sm space-y-1">
                                                {stage.photosRequired.map((photo, i) => (
                                                    <li key={i} className="flex items-center gap-2">
                                                        <span className="w-4 h-4 rounded border border-gray-300" />
                                                        {photo}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Certificates */}
                                        <div className="p-4">
                                            <h4 className="font-bold mb-2">📄 Certificates Required</h4>
                                            <ul className="text-sm space-y-1">
                                                {stage.certificatesRequired.map((cert, i) => (
                                                    <li key={i} className="flex items-center gap-2">
                                                        <span className="w-4 h-4 rounded border border-gray-300" />
                                                        {cert}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm">
                <h4 className="font-bold text-blue-800 mb-1">💡 Why This Matters</h4>
                <p className="text-blue-700">
                    Once work is covered (e.g., insulation behind gyprock), you can't inspect it without
                    destructive testing. Take photos BEFORE work gets covered and keep a record of
                    all inspections. This protects you if disputes arise later.
                </p>
            </div>
        </div>
    );
}
