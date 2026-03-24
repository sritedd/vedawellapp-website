"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface DbStage {
    id: string;
    name: string;
    status: string;
}

interface DbChecklistItem {
    id: string;
    stage_id: string;
    description: string;
    is_completed: boolean;
    is_critical: boolean;
    requires_photo: boolean;
    evidence_url: string | null;
}

// Static educational content keyed by stage name (lowercase normalized)
// This is Australian home building reference data — not project-specific
const STAGE_GUIDANCE: Record<string, {
    description: string;
    typicalDuration: string;
    mustBeDoneBefore: string[];
    shouldAlreadyBeDone: string[];
    commonMistakes: string[];
    whatHappens: string[];
    hiddenWorkWarnings: string[];
    photosRequired: string[];
    certificatesRequired: string[];
}> = {
    "site start": {
        description: "Ground preparation and service connections",
        typicalDuration: "1-2 weeks",
        mustBeDoneBefore: [
            "Stormwater drainage connected and tested",
            "Electrical conduit to meter box location",
            "Water and sewer connections complete",
            "Site survey and setout pegs in place",
        ],
        shouldAlreadyBeDone: [
            "Council DA/CDC approval",
            "BASIX certificate",
            "Home warranty insurance",
        ],
        commonMistakes: [
            "Stormwater not connected - causes flooding during construction",
            "Site drainage wrong - water pools under future slab",
            "Setout wrong by 100mm - discovered at frame stage",
        ],
        whatHappens: [
            "Site clearing and leveling",
            "Temporary fencing installed",
            "Underground services located and marked (Dial Before You Dig)",
            "Excavation for foundations",
            "Service connections (water, sewer, electrical conduit)",
            "Stormwater drainage installed and connected",
        ],
        hiddenWorkWarnings: [
            "STORMWATER PIPES - buried and hidden forever! Verify NOW.",
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
    "slab down": {
        description: "Foundation and underground plumbing",
        typicalDuration: "2-3 weeks (including curing)",
        mustBeDoneBefore: [
            "All under-slab plumbing positioned and photographed",
            "Reinforcement mesh/rebar inspected by engineer",
            "Slab dimensions verified against plans",
            "Termite barrier installed (if required)",
        ],
        shouldAlreadyBeDone: [
            "Stormwater connected (Site Start)",
            "Retaining walls complete (if any)",
            "Site levels/drainage correct",
        ],
        commonMistakes: [
            "Toilet waste in wrong position - costly to jackhammer later",
            "No photos of reinforcement - can't prove it's there",
            "Slab poured without engineer inspection",
            "Kitchen sink waste not in right spot - affects cabinet layout",
        ],
        whatHappens: [
            "Formwork for slab edges",
            "Plumbing rough-in UNDER slab (toilets, drains, showers)",
            "Termite barrier/mesh installed",
            "Steel reinforcement mesh laid",
            "Engineer inspection of reinforcement",
            "Concrete pour and curing (7+ days)",
        ],
        hiddenWorkWarnings: [
            "ALL PLUMBING UNDER SLAB - Once poured, NO ACCESS without jackhammering!",
            "Termite barrier - hidden under slab forever",
            "Reinforcement - completely hidden after pour",
        ],
        photosRequired: [
            "Reinforcement mesh BEFORE pour (every room)",
            "Plumbing locations under slab with measurements",
            "Toilet waste positions",
            "Slab edge thickness",
            "Termite barrier before pour",
        ],
        certificatesRequired: [
            "Engineer's slab inspection certificate",
            "Plumber's under-slab rough-in certificate",
            "Termite management certificate",
        ],
    },
    "frame stage": {
        description: "Structural frame and roof trusses",
        typicalDuration: "2-4 weeks",
        mustBeDoneBefore: [
            "Frame inspection by certifier (MANDATORY)",
            "All bracing and tie-downs installed",
            "Window/door openings verified to specs",
            "Photos of ALL structural connections",
        ],
        shouldAlreadyBeDone: [
            "Slab cured and inspected",
            "Stormwater connected",
            "Under-slab plumbing complete",
        ],
        commonMistakes: [
            "Window opening wrong size - discovered when windows arrive",
            "Frame not plumb - causes issues with doors/windows later",
            "Missing bracing - fails frame inspection",
            "No photos of tie-downs - can't prove they exist later",
        ],
        whatHappens: [
            "Wall frames erected (timber or steel)",
            "Roof trusses installed",
            "Bracing and tie-downs fitted per engineer specs",
            "Window and door openings framed",
            "Frame inspection by certifier (MANDATORY before cladding)",
        ],
        hiddenWorkWarnings: [
            "Frame connections - covered by cladding and plasterboard",
            "Bracing straps - hidden inside wall cavities",
            "Tie-down connections - covered during roofing",
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
    "lockup / enclosed": {
        description: "External cladding, roof, windows and doors",
        typicalDuration: "4-6 weeks",
        mustBeDoneBefore: [
            "Building fully weather-proof",
            "All windows and doors installed and locking",
            "Roof complete with flashings",
            "Sarking/wrap photos BEFORE cladding covers it",
        ],
        shouldAlreadyBeDone: [
            "Frame inspection passed",
            "Stormwater connected to downpipes",
            "All structural work complete",
        ],
        commonMistakes: [
            "No sarking photos - can't prove it was installed",
            "Roof flashing leaks - discovered when it rains",
            "Window openings wrong - builder says 'that was specified'",
            "Brick ties missing in cavity wall",
        ],
        whatHappens: [
            "Sarking/building wrap installed on frame",
            "Roof sheeting and flashings installed",
            "Gutters and downpipes connected to stormwater",
            "External cladding (brick/render/panels)",
            "Windows and external doors installed",
            "Building is weather-proof ('locked up')",
        ],
        hiddenWorkWarnings: [
            "Wall sarking/building wrap - covered by cladding FOREVER",
            "Window flashings - hidden behind cladding",
            "Brick ties and cavity drainage - not visible after brickwork",
            "Roof valleys and flashings - hard to inspect once complete",
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
    "fixing": {
        description: "Internal fit-out, insulation, and services",
        typicalDuration: "6-10 weeks",
        mustBeDoneBefore: [
            "ALL insulation photographed before gyprock",
            "Electrical rough-in complete and inspected",
            "Plumbing in walls complete and pressure tested",
            "Acoustic insulation in party walls verified",
        ],
        shouldAlreadyBeDone: [
            "Lockup complete - building weather-tight",
            "Stormwater connected and working",
            "All external cladding complete",
            "Wet area waterproofing done",
        ],
        commonMistakes: [
            "#1 COMPLAINT: Ceiling batts not installed - discovered after gyprock up!",
            "Wall insulation missing in some rooms - can't check after lining",
            "Power points in wrong spots - should have checked earlier",
            "Exhaust fans not ducted to outside - vent to ceiling cavity",
        ],
        whatHappens: [
            "Plumbing fit-off (pipes in walls)",
            "Electrical rough-in (all cables run)",
            "INSULATION in walls AND ceiling",
            "Gyprock/plasterboard installed (covers everything!)",
            "Internal doors, skirting, architraves",
            "Kitchen and bathroom cabinetry",
            "Painting begins",
        ],
        hiddenWorkWarnings: [
            "CEILING BATTS - #1 homeowner complaint! MUST verify BEFORE gyprock!",
            "WALL INSULATION - Hidden forever after plasterboard",
            "Electrical cables - covered by gyprock, position can't be changed",
            "Plumbing inside walls - no access after lining",
            "Exhaust ducting - verify it goes outside BEFORE ceiling closes",
        ],
        photosRequired: [
            "EVERY room ceiling batts BEFORE gyprock (date stamp photos)",
            "ALL wall insulation in external walls",
            "Electrical rough-in before covering",
            "Plumbing in walls before covering",
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
    "practical completion": {
        description: "Final fit-out and handover",
        typicalDuration: "2-4 weeks",
        mustBeDoneBefore: [
            "Complete defect walk-through with builder",
            "Receive Occupation Certificate",
            "All keys, remotes, and manuals handed over",
            "All warranty documents collected",
        ],
        shouldAlreadyBeDone: [
            "ALL insulation verified and photographed",
            "Stormwater working properly",
            "All certificates from previous stages",
            "Electrical and plumbing final connections",
        ],
        commonMistakes: [
            "Moved in before getting Occupation Certificate",
            "Signed off on PCI without noting all defects",
            "Didn't collect warranty documents - can't claim later",
            "Didn't take meter readings - disputes over first bill",
        ],
        whatHappens: [
            "Final painting and touch-ups",
            "Floor coverings (carpet, tiles, timber)",
            "Appliances installed and connected",
            "Final electrical and plumbing connections",
            "Professional clean",
            "Final defect inspection (PCI walk-through)",
            "Handover of keys and documents",
        ],
        hiddenWorkWarnings: [
            "Nothing should be hidden at this stage!",
            "If you didn't verify insulation before gyprock - request builder's photos",
            "If builder has no photos of hidden work - that's a red flag",
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
        ],
    },
};

// Try to match a DB stage name to static guidance
function findGuidance(stageName: string) {
    const lower = stageName.toLowerCase().trim();
    // Direct match
    if (STAGE_GUIDANCE[lower]) return STAGE_GUIDANCE[lower];
    // Partial match
    for (const [key, value] of Object.entries(STAGE_GUIDANCE)) {
        if (lower.includes(key) || key.includes(lower)) return value;
    }
    return null;
}

interface StageChecklistProps {
    projectId: string;
    currentStage?: string;
}

export default function StageChecklist({ projectId, currentStage }: StageChecklistProps) {
    const [stages, setStages] = useState<DbStage[]>([]);
    const [checklistItems, setChecklistItems] = useState<DbChecklistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedStage, setExpandedStage] = useState<string | null>(null);
    const [showHelp, setShowHelp] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient();

            // Fetch stages
            const { data: stageData, error: stageError } = await supabase
                .from("stages")
                .select("id, name, status")
                .eq("project_id", projectId)
                .order("order_index", { ascending: true });

            if (stageError) {
                setError("Failed to load stages. Please refresh.");
                setLoading(false);
                return;
            }

            const fetchedStages = stageData || [];
            setStages(fetchedStages);

            // Auto-expand the current stage
            if (fetchedStages.length > 0) {
                const current = fetchedStages.find((s: DbStage) => s.status === "in_progress")
                    || fetchedStages.find((s: DbStage) => s.status === "pending");
                if (current) setExpandedStage(current.id);
            }

            // Fetch all checklist items for this project's stages
            if (fetchedStages.length > 0) {
                const stageIds = fetchedStages.map((s: DbStage) => s.id);
                const { data: itemData } = await supabase
                    .from("checklist_items")
                    .select("id, stage_id, description, is_completed, is_critical, requires_photo, evidence_url")
                    .in("stage_id", stageIds);

                setChecklistItems(itemData || []);
            }

            setLoading(false);
        };

        fetchData();
    }, [projectId]);

    const toggleChecklistItem = async (itemId: string, currentValue: boolean) => {
        const supabase = createClient();
        const newValue = !currentValue;

        // Optimistic update
        setChecklistItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, is_completed: newValue } : item
        ));

        const { error: updateError } = await supabase
            .from("checklist_items")
            .update({
                is_completed: newValue,
                completed_at: newValue ? new Date().toISOString() : null,
            })
            .eq("id", itemId);

        if (updateError) {
            // Revert on failure
            setChecklistItems(prev => prev.map(item =>
                item.id === itemId ? { ...item, is_completed: currentValue } : item
            ));
        }
    };

    const getStageStatus = (stage: DbStage): "completed" | "current" | "upcoming" => {
        if (stage.status === "completed" || stage.status === "verified") return "completed";
        if (stage.status === "in_progress") return "current";
        // First pending stage is "current" if no stage is in_progress
        if (stage.status === "pending" && !stages.some(s => s.status === "in_progress")) {
            const firstPending = stages.find(s => s.status === "pending");
            if (firstPending?.id === stage.id) return "current";
        }
        return "upcoming";
    };

    const getStageItems = (stageId: string) => checklistItems.filter(i => i.stage_id === stageId);

    const getStageProgress = (stageId: string) => {
        const items = getStageItems(stageId);
        const total = items.length;
        const completed = items.filter(i => i.is_completed).length;
        return { total, completed, percent: total > 0 ? (completed / total) * 100 : 0 };
    };

    const getCriticalIncomplete = (stageId: string) => {
        return getStageItems(stageId).filter(i => i.is_critical && !i.is_completed);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
                <p className="font-medium">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold">Construction Stages</h2>
                    <p className="text-muted-foreground">
                        Verify each stage before signing off - protect your investment
                    </p>
                </div>
            </div>

            {stages.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-border rounded-xl">
                    <p className="text-muted-foreground">No stages configured for this project.</p>
                </div>
            ) : (
                <>
                    {/* Timeline */}
                    <div className="relative py-4">
                        <div className="absolute left-5 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 via-primary to-gray-300" />

                        {stages.map((stage) => {
                            const status = getStageStatus(stage);
                            const progress = getStageProgress(stage.id);
                            const criticalIncomplete = getCriticalIncomplete(stage.id);
                            const isExpanded = expandedStage === stage.id;
                            const guidance = findGuidance(stage.name);
                            const items = getStageItems(stage.id);

                            return (
                                <div key={stage.id} className="relative pl-14 pb-6">
                                    {/* Stage Marker */}
                                    <div
                                        className={`absolute left-2 w-7 h-7 rounded-full border-4 flex items-center justify-center z-10 ${status === "completed"
                                            ? "bg-green-500 border-green-500"
                                            : status === "current"
                                                ? "bg-white border-primary"
                                                : "bg-white border-gray-300"
                                            }`}
                                    >
                                        {status === "completed" && <span className="text-white text-sm">✓</span>}
                                        {status === "current" && <span className="w-3 h-3 bg-primary rounded-full" />}
                                    </div>

                                    {/* Stage Card */}
                                    <div
                                        className={`rounded-xl border-2 overflow-hidden transition-all ${status === "current"
                                            ? "border-primary shadow-lg"
                                            : status === "completed"
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
                                                    {status === "current" && (
                                                        <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                                                            CURRENT
                                                        </span>
                                                    )}
                                                </div>
                                                {guidance && (
                                                    <p className="text-sm text-muted-foreground">{guidance.description}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {items.length > 0 && (
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
                                                )}
                                                <span className="text-xl">{isExpanded ? "▼" : "▶"}</span>
                                            </div>
                                        </button>

                                        {/* Expanded Content */}
                                        {isExpanded && (
                                            <div className="border-t border-border">
                                                {/* Hidden Work Warning */}
                                                {guidance && guidance.hiddenWorkWarnings.length > 0 && (
                                                    <div className="p-4 bg-red-50 border-b border-red-200">
                                                        <div className="flex items-start gap-3">
                                                            <span className="text-2xl">⚠️</span>
                                                            <div>
                                                                <h4 className="font-bold text-red-800">Hidden Work Alert</h4>
                                                                <p className="text-sm text-red-700 mb-2">
                                                                    These items will be covered and cannot be inspected later:
                                                                </p>
                                                                <ul className="text-sm text-red-700 space-y-1">
                                                                    {guidance.hiddenWorkWarnings.map((warning, i) => (
                                                                        <li key={i}>• {warning}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Timing & Sequencing Info */}
                                                {guidance && (
                                                    <div className="p-4 border-b border-border bg-blue-50/50">
                                                        <div className="grid md:grid-cols-3 gap-4">
                                                            <div>
                                                                <h5 className="font-semibold text-sm text-blue-800 mb-1">Typical Duration</h5>
                                                                <p className="text-sm">{guidance.typicalDuration}</p>
                                                            </div>
                                                            <div>
                                                                <h5 className="font-semibold text-sm text-green-800 mb-1">Should Already Be Done</h5>
                                                                <ul className="text-xs space-y-0.5">
                                                                    {guidance.shouldAlreadyBeDone.map((item, i) => (
                                                                        <li key={i}>✅ {item}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                            <div>
                                                                <h5 className="font-semibold text-sm text-amber-800 mb-1">Must Complete This Stage</h5>
                                                                <ul className="text-xs space-y-0.5">
                                                                    {guidance.mustBeDoneBefore.map((item, i) => (
                                                                        <li key={i}>• {item}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Common Mistakes */}
                                                {guidance && guidance.commonMistakes.length > 0 && (
                                                    <div className="p-4 border-b border-border bg-amber-50/50">
                                                        <h4 className="font-bold mb-2 text-amber-800">Common Homeowner Complaints</h4>
                                                        <ul className="text-sm space-y-1">
                                                            {guidance.commonMistakes.map((mistake, i) => (
                                                                <li key={i}>❌ {mistake}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* What's Happening */}
                                                {guidance && (
                                                    <div className="p-4 border-b border-border">
                                                        <h4 className="font-bold mb-2">What Happens in This Stage</h4>
                                                        <ul className="text-sm space-y-1 text-muted-foreground">
                                                            {guidance.whatHappens.map((item, i) => (
                                                                <li key={i}>• {item}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Checklist from DB */}
                                                <div className="p-4 border-b border-border">
                                                    <h4 className="font-bold mb-3">Check Before Sign-off</h4>
                                                    {items.length === 0 ? (
                                                        <p className="text-sm text-muted-foreground">No checklist items for this stage.</p>
                                                    ) : (
                                                        <>
                                                            {criticalIncomplete.length > 0 && (
                                                                <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                                                                    {criticalIncomplete.length} critical item(s) incomplete
                                                                </div>
                                                            )}
                                                            <div className="space-y-2">
                                                                {items.map((item) => (
                                                                    <div key={item.id} className="flex items-start gap-3">
                                                                        <button
                                                                            onClick={() => toggleChecklistItem(item.id, item.is_completed)}
                                                                            className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center mt-0.5 ${item.is_completed
                                                                                ? "bg-green-500 border-green-500"
                                                                                : item.is_critical
                                                                                    ? "border-red-500"
                                                                                    : "border-gray-300"
                                                                                }`}
                                                                        >
                                                                            {item.is_completed && <span className="text-white text-xs">✓</span>}
                                                                        </button>
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className={item.is_completed ? "line-through text-muted-foreground" : ""}>
                                                                                    {item.description}
                                                                                </span>
                                                                                {item.is_critical && !item.is_completed && (
                                                                                    <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                                                                                        CRITICAL
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Photos Required */}
                                                {guidance && (
                                                    <div className="p-4 border-b border-border">
                                                        <h4 className="font-bold mb-2">Photos Required</h4>
                                                        <ul className="text-sm space-y-1">
                                                            {guidance.photosRequired.map((photo, i) => (
                                                                <li key={i} className="flex items-center gap-2">
                                                                    <span className="w-4 h-4 rounded border border-gray-300 flex-shrink-0" />
                                                                    {photo}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Certificates */}
                                                {guidance && (
                                                    <div className="p-4">
                                                        <h4 className="font-bold mb-2">Certificates Required</h4>
                                                        <ul className="text-sm space-y-1">
                                                            {guidance.certificatesRequired.map((cert, i) => (
                                                                <li key={i} className="flex items-center gap-2">
                                                                    <span className="w-4 h-4 rounded border border-gray-300 flex-shrink-0" />
                                                                    {cert}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Info Box */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm">
                        <h4 className="font-bold text-blue-800 mb-1">Why This Matters</h4>
                        <p className="text-blue-700">
                            Once work is covered (e.g., insulation behind gyprock), you can&apos;t inspect it without
                            destructive testing. Take photos BEFORE work gets covered and keep a record of
                            all inspections. Under the NSW Home Building Act, you have a statutory warranty
                            (2 years general, 6 years structural) from the date of completion.
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
