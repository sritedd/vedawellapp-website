/**
 * Stage-name → canonical-key mapping.
 *
 * The workflow JSON uses canonical ids (`slab`, `frame`, `pre_plasterboard`)
 * but the DB stores human stage NAMES ("Slab / Footings", "Frame Stage",
 * "Pre-Plasterboard"). Naive normalisation ("slab_footings") never matches
 * the canonical keys, which silently killed every stage-aware feature —
 * SmartDashboard guidance, tab relevance, dodgy-builder warnings, and the
 * critical pre-plasterboard banner — for 7 of 8 stages in all states.
 *
 * This helper accepts either form (raw name or already-underscored slug)
 * and returns the canonical key. Unknown stages fall back to a clean slug
 * so consumers can still use the value as a stable identifier.
 */

// NOTE: "completion" is intentionally absent. Some workflow categories use the
// stage id `completion` (name "Final Inspection") while new_build uses
// `practical_completion` for the same logical stage. We collapse both to
// `practical_completion` (via the fuzzy pass) so guidance, tabs, and warnings
// all resolve to the one canonical key.
const CANONICAL_KEYS = new Set([
    "site_start", "slab", "frame", "lockup", "pre_plasterboard", "fixing",
    "practical_completion", "warranty", "planning", "building_permit",
    "approval", "demolition", "excavation", "footings", "roof",
]);

export function stageNameToKey(name: string | null | undefined): string {
    if (!name) return "";

    // Pass 1: strict slug. Strip parentheticals ("(PC)"), collapse all
    // separators (space, slash, hyphen, plus) to single underscores.
    const slug = name
        .toLowerCase()
        .replace(/\(.*?\)/g, "")
        .trim()
        .replace(/[\s/\-+]+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");
    if (CANONICAL_KEYS.has(slug)) return slug;

    // Pass 2: fuzzy phrase matching. Normalise underscores/hyphens to spaces
    // so already-slugged input ("slab_footings") matches too. Order matters —
    // more specific phrases first.
    const n = name.toLowerCase().replace(/[_\-]+/g, " ");

    if (n.includes("site start")) return "site_start";
    if (n.includes("plasterboard") || n.includes("pre plaster") || n.includes("drywall")) return "pre_plasterboard";
    if (n.includes("building permit")) return "building_permit";
    if (n.includes("planning")) return "planning";
    if (n.includes("slab") || /\bbase\b/.test(n)) return "slab";
    if (n.includes("frame") || n.includes("framing")) return "frame";
    if (n.includes("lockup") || n.includes("lock up") || n.includes("enclosed") || n.includes("weatherproof")) return "lockup";
    if (n.includes("fixing") || n.includes("fitout") || n.includes("fit out")) return "fixing";
    if (n.includes("practical") || n.includes("handover") || n.includes("pci")) return "practical_completion";
    if (n.includes("final inspection") || n.includes("completion")) return "practical_completion";
    if (n.includes("warranty") || n.includes("maintenance")) return "warranty";
    if (n.includes("approval") || n.includes("cdc")) return "approval";
    if (n.includes("excavation") || n.includes("underpinning")) return "excavation";
    if (n.includes("demolition")) return "demolition";
    if (n.includes("footing")) return "footings";
    if (n.includes("roof")) return "roof";

    return slug;
}
